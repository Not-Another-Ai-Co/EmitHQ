import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/core/src/db/schema.ts",
  out: "./packages/core/src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  entities: {
    roles: {
      provider: "neon",
    },
  },
});
