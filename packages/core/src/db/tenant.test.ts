import { describe, it, expect, vi } from 'vitest';

// Mock the client module to avoid actual DB connections in unit tests
vi.mock('./client', () => ({
  db: {
    transaction: vi.fn(),
  },
}));

import { withTenant } from './tenant';

describe('withTenant', () => {
  it('rejects non-UUID orgId', async () => {
    await expect(withTenant('not-a-uuid', async () => {})).rejects.toThrow(
      'Invalid tenant ID: expected UUID',
    );
  });

  it('rejects empty string', async () => {
    await expect(withTenant('', async () => {})).rejects.toThrow('Invalid tenant ID');
  });

  it('rejects SQL injection attempt', async () => {
    await expect(withTenant("'; DROP TABLE organizations; --", async () => {})).rejects.toThrow(
      'Invalid tenant ID',
    );
  });

  it('accepts valid UUID', async () => {
    const { db } = await import('./client');
    const mockTx = { execute: vi.fn() };
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx as never));

    await withTenant('a1b2c3d4-e5f6-7890-abcd-ef1234567890', async () => 'result');

    expect(db.transaction).toHaveBeenCalled();
  });

  it('accepts uppercase UUID', async () => {
    const { db } = await import('./client');
    const mockTx = { execute: vi.fn() };
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx as never));

    await withTenant('A1B2C3D4-E5F6-7890-ABCD-EF1234567890', async () => 'result');

    expect(db.transaction).toHaveBeenCalled();
  });
});
