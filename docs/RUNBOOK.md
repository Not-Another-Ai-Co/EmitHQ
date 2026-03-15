# Incident Response Runbook — EmitHQ

> Last verified: 2026-03-15

## Alert: High Delivery Error Rate (>1% failures)

**Severity:** P1
**Source:** Better Stack / `/metrics` endpoint
**SLO:** 99.9% delivery success rate

1. Check `/metrics?window=1h` for current success rate and error breakdown
2. Check Sentry for recent exceptions in the delivery worker
3. Check if failures are isolated to specific endpoints (one customer's server down) or system-wide
4. If system-wide: check Railway worker health, Redis connectivity, and DB connection pool
5. If endpoint-specific: circuit breaker should auto-disable at 10 consecutive failures — verify it fired
6. Check BullMQ queue depth — if growing, workers may be stuck or crashed

**Resolution:** If worker crashed → Railway auto-restarts. If Redis down → check Upstash status page. If DB saturated → check `pool.waitingCount` in `/metrics`.

## Alert: Queue Backlog (>10,000 waiting jobs)

**Severity:** P1
**Source:** `/metrics` endpoint, Better Stack keyword monitor

1. Check `/metrics` for `queue.waiting` and `queue.active` counts
2. If `active = 0` and `waiting > 0`: workers are not processing — check Railway deployment
3. If `active = 5` (max concurrency) and `waiting` growing: delivery targets are slow or timing out
4. Check latency percentiles — if p95 > 30s, endpoints are near timeout
5. Check for circuit breaker events — mass endpoint failures cause fan-out to DLQ

**Resolution:** If workers stopped → redeploy on Railway. If targets slow → nothing to do (backoff handles it). If sustained growth → increase worker concurrency in `delivery-worker.ts`.

## Alert: API Server Down (Better Stack)

**Severity:** P0
**Source:** Better Stack uptime monitor

1. Check Railway dashboard for deployment status and recent deploys
2. Check if `/health` returns 503 (degraded) or is completely unreachable
3. If 503: check which dependency is down (DB vs Redis from response body)
4. If unreachable: Railway may have scaled to 0 or OOMed — check Railway logs
5. Check Sentry for unhandled exceptions that crashed the process

**Resolution:** If OOM → increase Railway memory limit. If bad deploy → rollback via Railway. If Neon/Upstash down → wait for provider recovery, status page shows degraded.

## Alert: Database Connection Exhaustion

**Severity:** P1
**Source:** `/metrics` pool stats (`pool.waiting > 0` sustained)

1. Check `/metrics` for `pool.app.waiting` and `pool.admin.waiting`
2. If `waiting > 0` for >1 minute: connections are saturated
3. Check for long-running queries: `SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;`
4. Check if a specific route is holding connections open (tenant middleware wraps in transaction)

**Resolution:** Kill long-running queries. If sustained, increase `pool.max` in `packages/core/src/db/client.ts`. Default: 20 (app) / 5 (admin).

## Alert: Circuit Breaker Cascade

**Severity:** P2
**Source:** Sentry, `/metrics` endpoint showing rising DLQ rate

1. Check `/metrics` for `delivery.exhausted` count and `dlqRate`
2. Check if a major webhook consumer (e.g., a large customer's server) went down
3. Endpoints auto-disable at 10 consecutive failures — check `endpoints` table for `disabled = true, disabled_reason = 'circuit_breaker'`
4. Determine if failures are transient (consumer deployment) or permanent (consumer abandoned)

**Resolution:** If transient → wait for consumer to recover, then re-enable via `PUT /api/v1/app/:appId/endpoint/:epId` with `{ "disabled": false }`. If permanent → contact customer.

## Alert: Payment Processing Failed

**Severity:** P2
**Source:** Stripe webhook (`invoice.payment_failed`)

1. Check Stripe Dashboard for the failed invoice details
2. Check `organizations` table — `subscription_status` should be `past_due`
3. Stripe will auto-retry (up to 3 attempts over ~3 weeks)
4. Customer receives Stripe's built-in dunning emails

**Resolution:** No immediate action needed — Stripe handles retry. If subscription is deleted after exhausting retries, the webhook handler downgrades to free tier automatically.

## Escalation

All alerts route to Julian via:

- **Email:** Better Stack notification
- **Sentry:** Email digest
- **P0 (full outage):** Better Stack can escalate to phone call (configure in Better Stack settings)
