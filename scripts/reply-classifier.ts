/**
 * Reply classifier for outreach campaign.
 * Classifies incoming email replies into one of 12 categories.
 *
 * Stub — T-090 will implement the actual classification logic.
 */

export type ReplyCategory =
  | 'interested'
  | 'meeting_request'
  | 'question'
  | 'not_interested'
  | 'wrong_person'
  | 'angry'
  | 'unsubscribe'
  | 'out_of_office'
  | 'bounced_hard'
  | 'bounced_soft'
  | 'spam_complaint'
  | 'competitor';

export interface ClassifiedReply {
  category: ReplyCategory;
  confidence: number;
  shouldAutoRespond: boolean;
  shouldFlag: boolean;
  shouldSuppress: boolean;
}

/**
 * Classify an email reply body into one of 12 categories.
 * T-090 will implement this — likely using pattern matching or LLM classification.
 */
export function classifyReply(_body: string, _subject?: string): ClassifiedReply {
  throw new Error('Not implemented — T-090 will implement this');
}

/** Categories that require Julian's approval before any action */
export const FLAG_CATEGORIES: ReplyCategory[] = [
  'interested',
  'meeting_request',
  'wrong_person',
  'angry',
];

/** Categories that trigger automatic suppression */
export const SUPPRESS_CATEGORIES: ReplyCategory[] = [
  'not_interested',
  'unsubscribe',
  'spam_complaint',
  'competitor',
  'bounced_hard',
];

/** Categories that get an automatic response */
export const AUTO_RESPOND_CATEGORIES: ReplyCategory[] = ['question', 'not_interested'];
