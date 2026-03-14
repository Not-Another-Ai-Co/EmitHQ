import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  signWebhook,
  buildWebhookHeaders,
  verifyWebhook,
  generateSigningSecret,
} from './webhook-signer';

const TEST_SECRET = 'whsec_' + Buffer.from('test-secret-key-32-bytes-long!!!').toString('base64');
const TEST_WEBHOOK_ID = 'msg_abc123';
const TEST_TIMESTAMP = 1710000000;
const TEST_PAYLOAD = '{"type":"invoice.paid","data":{"amount":100}}';

describe('signWebhook', () => {
  it('produces a v1-prefixed base64 signature', () => {
    const sig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    expect(sig).toMatch(/^v1,[A-Za-z0-9+/]+=*$/);
  });

  it('produces deterministic output for same inputs', () => {
    const sig1 = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const sig2 = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    expect(sig1).toBe(sig2);
  });

  it('produces different signatures for different payloads', () => {
    const sig1 = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const sig2 = signWebhook(
      TEST_WEBHOOK_ID,
      TEST_TIMESTAMP,
      '{"different":"payload"}',
      TEST_SECRET,
    );
    expect(sig1).not.toBe(sig2);
  });

  it('produces different signatures for different timestamps', () => {
    const sig1 = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const sig2 = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP + 1, TEST_PAYLOAD, TEST_SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it('produces different signatures for different secrets', () => {
    const otherSecret =
      'whsec_' + Buffer.from('different-secret-key-32-bytes!!').toString('base64');
    const sig1 = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const sig2 = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, otherSecret);
    expect(sig1).not.toBe(sig2);
  });

  it('correctly strips whsec_ prefix and base64-decodes the secret', () => {
    const rawKey = Buffer.from('test-secret-key-32-bytes-long!!!');
    const toSign = `${TEST_WEBHOOK_ID}.${TEST_TIMESTAMP}.${TEST_PAYLOAD}`;
    const expectedHmac = createHmac('sha256', rawKey).update(toSign).digest('base64');

    const sig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    expect(sig).toBe(`v1,${expectedHmac}`);
  });

  it('works with secret that has no whsec_ prefix', () => {
    const bareSecret = Buffer.from('test-secret-key-32-bytes-long!!!').toString('base64');
    const sig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, bareSecret);
    expect(sig).toMatch(/^v1,/);
  });
});

describe('buildWebhookHeaders', () => {
  it('returns all three required headers', () => {
    const headers = buildWebhookHeaders('uuid-123', TEST_PAYLOAD, TEST_SECRET);
    expect(headers).toHaveProperty('webhook-id');
    expect(headers).toHaveProperty('webhook-timestamp');
    expect(headers).toHaveProperty('webhook-signature');
  });

  it('prefixes webhook-id with msg_', () => {
    const headers = buildWebhookHeaders('uuid-123', TEST_PAYLOAD, TEST_SECRET);
    expect(headers['webhook-id']).toBe('msg_uuid-123');
  });

  it('uses unix seconds for timestamp', () => {
    const headers = buildWebhookHeaders('uuid-123', TEST_PAYLOAD, TEST_SECRET);
    const ts = parseInt(headers['webhook-timestamp'], 10);
    const now = Math.floor(Date.now() / 1000);
    expect(Math.abs(ts - now)).toBeLessThan(5);
  });

  it('produces a valid v1 signature', () => {
    const headers = buildWebhookHeaders('uuid-123', TEST_PAYLOAD, TEST_SECRET);
    expect(headers['webhook-signature']).toMatch(/^v1,[A-Za-z0-9+/]+=*$/);
  });
});

describe('verifyWebhook', () => {
  it('verifies a valid signature', () => {
    const sig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const result = verifyWebhook(
      TEST_WEBHOOK_ID,
      String(TEST_TIMESTAMP),
      sig,
      TEST_PAYLOAD,
      TEST_SECRET,
      Infinity, // no tolerance check for unit test
    );
    expect(result).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const sig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const result = verifyWebhook(
      TEST_WEBHOOK_ID,
      String(TEST_TIMESTAMP),
      sig,
      '{"tampered":"payload"}',
      TEST_SECRET,
      Infinity,
    );
    expect(result).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const sig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const wrongSecret =
      'whsec_' + Buffer.from('wrong-secret-key-32-bytes!!!!!!!').toString('base64');
    const result = verifyWebhook(
      TEST_WEBHOOK_ID,
      String(TEST_TIMESTAMP),
      sig,
      TEST_PAYLOAD,
      wrongSecret,
      Infinity,
    );
    expect(result).toBe(false);
  });

  it('rejects expired timestamps', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const sig = signWebhook(TEST_WEBHOOK_ID, oldTimestamp, TEST_PAYLOAD, TEST_SECRET);
    const result = verifyWebhook(
      TEST_WEBHOOK_ID,
      String(oldTimestamp),
      sig,
      TEST_PAYLOAD,
      TEST_SECRET,
      300, // 5 minute tolerance
    );
    expect(result).toBe(false);
  });

  it('handles multiple space-delimited signatures (key rotation)', () => {
    const validSig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const multiSig = `v1,invalidsignatureABC ${validSig}`;
    const result = verifyWebhook(
      TEST_WEBHOOK_ID,
      String(TEST_TIMESTAMP),
      multiSig,
      TEST_PAYLOAD,
      TEST_SECRET,
      Infinity,
    );
    expect(result).toBe(true);
  });

  it('rejects invalid timestamp string', () => {
    const sig = signWebhook(TEST_WEBHOOK_ID, TEST_TIMESTAMP, TEST_PAYLOAD, TEST_SECRET);
    const result = verifyWebhook(
      TEST_WEBHOOK_ID,
      'not-a-number',
      sig,
      TEST_PAYLOAD,
      TEST_SECRET,
      Infinity,
    );
    expect(result).toBe(false);
  });
});

describe('generateSigningSecret', () => {
  it('produces a whsec_ prefixed secret', () => {
    const secret = generateSigningSecret();
    expect(secret).toMatch(/^whsec_[A-Za-z0-9+/]+=*$/);
  });

  it('produces unique secrets', () => {
    const a = generateSigningSecret();
    const b = generateSigningSecret();
    expect(a).not.toBe(b);
  });

  it('produces a decodable base64 payload after prefix strip', () => {
    const secret = generateSigningSecret();
    const raw = Buffer.from(secret.slice(6), 'base64');
    expect(raw.length).toBe(32); // 256 bits
  });
});
