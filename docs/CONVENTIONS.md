# Conventions — EmitHQ

> Last verified: 2026-03-29

## Language & Runtime

- TypeScript strict mode (`"strict": true`) everywhere
- Node.js 22+ (LTS) for Railway origin
- Cloudflare Workers for edge code
- Hono as API framework (runs on both Workers and Node.js)

## Code Style

- ESLint + Prettier (auto-formatted by hook)
- No `any` — use `unknown` and narrow
- Prefer `const` over `let`
- Named exports, not default exports
- Barrel files (`index.ts`) only at package boundaries

## Naming

- **Files:** kebab-case (`delivery-worker.ts`, `webhook-signer.ts`)
- **Types/Interfaces:** PascalCase (`DeliveryAttempt`, `WebhookMessage`)
- **Functions/Variables:** camelCase (`signWebhook`, `retryDelay`)
- **Constants:** SCREAMING_SNAKE for true constants (`MAX_RETRY_ATTEMPTS`)
- **Database columns:** snake_case (`org_id`, `event_type`, `created_at`)
- **API routes:** kebab-case paths (`/api/v1/event-type/`)
- **Environment variables:** SCREAMING_SNAKE (`DATABASE_URL`, `REDIS_URL`)

## Database

- All tables have `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- All tables have `created_at TIMESTAMPTZ DEFAULT NOW()`
- Tenant tables have `org_id UUID NOT NULL` with RLS policy
- Use parameterized queries — never string interpolation in SQL
- Migrations via Drizzle ORM (or raw SQL files in `migrations/`)

## API Design

- REST, versioned at `/api/v1/`
- Cursor-based pagination (never offset)
- Auth via `Authorization: Bearer {api_key}`
- Consistent error format: `{ error: { code: string, message: string } }`
- HTTP status codes: 200 (success), 201 (created), 400 (validation), 401 (auth), 404 (not found), 429 (rate limit), 500 (server error)

## Security

The five non-obvious security invariants below are load-bearing across inbound/outbound/worker code paths. An agent reading only this section gets the complete posture — do not rely on CLAUDE.md alone.

### 1. Persist-before-enqueue (DEC-023)

**Rule:** Every inbound webhook writes the `messages` row to PostgreSQL BEFORE enqueueing to Redis. Never flip the order.

**Why:** PostgreSQL `onConflictDoNothing` on `UNIQUE(app_id, event_id)` is the idempotency truth — if a duplicate arrives, the INSERT silently no-ops and the caller short-circuits (no Redis enqueue). Enqueueing first and "reconciling later" would let the worker process the same event twice if the reconciliation never fires. Constraint violation aborts the transaction, so any INSERT-after-enqueue pattern would also leak enqueued jobs with no persisted record.

### 2. `crypto.timingSafeEqual` for all signature verification (DEC-008, DEC-012 archive)

**Rule:** Signature verification and API-key comparison use `crypto.timingSafeEqual` over equal-length buffers. String `===` comparison is a bug in any security-sensitive path.

**Why:** String comparison short-circuits on first mismatch — leaks timing information that lets an attacker extract the expected signature byte by byte. `timingSafeEqual` runs in constant time regardless of where the mismatch is. Call sites: `packages/core/src/signing/webhook-signer.ts`, `packages/core/src/auth/api-key.ts`.

### 3. RLS via `SET LOCAL` with UUID pre-validation (DEC-022)

**Rule:** Every request-scoped DB operation as `app_user` calls `SET LOCAL app.current_tenant = '<uuid>'` at the start of the transaction. The UUID is validated at the Zod/route layer BEFORE the `sql.raw()` interpolation. `sql.raw()` is deliberately used — parameterized `$1` does not work for SET LOCAL in PostgreSQL.

**Why:** PostgreSQL RLS policies read `current_setting('app.current_tenant')` to scope every SELECT/INSERT/UPDATE/DELETE to the caller's tenant. Without `SET LOCAL` the policy sees NULL and returns zero rows (silent data hiding — not a crash). `sql.raw()` with an unvalidated value would be SQL injection; the UUID pre-validation at the zod layer closes that.

### 4. Two DB roles: `app_user` vs `app_admin` (DEC-005, DEC-008 archive)

**Rule:** Request-path code uses `app_user` (RLS ENFORCED). Workers, admin ops, and background reconciliation use `app_admin` (BYPASSRLS). Never use `app_admin` from a request handler.

**Why:** Workers operate across tenants (delivery worker processes the queue for all tenants from one process). Forcing them through `app_user` + per-message `SET LOCAL` is possible but bug-prone — a missed SET makes the worker see zero rows and silently drop messages. `app_admin` with explicit `tenant_id = ?` filters in the query is safer for cross-tenant code. Keep the boundary clean: request handlers never get the `app_admin` pool.

### 5. SSRF protection on endpoint URLs (DEC-031)

**Rule:** Endpoint URLs pass two validation layers: (a) async DNS-resolving validation at creation time (`packages/api/src/routes/endpoints.ts:41-47`), and (b) sync regex + resolved-IP check at delivery time (`packages/core/src/workers/delivery-worker.ts:131-143`). Both layers are required.

**Why:** Hostname-only validation is bypassable by DNS rebinding — the validator resolves `evil.com` to a public IP, but the delivery worker's later lookup returns `127.0.0.1` or a metadata-service IP. The delivery-time sync check closes the rebinding window. "Just use a block-list of `10.x/8, 127.x/8, 169.254.x/16, 172.16/12, 192.168/16`" is insufficient without actually resolving the hostname at delivery time.

### General security rules

- Raw body preservation for webhook signature verification (never re-serialize before verifying).
- Per-endpoint signing secrets, encrypted at rest.
- API keys stored as SHA-256 hashes, never plaintext.

## Testing

- Vitest for unit and integration tests
- Test files colocated: `foo.ts` → `foo.test.ts`
- Minimum: one happy-path + one failure/edge case per acceptance criterion
- Mock external HTTP calls in unit tests; real DB in integration tests

### E2E Tests (Playwright)

- Located in `packages/dashboard/e2e/`
- Run with: `cd packages/dashboard && op run --env-file=../../.env.tpl -- npx playwright test`
- Prerequisites: dashboard (port 4002), API (port 4000), worker, Redis, PostgreSQL all running
- Clerk test user must exist (credentials in 1Password `EmitHQ/e2e`)
- Install browsers first: `npx playwright install chromium`
- Three test suites: `browser-journey` (8-step UI flow), `api-journey` (LLM-automatable API flow), `account-management` (profile/billing smoke tests)
- Uses `@clerk/testing` for auth bypass — requires `CLERK_SECRET_KEY` (dev instance only)
- CI integration deferred indefinitely (T-038 marked `[-]` — "infrastructure, not user-facing"). E2E suite runs locally; re-open if a contributor joins or CI becomes load-bearing.

## Git

- Atomic commits, imperative mood, reference ticket IDs
- Branch: `master` (direct commits for ticket work)
- No force-push to master
