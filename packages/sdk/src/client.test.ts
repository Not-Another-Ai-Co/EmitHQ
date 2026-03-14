import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmitHQ } from './client';
import { AuthError, NotFoundError, ValidationError, RateLimitError, EmitHQError } from './errors';

// Mock fetch globally
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status: number): Response {
  return jsonResponse({ error: { code, message } }, status);
}

describe('EmitHQ constructor', () => {
  it('requires an API key', () => {
    expect(() => new EmitHQ('')).toThrow('API key is required');
  });

  it('strips trailing slashes from baseUrl', () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000/' });
    // Verify by making a request and inspecting the URL
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
    client.listEndpoints('app-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:3000\/api/),
      expect.any(Object),
    );
  });
});

describe('sendEvent', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('sends event and returns message', async () => {
    const message = {
      id: 'msg-1',
      eventType: 'user.created',
      eventId: null,
      createdAt: '2026-01-01',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: message }, 202));

    const result = await client.sendEvent('app-1', {
      eventType: 'user.created',
      payload: { userId: '123' },
    });

    expect(result).toEqual(message);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/app/app-1/msg',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer emhq_test',
          'Content-Type': 'application/json',
        }),
      }),
    );

    // Verify body was sent correctly
    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body as string);
    expect(body.eventType).toBe('user.created');
    expect(body.payload.userId).toBe('123');
  });

  it('throws ValidationError on 400', async () => {
    mockFetch.mockResolvedValueOnce(
      errorResponse('validation_error', 'eventType is required', 400),
    );

    await expect(client.sendEvent('app-1', { eventType: '' })).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError on 404', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse('not_found', 'Application not found', 404));

    await expect(client.sendEvent('nonexistent', { eventType: 'test' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('throws RateLimitError on 429', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse('quota_exceeded', 'Monthly limit reached', 429));

    await expect(client.sendEvent('app-1', { eventType: 'test' })).rejects.toThrow(RateLimitError);
  });

  it('includes eventId for idempotency', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { data: { id: 'msg-1', eventType: 'test', eventId: 'evt-123', createdAt: '2026-01-01' } },
        202,
      ),
    );

    await client.sendEvent('app-1', { eventType: 'test', eventId: 'evt-123' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.eventId).toBe('evt-123');
  });
});

describe('createEndpoint', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('creates endpoint and returns it with signing secret', async () => {
    const endpoint = {
      id: 'ep-1',
      uid: null,
      url: 'https://example.com/webhook',
      description: null,
      signingSecret: 'whsec_testkey123',
      eventTypeFilter: null,
      disabled: false,
      rateLimit: null,
      createdAt: '2026-01-01',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: endpoint }, 201));

    const result = await client.createEndpoint('app-1', { url: 'https://example.com/webhook' });

    expect(result.signingSecret).toBe('whsec_testkey123');
    expect(result.url).toBe('https://example.com/webhook');
  });

  it('throws ValidationError for invalid URL', async () => {
    mockFetch.mockResolvedValueOnce(
      errorResponse('validation_error', 'Endpoint URL must use HTTPS', 400),
    );

    await expect(client.createEndpoint('app-1', { url: 'http://insecure.com' })).rejects.toThrow(
      ValidationError,
    );
  });
});

describe('listEndpoints', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('returns paginated list', async () => {
    const response = {
      data: [{ id: 'ep-1' }, { id: 'ep-2' }],
      iterator: 'cursor-abc',
      done: false,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(response));

    const result = await client.listEndpoints('app-1', { limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.iterator).toBe('cursor-abc');
    expect(result.done).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/app/app-1/endpoint?limit=2',
      expect.any(Object),
    );
  });

  it('passes cursor for subsequent pages', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [], iterator: null, done: true }));

    await client.listEndpoints('app-1', { cursor: 'cursor-abc' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('cursor=cursor-abc'),
      expect.any(Object),
    );
  });

  it('omits query params when no pagination options given', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [], iterator: null, done: true }));

    await client.listEndpoints('app-1');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/app/app-1/endpoint',
      expect.any(Object),
    );
  });
});

describe('getEndpoint', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('returns endpoint with masked secret', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: 'ep-1', signingSecret: 'whsec_K5oZ...' } }),
    );

    const result = await client.getEndpoint('app-1', 'ep-1');
    expect(result.signingSecret).toContain('...');
  });

  it('throws NotFoundError for missing endpoint', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse('not_found', 'Endpoint not found', 404));

    await expect(client.getEndpoint('app-1', 'bad-id')).rejects.toThrow(NotFoundError);
  });
});

describe('updateEndpoint', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('updates and returns endpoint', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: 'ep-1', url: 'https://new.com/hook' } }),
    );

    const result = await client.updateEndpoint('app-1', 'ep-1', {
      url: 'https://new.com/hook',
    });

    expect(result.url).toBe('https://new.com/hook');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.url).toBe('https://new.com/hook');
  });
});

