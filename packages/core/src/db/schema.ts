import { sql, relations } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  pgRole,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// The role the application connects as at runtime (RLS enforced)
export const appUser = pgRole('app_user').existing();

// Reusable restrictive tenant isolation policy
const tenantPolicy = (tableName: string) =>
  pgPolicy(`${tableName}_tenant_isolation`, {
    as: 'restrictive',
    for: 'all',
    to: appUser,
    using: sql`org_id = current_setting('app.current_tenant')::uuid`,
    withCheck: sql`org_id = current_setting('app.current_tenant')::uuid`,
  });

// ─── Organizations ──────────────────────────────────────────────────────────
// No RLS — accessed by admin role for org lookup before tenant context is set
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').unique(), // Clerk organization ID (dashboard auth)
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  tier: text('tier').notNull().default('free'),
  eventCountMonth: integer('event_count_month').default(0),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  subscriptionStatus: text('subscription_status').notNull().default('free'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Billing Events ────────────────────────────────────────────────────────
// Idempotent Stripe webhook processing — deduplicate by stripe_event_id
export const billingEvents = pgTable('billing_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
});

// ─── API Keys ───────────────────────────────────────────────────────────────
// Separate table for multiple active keys per org, zero-downtime rotation
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    keyHash: text('key_hash').notNull().unique(),
    name: text('name').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_api_keys_active')
      .on(t.keyHash)
      .where(sql`revoked_at IS NULL`),
    index('idx_api_keys_org').on(t.orgId),
  ],
);

// ─── Applications ───────────────────────────────────────────────────────────
export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    uid: text('uid'),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex('applications_org_uid_idx').on(t.orgId, t.uid), tenantPolicy('applications')],
);

// ─── Endpoints ──────────────────────────────────────────────────────────────
export const endpoints = pgTable(
  'endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appId: uuid('app_id')
      .notNull()
      .references(() => applications.id),
    orgId: uuid('org_id').notNull(),
    uid: text('uid'),
    url: text('url').notNull(),
    description: text('description'),
    signingSecret: text('signing_secret').notNull(),
    eventTypeFilter: text('event_type_filter').array(),
    disabled: boolean('disabled').default(false),
    disabledReason: text('disabled_reason'),
    failureCount: integer('failure_count').default(0),
    rateLimit: integer('rate_limit'),
    transformRules: jsonb('transform_rules'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_endpoints_app')
      .on(t.appId)
      .where(sql`NOT disabled`),
    tenantPolicy('endpoints'),
  ],
);

// ─── Messages ───────────────────────────────────────────────────────────────
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appId: uuid('app_id')
      .notNull()
      .references(() => applications.id),
    orgId: uuid('org_id').notNull(),
    eventId: text('event_id'),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('messages_app_event_idx').on(t.appId, t.eventId),
    index('idx_messages_app_created').on(t.appId, t.createdAt),
    tenantPolicy('messages'),
  ],
);

// ─── Delivery Attempts ──────────────────────────────────────────────────────
export const deliveryAttempts = pgTable(
  'delivery_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id),
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => endpoints.id),
    orgId: uuid('org_id').notNull(),
    attemptNumber: integer('attempt_number').notNull(),
    status: text('status').notNull().default('pending'),
    responseStatus: integer('response_status'),
    responseBody: text('response_body'),
    responseTimeMs: integer('response_time_ms'),
    errorMessage: text('error_message'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_attempts_retry')
      .on(t.endpointId, t.status, t.nextAttemptAt)
      .where(sql`status IN ('pending', 'failed')`),
    index('idx_attempts_message').on(t.messageId),
    tenantPolicy('delivery_attempts'),
  ],
);

// ─── Inbound Sources ────────────────────────────────────────────────────────
export const inboundSources = pgTable(
  'inbound_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    provider: text('provider').notNull(),
    label: text('label'),
    signingSecret: text('signing_secret').notNull(),
    endpointPath: text('endpoint_path').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (_t) => [tenantPolicy('inbound_sources')],
);

// ─── Analytics Events ──────────────────────────────────────────────────────
// Lightweight product analytics — tracks key user actions for funnel analysis
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').references(() => organizations.id),
    eventName: text('event_name').notNull(),
    properties: jsonb('properties'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [index('idx_analytics_org_event').on(t.orgId, t.eventName, t.createdAt)],
);

// ─── Relations ──────────────────────────────────────────────────────────────
export const organizationsRelations = relations(organizations, ({ many }) => ({
  applications: many(applications),
  inboundSources: many(inboundSources),
  apiKeys: many(apiKeys),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.orgId],
    references: [organizations.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [applications.orgId],
    references: [organizations.id],
  }),
  endpoints: many(endpoints),
  messages: many(messages),
}));

export const endpointsRelations = relations(endpoints, ({ one, many }) => ({
  application: one(applications, {
    fields: [endpoints.appId],
    references: [applications.id],
  }),
  deliveryAttempts: many(deliveryAttempts),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  application: one(applications, {
    fields: [messages.appId],
    references: [applications.id],
  }),
  deliveryAttempts: many(deliveryAttempts),
}));

export const deliveryAttemptsRelations = relations(deliveryAttempts, ({ one }) => ({
  message: one(messages, {
    fields: [deliveryAttempts.messageId],
    references: [messages.id],
  }),
  endpoint: one(endpoints, {
    fields: [deliveryAttempts.endpointId],
    references: [endpoints.id],
  }),
}));
