CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"event_name" text NOT NULL,
	"properties" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"name" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"uid" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"stripe_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "billing_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"response_status" integer,
	"response_body" text,
	"response_time_ms" integer,
	"error_message" text,
	"next_attempt_at" timestamp with time zone,
	"attempted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "delivery_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"uid" text,
	"url" text NOT NULL,
	"description" text,
	"signing_secret" text NOT NULL,
	"event_type_filter" text[],
	"disabled" boolean DEFAULT false,
	"disabled_reason" text,
	"failure_count" integer DEFAULT 0,
	"rate_limit" integer,
	"transform_rules" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "endpoints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inbound_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"label" text,
	"signing_secret" text NOT NULL,
	"endpoint_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "inbound_sources_endpoint_path_unique" UNIQUE("endpoint_path")
);
--> statement-breakpoint
ALTER TABLE "inbound_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"event_id" text,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"event_count_month" integer DEFAULT 0,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text DEFAULT 'free' NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "organizations_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_app_id_applications_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_sources" ADD CONSTRAINT "inbound_sources_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_app_id_applications_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_org_event" ON "analytics_events" USING btree ("org_id","event_name","created_at");--> statement-breakpoint
CREATE INDEX "idx_api_keys_active" ON "api_keys" USING btree ("key_hash") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_api_keys_org" ON "api_keys" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_org_uid_idx" ON "applications" USING btree ("org_id","uid");--> statement-breakpoint
CREATE INDEX "idx_attempts_retry" ON "delivery_attempts" USING btree ("endpoint_id","status","next_attempt_at") WHERE status IN ('pending', 'failed');--> statement-breakpoint
CREATE INDEX "idx_attempts_message" ON "delivery_attempts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_endpoints_app" ON "endpoints" USING btree ("app_id") WHERE NOT disabled;--> statement-breakpoint
CREATE UNIQUE INDEX "messages_app_event_idx" ON "messages" USING btree ("app_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_messages_app_created" ON "messages" USING btree ("app_id","created_at");--> statement-breakpoint
CREATE POLICY "applications_tenant_isolation" ON "applications" AS RESTRICTIVE FOR ALL TO "app_user" USING (org_id = current_setting('app.current_tenant')::uuid) WITH CHECK (org_id = current_setting('app.current_tenant')::uuid);--> statement-breakpoint
CREATE POLICY "delivery_attempts_tenant_isolation" ON "delivery_attempts" AS RESTRICTIVE FOR ALL TO "app_user" USING (org_id = current_setting('app.current_tenant')::uuid) WITH CHECK (org_id = current_setting('app.current_tenant')::uuid);--> statement-breakpoint
CREATE POLICY "endpoints_tenant_isolation" ON "endpoints" AS RESTRICTIVE FOR ALL TO "app_user" USING (org_id = current_setting('app.current_tenant')::uuid) WITH CHECK (org_id = current_setting('app.current_tenant')::uuid);--> statement-breakpoint
CREATE POLICY "inbound_sources_tenant_isolation" ON "inbound_sources" AS RESTRICTIVE FOR ALL TO "app_user" USING (org_id = current_setting('app.current_tenant')::uuid) WITH CHECK (org_id = current_setting('app.current_tenant')::uuid);--> statement-breakpoint
CREATE POLICY "messages_tenant_isolation" ON "messages" AS RESTRICTIVE FOR ALL TO "app_user" USING (org_id = current_setting('app.current_tenant')::uuid) WITH CHECK (org_id = current_setting('app.current_tenant')::uuid);