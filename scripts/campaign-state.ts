/**
 * Campaign state management for outreach.
 * Reads/writes campaign.json and events.jsonl.
 *
 * Stub — T-090 will implement the actual state management.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';

export interface Touch {
  touch: number;
  sentAt: string;
  resendId: string;
  status: 'sent' | 'delivered' | 'bounced' | 'complained';
}

export type TargetStatus = 'queued' | 'active' | 'suppressed' | 'bounced' | 'replied' | 'converted';

export interface Target {
  id: string;
  name: string;
  email: string;
  company: string;
  competitor: string;
  repoUrl: string;
  status: TargetStatus;
  currentTouch: number;
  touches: Touch[];
  lastReplyCategory: string | null;
}

export interface CampaignState {
  targets: Target[];
}

export interface CampaignEvent {
  ts: string;
  type: string;
  targetId?: string;
  touch?: number;
  resendId?: string;
  category?: string;
  from?: string;
  hard?: boolean;
  [key: string]: unknown;
}

const DEFAULT_CAMPAIGN_PATH = 'docs/outreach/campaign.json';
const DEFAULT_EVENTS_PATH = 'docs/outreach/events.jsonl';
const DEFAULT_SUPPRESSION_PATH = 'docs/outreach/suppression-list.txt';

/**
 * Read campaign state from JSON file.
 */
export function readCampaign(path = DEFAULT_CAMPAIGN_PATH): CampaignState {
  if (!existsSync(path)) {
    return { targets: [] };
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * Write campaign state to JSON file.
 */
export function writeCampaign(state: CampaignState, path = DEFAULT_CAMPAIGN_PATH): void {
  writeFileSync(path, JSON.stringify(state, null, 2) + '\n');
}

/**
 * Add a new target to the campaign.
 */
export function addTarget(state: CampaignState, target: Target): CampaignState {
  throw new Error('Not implemented — T-090 will implement this');
}

/**
 * Record a touch (email sent) for a target.
 */
export function recordTouch(state: CampaignState, targetId: string, touch: Touch): CampaignState {
  throw new Error('Not implemented — T-090 will implement this');
}

/**
 * Update a target's status.
 */
export function updateTargetStatus(
  state: CampaignState,
  targetId: string,
  status: TargetStatus,
): CampaignState {
  throw new Error('Not implemented — T-090 will implement this');
}

/**
 * Append an event to the JSONL event log.
 */
export function appendEvent(event: CampaignEvent, path = DEFAULT_EVENTS_PATH): void {
  appendFileSync(path, JSON.stringify(event) + '\n');
}

/**
 * Read the suppression list.
 */
export function readSuppressionList(path = DEFAULT_SUPPRESSION_PATH): string[] {
  if (!existsSync(path)) {
    return [];
  }
  return readFileSync(path, 'utf-8')
    .split('\n')
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Check if an email is suppressed.
 */
export function isSuppressed(email: string, path = DEFAULT_SUPPRESSION_PATH): boolean {
  const list = readSuppressionList(path);
  return list.includes(email.toLowerCase().trim());
}

/**
 * Add an email to the suppression list.
 */
export function addToSuppressionList(email: string, path = DEFAULT_SUPPRESSION_PATH): void {
  appendFileSync(path, email.toLowerCase().trim() + '\n');
}
