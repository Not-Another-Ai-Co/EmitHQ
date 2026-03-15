# EmitHQ Environment Variables
# Uses 1Password references — inject with: op run --env-file=.env.tpl -- <command>

# Database (use direct Neon connection, not -pooler hostname, for SET LOCAL support)
DATABASE_URL=op://EmitHQ/database/connection-string
DATABASE_ADMIN_URL=op://EmitHQ/database/admin-connection-string

# Redis (Upstash) — REST client
REDIS_URL=op://EmitHQ/redis/url
REDIS_TOKEN=op://EmitHQ/redis/token

# Redis (Upstash) — TCP for BullMQ (ioredis)
UPSTASH_REDIS_HOST=op://EmitHQ/redis/host
UPSTASH_REDIS_PASSWORD=op://EmitHQ/redis/password

# QStash (Upstash)
QSTASH_TOKEN=op://EmitHQ/qstash/token
QSTASH_CURRENT_SIGNING_KEY=op://EmitHQ/qstash/signing-key
QSTASH_NEXT_SIGNING_KEY=op://EmitHQ/qstash/next-signing-key

# Auth (Clerk)
CLERK_SECRET_KEY=op://EmitHQ/clerk/secret-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=op://EmitHQ/clerk/publishable-key

# Payments (Stripe)
STRIPE_SECRET_KEY=op://EmitHQ/stripe/secret-key
STRIPE_WEBHOOK_SECRET=op://EmitHQ/stripe/webhook-secret

# App
NODE_ENV=development
PORT=4000
API_BASE_URL=http://100.82.36.13:4000
NEXT_PUBLIC_API_URL=http://100.82.36.13:4000
