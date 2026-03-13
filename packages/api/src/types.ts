import type { db } from '@emithq/core';

export type AuthEnv = {
  Variables: {
    orgId: string;
    userId: string | null;
    authType: 'api_key' | 'clerk_session';
    tx: typeof db;
  };
};
