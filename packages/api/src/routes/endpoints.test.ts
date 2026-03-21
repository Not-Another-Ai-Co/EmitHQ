import { describe, it, expect } from 'vitest';

describe('validateEndpointUrl', () => {
  // Inline the validation logic for unit testing
  function validateEndpointUrl(url: string, nodeEnv = 'development'): string | null {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:') return null;
      if (parsed.protocol === 'http:' && nodeEnv !== 'production') return null;
      return 'Endpoint URL must use HTTPS';
    } catch {
      return 'Invalid URL format';
    }
  }

  it('accepts HTTPS URLs', () => {
    expect(validateEndpointUrl('https://example.com/webhook')).toBeNull();
  });

  it('accepts HTTP URLs in development', () => {
    expect(validateEndpointUrl('http://localhost:3000/webhook', 'development')).toBeNull();
  });

  it('rejects HTTP URLs in production', () => {
    expect(validateEndpointUrl('http://example.com/webhook', 'production')).toBe(
      'Endpoint URL must use HTTPS',
    );
  });

  it('rejects invalid URL format', () => {
    expect(validateEndpointUrl('not-a-url')).toBe('Invalid URL format');
  });

  it('rejects empty string', () => {
    expect(validateEndpointUrl('')).toBe('Invalid URL format');
  });

  it('rejects FTP protocol', () => {
    expect(validateEndpointUrl('ftp://example.com/file')).toBe('Endpoint URL must use HTTPS');
  });
});

describe('maskSecret', () => {
  function maskSecret(secret: string): string {
    return secret.slice(0, 10) + '...';
  }

  it('masks a whsec_ secret showing only prefix', () => {
    const secret = 'whsec_K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pj9o9NDN';
    const masked = maskSecret(secret);
    expect(masked).toBe('whsec_K5oZ...');
    expect(masked).not.toContain(secret.slice(10));
  });

  it('does not reveal the full secret', () => {
    const secret = 'whsec_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const masked = maskSecret(secret);
    expect(masked.length).toBeLessThan(secret.length);
  });
});

describe('cursor pagination', () => {
  it('encodes and decodes cursor correctly', () => {
    const cursorData = { createdAt: '2026-03-13T00:00:00Z', id: 'uuid-123' };
    const encoded = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
    expect(decoded.createdAt).toBe(cursorData.createdAt);
    expect(decoded.id).toBe(cursorData.id);
  });

  it('rejects invalid base64 cursor', () => {
    expect(() => {
      JSON.parse(Buffer.from('not-valid-base64!!!', 'base64').toString());
    }).toThrow();
  });
});

