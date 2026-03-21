import { describe, it, expect } from 'vitest';
import {
  classifyReply,
  FLAG_CATEGORIES,
  SUPPRESS_CATEGORIES,
  AUTO_RESPOND_CATEGORIES,
  type ReplyCategory,
} from '../reply-classifier';

describe('reply classifier', () => {
  // Helper: assert category and behavioral flags
  function expectCategory(body: string, expected: ReplyCategory, subject?: string) {
    const result = classifyReply(body, subject);
    expect(result.category).toBe(expected);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);

    // Verify behavioral flags match category constants
    expect(result.shouldFlag).toBe(FLAG_CATEGORIES.includes(expected));
    expect(result.shouldSuppress).toBe(SUPPRESS_CATEGORIES.includes(expected));
    expect(result.shouldAutoRespond).toBe(AUTO_RESPOND_CATEGORIES.includes(expected));
  }

  describe('categories that flag for Julian', () => {
    it('classifies interested reply', () => {
      expectCategory(
        'This looks really interesting! We are currently evaluating webhook solutions. Can you tell me more about your pricing for high volume?',
        'interested',
      );
    });

    it('classifies meeting request', () => {
      expectCategory(
        'I would love to set up a call to discuss this further. Are you available Thursday?',
        'meeting_request',
      );
    });

    it('classifies wrong person reply', () => {
      expectCategory(
        "I'm not the right person for this. You should reach out to our CTO, Sarah, at sarah@example.com.",
        'wrong_person',
      );
    });

    it('classifies angry reply', () => {
      expectCategory(
        "Stop emailing me. I never signed up for this garbage. This is spam and I'm reporting you.",
        'angry',
      );
    });
  });

  describe('categories that auto-respond', () => {
    it('classifies factual question', () => {
      expectCategory(
        'Does EmitHQ support self-hosting? What license is the server under?',
        'question',
      );
    });

    it('classifies not interested politely', () => {
      expectCategory(
        "Thanks for reaching out but we're happy with our current solution. Not looking to switch right now.",
        'not_interested',
      );
    });
  });

  describe('categories that auto-handle silently', () => {
    it('classifies unsubscribe request', () => {
      expectCategory('Unsubscribe me from this list. Remove my email.', 'unsubscribe');
    });

    it('classifies out of office', () => {
      expectCategory(
        'I am currently out of the office and will return on April 5th. I will have limited access to email.',
        'out_of_office',
        'Out of Office: Re: Webhook infrastructure for Trigger.dev',
      );
    });

    it('classifies hard bounce', () => {
      expectCategory(
        'This mailbox does not exist. The email address you tried to reach is not available. Please try double-checking the recipient email address for typos.',
        'bounced_hard',
      );
    });

    it('classifies soft bounce', () => {
      expectCategory(
        'Mailbox is full. The recipient mailbox has exceeded its storage quota. Please try again later.',
        'bounced_soft',
      );
    });

    it('classifies spam complaint', () => {
      expectCategory(
        'This message has been reported as spam. Your sending reputation may be affected.',
        'spam_complaint',
      );
    });

    it('classifies competitor reply', () => {
      expectCategory(
        "We actually work at Svix / Hookdeck / Convoy. Thanks for the email but we're a competitor.",
        'competitor',
      );
    });
  });

  describe('edge cases', () => {
    it('handles empty body', () => {
      const result = classifyReply('');
      expect(result.category).toBeDefined();
      expect(typeof result.confidence).toBe('number');
    });

    it('handles ambiguous reply (should pick closest match)', () => {
      const result = classifyReply(
        "Interesting but we're not ready to switch yet. Maybe next quarter.",
      );
      // Ambiguous between interested and not_interested — either is acceptable
      expect(['interested', 'not_interested']).toContain(result.category);
    });

    it('uses subject line for classification when body is sparse', () => {
      const result = classifyReply('Thanks', 'Re: Out of Office: Webhook infrastructure');
      expect(result.category).toBe('out_of_office');
    });

    it('returns confidence between 0 and 1 for all categories', () => {
      const bodies = [
        'Tell me more',
        'Not interested',
        'Unsubscribe',
        'Out of office until March 30',
      ];
      for (const body of bodies) {
        const result = classifyReply(body);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('category constant arrays', () => {
    it('FLAG_CATEGORIES contains exactly the right categories', () => {
      expect(FLAG_CATEGORIES).toEqual(
        expect.arrayContaining(['interested', 'meeting_request', 'wrong_person', 'angry']),
      );
      expect(FLAG_CATEGORIES).toHaveLength(4);
    });

    it('SUPPRESS_CATEGORIES contains exactly the right categories', () => {
      expect(SUPPRESS_CATEGORIES).toEqual(
        expect.arrayContaining([
          'not_interested',
          'unsubscribe',
          'spam_complaint',
          'competitor',
          'bounced_hard',
        ]),
      );
      expect(SUPPRESS_CATEGORIES).toHaveLength(5);
    });

    it('AUTO_RESPOND_CATEGORIES contains exactly the right categories', () => {
      expect(AUTO_RESPOND_CATEGORIES).toEqual(
        expect.arrayContaining(['question', 'not_interested']),
      );
      expect(AUTO_RESPOND_CATEGORIES).toHaveLength(2);
    });

    it('no category appears in both FLAG and AUTO_RESPOND', () => {
      const overlap = FLAG_CATEGORIES.filter((c) => AUTO_RESPOND_CATEGORIES.includes(c));
      expect(overlap).toHaveLength(0);
    });

    it('not_interested is intentionally in both SUPPRESS and AUTO_RESPOND (auto-respond then suppress)', () => {
      // Precedence: send gracious close email first, then suppress from future touches
      expect(SUPPRESS_CATEGORIES).toContain('not_interested');
      expect(AUTO_RESPOND_CATEGORIES).toContain('not_interested');
    });

    it('no FLAG category appears in SUPPRESS (flagged items need Julian review before suppression)', () => {
      const overlap = FLAG_CATEGORIES.filter((c) => SUPPRESS_CATEGORIES.includes(c));
      expect(overlap).toHaveLength(0);
    });
  });
});