describe('deleteEndpoint', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('returns soft-delete confirmation', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { id: 'ep-1', deleted: true } }));

    const result = await client.deleteEndpoint('app-1', 'ep-1');
    expect(result.deleted).toBe(true);
  });
});

describe('testEndpoint', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('returns delivery result', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          success: true,
          statusCode: 200,
          responseBody: 'OK',
          responseTimeMs: 42,
          errorMessage: null,
        },
      }),
    );

    const result = await client.testEndpoint('app-1', 'ep-1');
    expect(result.success).toBe(true);
    expect(result.responseTimeMs).toBe(42);
  });

  it('returns failure result without throwing', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          success: false,
          statusCode: 500,
          responseBody: 'Error',
          responseTimeMs: 1500,
          errorMessage: 'timeout',
        },
      }),
    );

    const result = await client.testEndpoint('app-1', 'ep-1');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('timeout');
  });
});

describe('replayEvent', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('replays all failed attempts', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          replayed: 2,
          attempts: [
            { attemptId: 'a1', jobId: 'j1' },
            { attemptId: 'a2', jobId: 'j2' },
          ],
        },
      }),
    );

    const result = await client.replayEvent('app-1', 'msg-1');
    expect(result.replayed).toBe(2);
    expect(result.attempts).toHaveLength(2);
  });

  it('throws ValidationError when no retryable attempts', async () => {
    mockFetch.mockResolvedValueOnce(
      errorResponse('no_retryable', 'No failed attempts to retry', 400),
    );

    await expect(client.replayEvent('app-1', 'msg-1')).rejects.toThrow(ValidationError);
  });
});

describe('replayAttempt', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('replays a single attempt', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { attemptId: 'a1', jobId: 'j1' } }));

    const result = await client.replayAttempt('app-1', 'msg-1', 'a1');
    expect(result.attemptId).toBe('a1');
    expect(result.jobId).toBe('j1');
  });
});

describe('auth', () => {
  const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

  it('sends API key in Authorization header', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
    await client.listEndpoints('app-1');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer emhq_test');
  });

  it('throws AuthError on 401', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse('unauthorized', 'Invalid API key', 401));

    await expect(client.listEndpoints('app-1')).rejects.toThrow(AuthError);
  });
});

describe('retry behavior', () => {
  it('retries on 5xx errors', async () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 2 });

    mockFetch
      .mockResolvedValueOnce(errorResponse('server_error', 'Internal error', 500))
      .mockResolvedValueOnce(errorResponse('server_error', 'Internal error', 500))
      .mockResolvedValueOnce(
        jsonResponse(
          { data: { id: 'msg-1', eventType: 'test', eventId: null, createdAt: '2026-01-01' } },
          202,
        ),
      );

    const result = await client.sendEvent('app-1', { eventType: 'test' });

    expect(result.id).toBe('msg-1');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry on 400', async () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 2 });

    mockFetch.mockResolvedValueOnce(errorResponse('validation_error', 'Bad input', 400));

    await expect(client.sendEvent('app-1', { eventType: '' })).rejects.toThrow(ValidationError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 401', async () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 2 });

    mockFetch.mockResolvedValueOnce(errorResponse('unauthorized', 'Bad key', 401));

    await expect(client.listEndpoints('app-1')).rejects.toThrow(AuthError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 404', async () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 2 });

    mockFetch.mockResolvedValueOnce(errorResponse('not_found', 'Not found', 404));

    await expect(client.getEndpoint('app-1', 'bad')).rejects.toThrow(NotFoundError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors', async () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 1 });

    mockFetch
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(
        jsonResponse(
          { data: { id: 'msg-1', eventType: 'test', eventId: null, createdAt: '2026-01-01' } },
          202,
        ),
      );

    const result = await client.sendEvent('app-1', { eventType: 'test' });
    expect(result.id).toBe('msg-1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries on 5xx', async () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 1 });

    mockFetch
      .mockResolvedValueOnce(errorResponse('server_error', 'Down', 500))
      .mockResolvedValueOnce(errorResponse('server_error', 'Still down', 500));

    await expect(client.sendEvent('app-1', { eventType: 'test' })).rejects.toThrow(EmitHQError);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('URL-encodes path parameters', async () => {
    const client = new EmitHQ('emhq_test', { baseUrl: 'http://localhost:3000', maxRetries: 0 });

    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { id: 'ep-1' } }));

    await client.getEndpoint('app/with/slashes', 'ep id spaces');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/app/app%2Fwith%2Fslashes/endpoint/ep%20id%20spaces',
      expect.any(Object),
    );
  });
});
