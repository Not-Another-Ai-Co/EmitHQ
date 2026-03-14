import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyWebhook } from './verify';

// Helper to create a valid signature for testing
async function sign(
  msgId: string,
  timestamp: string,
  payload: string,
  secretBase64: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));
  const content = encoder.encode(`${msgId}.${timestamp}.${payload}`);

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, content);
  let binary = '';
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `v1,${btoa(binary)}`;
}

describe('verifyWebhook', () => {
  const secretBase64 = btoa('test-secret-key-32-bytes-long!!!');
  const secret = `whsec_${secretBase64}`;
  const payload = '{"type":"test","data":{}}';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies a valid signature', async () => {
    const msgId = 'msg_test123';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await sign(msgId, timestamp, payload, secretBase64);

    const result = await verifyWebhook(
      payload,
      {
        'webhook-id': msgId,
        'webhook-timestamp': timestamp,
        'webhook-signature': signature,
      },
      secret,
    );

    expect(result).toBe(true);
  });

  it('throws on invalid signature', async () => {
    const msgId = 'msg_test123';
    const timestamp = String(Math.floor(Date.now() / 1000));

    await expect(
      verifyWebhook(
        payload,
        {
          'webhook-id': msgId,
          'webhook-timestamp': timestamp,
          'webhook-signature': 'v1,invalidsignaturebase64==',
        },
        secret,
      ),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('throws on expired timestamp', async () => {
    const msgId = 'msg_test123';
    const expiredTs = String(Math.floor(Date.now() / 1000) - 600); // 10 minutes ago
    const signature = await sign(msgId, expiredTs, payload, secretBase64);

    await expect(
      verifyWebhook(
        payload,
        {
          'webhook-id': msgId,
          'webhook-timestamp': expiredTs,
          'webhook-signature': signature,
        },
        secret,
      ),
    ).rejects.toThrow('outside tolerance');
  });

  it('throws on missing headers', async () => {
    await expect(
      verifyWebhook(
        payload,
        {
          'webhook-id': '',
          'webhook-timestamp': '',
          'webhook-signature': '',
        },
        secret,
      ),
    ).rejects.toThrow('Missing required webhook headers');
  });

  it('throws on non-numeric timestamp', async () => {
    await expect(
      verifyWebhook(
        payload,
        {
          'webhook-id': 'msg_1',
          'webhook-timestamp': 'not-a-number',
          'webhook-signature': 'v1,abc',
        },
        secret,
      ),
    ).rejects.toThrow('Invalid webhook-timestamp');
  });

  it('accepts secret without whsec_ prefix', async () => {
    const msgId = 'msg_test456';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await sign(msgId, timestamp, payload, secretBase64);

    // Pass raw base64 without prefix
    const result = await verifyWebhook(
      payload,
      {
        'webhook-id': msgId,
        'webhook-timestamp': timestamp,
        'webhook-signature': signature,
      },
      secretBase64,
    );

    expect(result).toBe(true);
  });

  it('rejects tampered payload', async () => {
    const msgId = 'msg_test789';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await sign(msgId, timestamp, payload, secretBase64);

    // Tamper with payload
    await expect(
      verifyWebhook(
        '{"type":"tampered"}',
        {
          'webhook-id': msgId,
          'webhook-timestamp': timestamp,
          'webhook-signature': signature,
        },
        secret,
      ),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('handles multiple space-separated signatures', async () => {
    const msgId = 'msg_multi';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const validSig = await sign(msgId, timestamp, payload, secretBase64);

    // Multiple signatures, valid one is second
    const result = await verifyWebhook(
      payload,
      {
        'webhook-id': msgId,
        'webhook-timestamp': timestamp,
        'webhook-signature': `v1,invalidsig== ${validSig}`,
      },
      secret,
    );

    expect(result).toBe(true);
  });

  it('rejects when wrong secret is used', async () => {
    const msgId = 'msg_wrongkey';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const wrongSecretBase64 = btoa('wrong-secret-key-32-bytes!!!!!!!!');
    const signature = await sign(msgId, timestamp, payload, wrongSecretBase64);

    await expect(
      verifyWebhook(
        payload,
        {
          'webhook-id': msgId,
          'webhook-timestamp': timestamp,
          'webhook-signature': signature,
        },
        secret,
      ),
    ).rejects.toThrow('Invalid webhook signature');
  });
});
