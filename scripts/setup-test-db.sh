#!/bin/bash
# Set up a test PostgreSQL database for integration tests.
# Requires Docker to be running and docker-compose.yml in project root.
#
# Usage: ./scripts/setup-test-db.sh

set -euo pipefail

echo "Starting PostgreSQL via Docker..."
docker compose up -d postgres

echo "Waiting for PostgreSQL to be ready..."
until docker compose exec postgres pg_isready -U emithq 2>/dev/null; do
  sleep 1
done

echo "Creating test database roles..."
docker compose exec postgres psql -U emithq -d emithq_dev -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
      CREATE ROLE app_user LOGIN PASSWORD 'app_user_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_admin') THEN
      CREATE ROLE app_admin LOGIN PASSWORD 'app_admin_pass' BYPASSRLS;
    END IF;
  END
  \$\$;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_admin;
"

echo "Pushing schema via Drizzle..."
DATABASE_URL="postgres://emithq:emithq_dev@localhost:5432/emithq_dev" npx drizzle-kit push 2>/dev/null || echo "drizzle-kit push skipped (no drizzle.config.ts)"

echo "Test database ready."
echo "  DATABASE_URL=postgres://app_user:app_user_pass@localhost:5432/emithq_dev"
echo "  DATABASE_ADMIN_URL=postgres://app_admin:app_admin_pass@localhost:5432/emithq_dev"
