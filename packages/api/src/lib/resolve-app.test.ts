import { describe, it, expect, vi } from 'vitest';
import { resolveApp } from './resolve-app';

// Mock @emithq/core — provide the applications table schema
vi.mock('@emithq/core', () => ({
  applications: {
    id: { name: 'id' },
    uid: { name: 'uid' },
    deletedAt: { name: 'deleted_at' },
  },
}));

/** Create a minimal mock tx that chains Drizzle-style query methods. */
function createMockTx(rows: Array<{ id: string }>) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  return chain as unknown as Parameters<typeof resolveApp>[0];
}

describe('resolveApp', () => {
  it('returns app when found by UUID', async () => {
    const tx = createMockTx([{ id: '550e8400-e29b-41d4-a716-446655440000' }]);
    const result = await resolveApp(tx, '550e8400-e29b-41d4-a716-446655440000');
    expect(result).toEqual({ id: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('returns app when found by uid', async () => {
    const tx = createMockTx([{ id: 'abc-internal-id' }]);
    const result = await resolveApp(tx, 'my-app-uid');
    expect(result).toEqual({ id: 'abc-internal-id' });
  });

  it('returns null when no app found', async () => {
    const tx = createMockTx([]);
    const result = await resolveApp(tx, 'nonexistent');
    expect(result).toBeNull();
  });

  it('returns null for soft-deleted app (empty result)', async () => {
    // The query filters on isNull(deletedAt) — a soft-deleted app returns empty
    const tx = createMockTx([]);
    const result = await resolveApp(tx, '550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBeNull();
  });

  it('calls select, from, where, limit on the tx', async () => {
    const mockTx = createMockTx([{ id: 'test' }]);
    await resolveApp(mockTx, 'test-uid');
    // Cast to record to access mock chain methods that don't exist on typeof db
    const spy = mockTx as unknown as Record<string, ReturnType<typeof vi.fn>>;
    expect(spy.select).toHaveBeenCalledOnce();
    expect(spy.from).toHaveBeenCalledOnce();
    expect(spy.where).toHaveBeenCalledOnce();
    expect(spy.limit).toHaveBeenCalledWith(1);
  });
});