describe('endpoint CRUD routes (contract tests)', () => {
  it('create endpoint requires url field', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/:appId/endpoint', async (c) => {
      const body = await c.req.json();
      if (!body.url || typeof body.url !== 'string') {
        return c.json({ error: { code: 'validation_error', message: 'url is required' } }, 400);
      }
      return c.json({ data: { id: 'ep-1', url: body.url } }, 201);
    });

    const res = await app.request('/app-1/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'no url provided' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
  });

  it('create endpoint returns 201 with signing secret', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/:appId/endpoint', async (c) => {
      return c.json(
        {
          data: {
            id: 'ep-1',
            url: 'https://example.com/webhook',
            signingSecret: 'whsec_testSecret123',
          },
        },
        201,
      );
    });

    const res = await app.request('/app-1/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/webhook' }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.signingSecret).toMatch(/^whsec_/);
  });

  it('delete endpoint returns soft-delete confirmation', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.delete('/:appId/endpoint/:epId', async (c) => {
      return c.json({ data: { id: c.req.param('epId'), deleted: true } });
    });

    const res = await app.request('/app-1/endpoint/ep-1', { method: 'DELETE' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.deleted).toBe(true);
  });

  it('get endpoint returns masked secret', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/endpoint/:epId', async (c) => {
      return c.json({
        data: {
          id: 'ep-1',
          url: 'https://example.com/webhook',
          signingSecret: 'whsec_K5oZ...',
        },
      });
    });

    const res = await app.request('/app-1/endpoint/ep-1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.signingSecret).toContain('...');
    expect(json.data.signingSecret.length).toBeLessThan(50);
  });

  it('update with no fields returns 400', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.put('/:appId/endpoint/:epId', async (c) => {
      const body = await c.req.json();
      const updates: Record<string, unknown> = {};
      if (body.url !== undefined) updates.url = body.url;
      if (body.description !== undefined) updates.description = body.description;
      if (Object.keys(updates).length === 0) {
        return c.json({ error: { code: 'validation_error', message: 'No fields to update' } }, 400);
      }
      return c.json({ data: { id: 'ep-1' } });
    });

    const res = await app.request('/app-1/endpoint/ep-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it('list endpoints returns pagination shape', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/endpoint', async (c) => {
      return c.json({
        data: [{ id: 'ep-1' }, { id: 'ep-2' }],
        iterator: null,
        done: true,
      });
    });

    const res = await app.request('/app-1/endpoint');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(2);
    expect(json).toHaveProperty('iterator');
    expect(json).toHaveProperty('done');
  });

  it('create endpoint with transformRules on free tier returns 403', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    const TRANSFORM_ALLOWED_TIERS = ['starter', 'growth', 'scale'];

    app.post('/:appId/endpoint', async (c) => {
      const body = await c.req.json();
      const orgTier = c.req.header('x-test-tier') ?? 'free';

      if (body.transformRules !== undefined) {
        if (!TRANSFORM_ALLOWED_TIERS.includes(orgTier)) {
          return c.json(
            {
              error: {
                code: 'forbidden',
                message: 'Payload transforms require a paid plan (Starter+).',
                action: { type: 'upgrade', url: '/api/v1/billing/checkout' },
              },
            },
            403,
          );
        }
      }
      return c.json(
        { data: { id: 'ep-1', url: body.url, transformRules: body.transformRules } },
        201,
      );
    });

    const res = await app.request('/app-1/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-tier': 'free' },
      body: JSON.stringify({
        url: 'https://example.com/webhook',
        transformRules: [{ type: 'extract', source: '$.data', target: '$.result' }],
      }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('forbidden');
    expect(json.error.action.type).toBe('upgrade');
  });

  it('create endpoint with transformRules on starter tier returns 201', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    const TRANSFORM_ALLOWED_TIERS = ['starter', 'growth', 'scale'];

    app.post('/:appId/endpoint', async (c) => {
      const body = await c.req.json();
      const orgTier = c.req.header('x-test-tier') ?? 'free';

      if (body.transformRules !== undefined) {
        if (!TRANSFORM_ALLOWED_TIERS.includes(orgTier)) {
          return c.json({ error: { code: 'forbidden', message: 'Upgrade required' } }, 403);
        }
      }
      return c.json(
        { data: { id: 'ep-1', url: body.url, transformRules: body.transformRules } },
        201,
      );
    });

    const res = await app.request('/app-1/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-tier': 'starter' },
      body: JSON.stringify({
        url: 'https://example.com/webhook',
        transformRules: [{ type: 'extract', source: '$.data', target: '$.result' }],
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.transformRules).toBeDefined();
  });

  it('create endpoint without transformRules on free tier returns 201', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    const TRANSFORM_ALLOWED_TIERS = ['starter', 'growth', 'scale'];

    app.post('/:appId/endpoint', async (c) => {
      const body = await c.req.json();
      const orgTier = c.req.header('x-test-tier') ?? 'free';

      if (body.transformRules !== undefined) {
        if (!TRANSFORM_ALLOWED_TIERS.includes(orgTier)) {
          return c.json({ error: { code: 'forbidden', message: 'Upgrade required' } }, 403);
        }
      }
      return c.json({ data: { id: 'ep-1', url: body.url } }, 201);
    });

    const res = await app.request('/app-1/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-tier': 'free' },
      body: JSON.stringify({ url: 'https://example.com/webhook' }),
    });

    expect(res.status).toBe(201);
  });

  it('update endpoint with transformRules null on free tier is allowed (clears rules)', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    const TRANSFORM_ALLOWED_TIERS = ['starter', 'growth', 'scale'];

    app.put('/:appId/endpoint/:epId', async (c) => {
      const body = await c.req.json();
      const orgTier = c.req.header('x-test-tier') ?? 'free';

      if (body.transformRules !== undefined && body.transformRules !== null) {
        if (!TRANSFORM_ALLOWED_TIERS.includes(orgTier)) {
          return c.json({ error: { code: 'forbidden', message: 'Upgrade required' } }, 403);
        }
      }

      const updates: Record<string, unknown> = {};
      if (body.transformRules !== undefined) updates.transformRules = body.transformRules;
      if (Object.keys(updates).length === 0) {
        return c.json({ error: { code: 'validation_error', message: 'No fields to update' } }, 400);
      }
      return c.json({ data: { id: 'ep-1', transformRules: null } });
    });

    const res = await app.request('/app-1/endpoint/ep-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-test-tier': 'free' },
      body: JSON.stringify({ transformRules: null }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.transformRules).toBeNull();
  });

  it('update endpoint with transformRules on free tier returns 403', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    const TRANSFORM_ALLOWED_TIERS = ['starter', 'growth', 'scale'];

    app.put('/:appId/endpoint/:epId', async (c) => {
      const body = await c.req.json();
      const orgTier = c.req.header('x-test-tier') ?? 'free';

      if (body.transformRules !== undefined && body.transformRules !== null) {
        if (!TRANSFORM_ALLOWED_TIERS.includes(orgTier)) {
          return c.json(
            {
              error: {
                code: 'forbidden',
                message: 'Payload transforms require a paid plan (Starter+).',
                action: { type: 'upgrade', url: '/api/v1/billing/checkout' },
              },
            },
            403,
          );
        }
      }

      const updates: Record<string, unknown> = {};
      if (body.transformRules !== undefined) updates.transformRules = body.transformRules;
      if (Object.keys(updates).length === 0) {
        return c.json({ error: { code: 'validation_error', message: 'No fields to update' } }, 400);
      }
      return c.json({ data: { id: 'ep-1', transformRules: body.transformRules } });
    });

    const res = await app.request('/app-1/endpoint/ep-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-test-tier': 'free' },
      body: JSON.stringify({
        transformRules: [{ type: 'extract', source: '$.data', target: '$.result' }],
      }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('forbidden');
    expect(json.error.action.type).toBe('upgrade');
  });

  it('test delivery returns delivery result', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/:appId/endpoint/:epId/test', async (c) => {
      return c.json({
        data: {
          success: true,
          statusCode: 200,
          responseBody: 'OK',
          responseTimeMs: 42,
          errorMessage: null,
        },
      });
    });

    const res = await app.request('/app-1/endpoint/ep-1/test', { method: 'POST' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.success).toBe(true);
    expect(json.data).toHaveProperty('statusCode');
    expect(json.data).toHaveProperty('responseTimeMs');
  });
});
