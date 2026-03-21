# EmitHQ Environment Variables
# Uses 1Password references — inject with: op run --env-file=.env.tpl -- <command>

# Database (use direct Neon connection, not -pooler hostname, for SET LOCAL support)
DATABASE_URL=op://EmitHQ/database/connection-string
DATABASE_ADMIN_URL=op://EmitHQ/database/admin-connection-string

# Redis (Upstash) — TCP for BullMQ (ioredis). Fixed $10/mo plan.
UPSTASH_REDIS_HOST=op://EmitHQ/redis/host
UPSTASH_REDIS_PASSWORD=op://EmitHQ/redis/password

# Redis REST + QStash — planned for T-039 (Cloudflare Workers edge layer), not used yet
# REDIS_URL=op://EmitHQ/redis/url
# REDIS_TOKEN=op://EmitHQ/redis/token
# QSTASH_TOKEN=op://EmitHQ/qstash/token
# QSTASH_CURRENT_SIGNING_KEY=op://EmitHQ/qstash/signing-key
# QSTASH_NEXT_SIGNING_KEY=op://EmitHQ/qstash/next-signing-key

# Auth (Clerk)
CLERK_SECRET_KEY=op://EmitHQ/clerk/secret-key
CLERK_PUBLISHABLE_KEY=op://EmitHQ/clerk/publishable-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=op://EmitHQ/clerk/publishable-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Payments (Stripe)
STRIPE_SECRET_KEY=op://EmitHQ/stripe/secret-key
STRIPE_WEBHOOK_SECRET=op://EmitHQ/stripe/webhook-secret
STRIPE_PRICE_STARTER_MONTHLY=op://EmitHQ/stripe/price-starter-monthly
STRIPE_PRICE_STARTER_ANNUAL=op://EmitHQ/stripe/price-starter-annual
STRIPE_PRICE_GROWTH_MONTHLY=op://EmitHQ/stripe/price-growth-monthly
STRIPE_PRICE_GROWTH_ANNUAL=op://EmitHQ/stripe/price-growth-annual
STRIPE_PRICE_SCALE_MONTHLY=op://EmitHQ/stripe/price-scale-monthly
STRIPE_PRICE_SCALE_ANNUAL=op://EmitHQ/stripe/price-scale-annual

# Monitoring
SENTRY_DSN=op://EmitHQ/sentry/dsn
METRICS_SECRET=op://EmitHQ/metrics/secret

# Analytics (Umami — self-hosted)
UMAMI_APP_SECRET=op://EmitHQ/umami/app-secret

# Email (Resend — outreach + transactional)
RESEND_API_KEY=op://EmitHQ/resend/api-key

# E2E Testing (Playwright + Clerk)
E2E_CLERK_USER_EMAIL=op://EmitHQ/e2e/user-email
E2E_CLERK_USER_PASSWORD=op://EmitHQ/e2e/user-password

# App (local dev — Tailscale IP)
NODE_ENV=development
PORT=4000
API_BASE_URL=http://100.82.36.13:4000
NEXT_PUBLIC_API_URL=http://100.82.36.13:4000
DASHBOARD_URL=http://100.82.36.13:4002

# App (production — set these in Railway/Vercel, not here)
# NODE_ENV=production
# API_BASE_URL=https://api.emithq.com
# NEXT_PUBLIC_API_URL=https://api.emithq.com
# DASHBOARD_URL=https://app.emithq.com
