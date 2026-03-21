import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  readCampaign,
  writeCampaign,
  addTarget,
  recordTouch,
  updateTargetStatus,
  appendEvent,
  readSuppressionList,
  isSuppressed,
  addToSuppressionList,
  type CampaignState,
  type Target,
  type Touch,
} from '../campaign-state';

describe('campaign state management', () => {
  let tmpDir: string;
  let campaignPath: string;
  let eventsPath: string;
  let suppressionPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'emithq-test-'));
    campaignPath = join(tmpDir, 'campaign.json');
    eventsPath = join(tmpDir, 'events.jsonl');
    suppressionPath = join(tmpDir, 'suppression-list.txt');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeTarget = (overrides: Partial<Target> = {}): Target => ({
    id: 'test-001',
    name: 'Test User',
    email: 'test@example.com',
    company: 'TestCorp',
    competitor: 'Svix',
    repoUrl: 'testcorp/repo',
    status: 'queued',
    currentTouch: 0,
    touches: [],
    lastReplyCategory: null,
    ...overrides,
  });

  const makeTouch = (overrides: Partial<Touch> = {}): Touch => ({
    touch: 1,
    sentAt: '2026-03-21T08:00:00Z',
    resendId: 're_abc123',
    status: 'sent',
    ...overrides,
  });

  describe('readCampaign / writeCampaign', () => {
    it('returns empty state when file does not exist', () => {
      const state = readCampaign(campaignPath);
      expect(state.targets).toEqual([]);
    });

    it('reads back what was written', () => {
      const state: CampaignState = {
        targets: [makeTarget()],
      };
      writeCampaign(state, campaignPath);
      const read = readCampaign(campaignPath);
      expect(read.targets).toHaveLength(1);
      expect(read.targets[0].id).toBe('test-001');
      expect(read.targets[0].email).toBe('test@example.com');
    });

    it('persists multiple targets', () => {
      const state: CampaignState = {
        targets: [
          makeTarget({ id: '001', email: 'a@test.com' }),
          makeTarget({ id: '002', email: 'b@test.com' }),
          makeTarget({ id: '003', email: 'c@test.com' }),
        ],
      };
      writeCampaign(state, campaignPath);
      const read = readCampaign(campaignPath);
      expect(read.targets).toHaveLength(3);
    });

    it('writes valid JSON to disk', () => {
      writeCampaign({ targets: [makeTarget()] }, campaignPath);
      const raw = readFileSync(campaignPath, 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });
  });

  // T-090: remove .skip when addTarget is implemented
  describe.skip('addTarget', () => {
    it('adds a target to empty state', () => {
      const state: CampaignState = { targets: [] };
      const result = addTarget(state, makeTarget());
      expect(result.targets).toHaveLength(1);
      expect(result.targets[0].id).toBe('test-001');
    });

    it('preserves existing targets when adding', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'existing' })],
      };
      const result = addTarget(state, makeTarget({ id: 'new-target' }));
      expect(result.targets).toHaveLength(2);
      expect(result.targets.map((t) => t.id)).toContain('existing');
      expect(result.targets.map((t) => t.id)).toContain('new-target');
    });

    it('does not mutate the original state', () => {
      const state: CampaignState = { targets: [] };
      addTarget(state, makeTarget());
      expect(state.targets).toHaveLength(0);
    });
  });

  // T-090: remove .skip when recordTouch is implemented
  describe.skip('recordTouch', () => {
    it('appends touch to the correct target', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'target-1' })],
      };
      const touch = makeTouch({ touch: 1 });
      const result = recordTouch(state, 'target-1', touch);
      expect(result.targets[0].touches).toHaveLength(1);
      expect(result.targets[0].touches[0].resendId).toBe('re_abc123');
    });

    it('increments currentTouch', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'target-1', currentTouch: 0 })],
      };
      const result = recordTouch(state, 'target-1', makeTouch({ touch: 1 }));
      expect(result.targets[0].currentTouch).toBe(1);
    });

    it('updates target status to active', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'target-1', status: 'queued' })],
      };
      const result = recordTouch(state, 'target-1', makeTouch());
      expect(result.targets[0].status).toBe('active');
    });

    it('does not affect other targets', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'target-1' }), makeTarget({ id: 'target-2' })],
      };
      const result = recordTouch(state, 'target-1', makeTouch());
      expect(result.targets[1].touches).toHaveLength(0);
      expect(result.targets[1].currentTouch).toBe(0);
    });

    it('throws for unknown target ID', () => {
      const state: CampaignState = { targets: [makeTarget({ id: 'target-1' })] };
      expect(() => recordTouch(state, 'nonexistent', makeTouch())).toThrow();
    });

    it('does not mutate the original state', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'target-1', currentTouch: 0 })],
      };
      recordTouch(state, 'target-1', makeTouch());
      expect(state.targets[0].currentTouch).toBe(0);
      expect(state.targets[0].touches).toHaveLength(0);
    });
  });

  // T-090: remove .skip when updateTargetStatus is implemented
  describe.skip('updateTargetStatus', () => {
    it('updates status for the correct target', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'target-1', status: 'active' })],
      };
      const result = updateTargetStatus(state, 'target-1', 'suppressed');
      expect(result.targets[0].status).toBe('suppressed');
    });

    it('throws for unknown target ID', () => {
      const state: CampaignState = { targets: [] };
      expect(() => updateTargetStatus(state, 'nonexistent', 'bounced')).toThrow();
    });

    it('does not mutate the original state', () => {
      const state: CampaignState = {
        targets: [makeTarget({ id: 'target-1', status: 'active' })],
      };
      updateTargetStatus(state, 'target-1', 'suppressed');
      expect(state.targets[0].status).toBe('active');
    });
  });

  describe('appendEvent', () => {
    it('creates file and writes first event', () => {
      const event = {
        ts: '2026-03-21T08:00:00Z',
        type: 'send',
        targetId: 'target-1',
        touch: 1,
        resendId: 're_abc',
      };
      appendEvent(event, eventsPath);
      const raw = readFileSync(eventsPath, 'utf-8').trim();
      const parsed = JSON.parse(raw);
      expect(parsed.type).toBe('send');
      expect(parsed.targetId).toBe('target-1');
    });

    it('appends multiple events as separate lines', () => {
      appendEvent({ ts: '2026-03-21T08:00:00Z', type: 'send' }, eventsPath);
      appendEvent({ ts: '2026-03-21T08:01:00Z', type: 'delivered' }, eventsPath);
      appendEvent({ ts: '2026-03-21T08:02:00Z', type: 'bounced' }, eventsPath);

      const lines = readFileSync(eventsPath, 'utf-8').trim().split('\n');
      expect(lines).toHaveLength(3);
      expect(JSON.parse(lines[0]).type).toBe('send');
      expect(JSON.parse(lines[1]).type).toBe('delivered');
      expect(JSON.parse(lines[2]).type).toBe('bounced');
    });

    it('each line is valid JSON', () => {
      for (let i = 0; i < 5; i++) {
        appendEvent({ ts: new Date().toISOString(), type: `event-${i}` }, eventsPath);
      }
      const lines = readFileSync(eventsPath, 'utf-8').trim().split('\n');
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });
  });

  describe('suppression list', () => {
    it('returns empty array when file does not exist', () => {
      const list = readSuppressionList(suppressionPath);
      expect(list).toEqual([]);
    });

    it('isSuppressed returns false for empty list', () => {
      expect(isSuppressed('test@example.com', suppressionPath)).toBe(false);
    });

    it('adds email and confirms suppression', () => {
      addToSuppressionList('bad@example.com', suppressionPath);
      expect(isSuppressed('bad@example.com', suppressionPath)).toBe(true);
    });

    it('is case-insensitive', () => {
      addToSuppressionList('Bad@Example.COM', suppressionPath);
      expect(isSuppressed('bad@example.com', suppressionPath)).toBe(true);
      expect(isSuppressed('BAD@EXAMPLE.COM', suppressionPath)).toBe(true);
    });

    it('does not suppress non-listed emails', () => {
      addToSuppressionList('bad@example.com', suppressionPath);
      expect(isSuppressed('good@example.com', suppressionPath)).toBe(false);
    });

    it('handles multiple suppressed emails', () => {
      addToSuppressionList('a@test.com', suppressionPath);
      addToSuppressionList('b@test.com', suppressionPath);
      addToSuppressionList('c@test.com', suppressionPath);
      expect(isSuppressed('a@test.com', suppressionPath)).toBe(true);
      expect(isSuppressed('b@test.com', suppressionPath)).toBe(true);
      expect(isSuppressed('c@test.com', suppressionPath)).toBe(true);
      expect(isSuppressed('d@test.com', suppressionPath)).toBe(false);
    });

    it('trims whitespace from emails', () => {
      addToSuppressionList('  spaced@example.com  ', suppressionPath);
      expect(isSuppressed('spaced@example.com', suppressionPath)).toBe(true);
    });
  });
});
