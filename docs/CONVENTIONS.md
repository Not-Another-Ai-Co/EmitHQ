# Conventions — EmitHQ

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
- `crypto.timingSafeEqual` for ALL signature verification
- Raw body preservation for webhook signature verification
- Per-endpoint signing secrets, encrypted at rest
- API keys stored as SHA-256 hashes, never plaintext
- SSRF protection: validate endpoint URLs before delivery

## Testing
- Vitest for unit and integration tests
- Test files colocated: `foo.ts` → `foo.test.ts`
- Minimum: one happy-path + one failure/edge case per acceptance criterion
- Mock external HTTP calls in unit tests; real DB in integration tests

## Git
- Atomic commits, imperative mood, reference ticket IDs
- Branch: `main` (direct commits for ticket work)
- No force-push to main
