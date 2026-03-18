import { adminDb } from '../db/client';
import { analyticsEvents } from '../db/schema';

export type AnalyticsEventName =
  | 'org.created'
  | 'first_event_sent'
  | 'subscription.created'
  | 'subscription.canceled'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'endpoint.created'
  | 'quota.warning_80pct'
  | 'quota.limit_reached'
  | 'api_key.created'
  | 'api_key.rotated';

/**
 * Track a product analytics event. Fire-and-forget — never blocks the request.
 * Uses adminDb (no RLS) since analytics are cross-tenant aggregated.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  orgId?: string,
  properties?: Record<string, unknown>,
): void {
  adminDb
    .insert(analyticsEvents)
    .values({
      orgId: orgId ?? null,
      eventName,
      properties: properties ?? null,
    })
    .catch(() => {}); // best-effort — analytics should never break the request
}
