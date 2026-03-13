import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Runtime pool — connects as app_user (RLS enforced)
// Use direct Neon connection (not -pooler hostname) for SET LOCAL support
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Admin pool — connects as app_admin (BYPASSRLS) for org lookups, migrations, workers
const adminPool = new Pool({
  connectionString: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle({ client: pool, schema });
export const adminDb = drizzle({ client: adminPool, schema });
export { pool, adminPool };
