import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Sign a webhook payload per the Standard Webhooks specification.
 *
 * Signed content: `{webhook-id}.{webhook-timestamp}.{raw_body}`
 * Algorithm: HMAC-SHA256, base64-encoded, prefixed with `v1,`
 * Secret format: `whsec_{base64_raw_key}` — strip prefix, base64-decode to get raw key bytes.
 */
export function signWebhook(
  webhookId: string,
  timestamp: number,
  payload: string,
  secret: string,
): string {
  const rawSecret = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');

  const toSign = `${webhookId}.${timestamp}.${payload}`;

  const hmac = createHmac('sha256', rawSecret).update(toSign).digest('base64');

  return `v1,${hmac}`;
}

/**
 * Build the three Standard Webhooks headers for an outbound delivery.
 */
export function buildWebhookHeaders(
  messageId: string,
  payload: string,
  secret: string,
): { 'webhook-id': string; 'webhook-timestamp': string; 'webhook-signature': string } {
  const webhookId = `msg_${messageId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signWebhook(webhookId, timestamp, payload, secret);

  return {
    'webhook-id': webhookId,
    'webhook-timestamp': String(timestamp),
    'webhook-signature': signature,
  };
}

/**
 * Verify an incoming Standard Webhooks signature.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyWebhook(
  webhookId: string,
  timestampHeader: string,
  signatureHeader: string,
  payload: string,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false;
  }

  const expected = signWebhook(webhookId, timestamp, payload, secret);
  const expectedSig = expected.slice(3); // strip "v1,"

  const expectedBytes = Buffer.from(expectedSig);

  // Signature header may contain multiple space-delimited signatures (key rotation)
  for (const entry of signatureHeader.split(' ')) {
    const commaIdx = entry.indexOf(',');
    if (commaIdx === -1) continue;

    const version = entry.slice(0, commaIdx);
    const sig = entry.slice(commaIdx + 1);
    if (version !== 'v1' || !sig) continue;

    const sigBytes = Buffer.from(sig);
    if (sigBytes.length === expectedBytes.length && timingSafeEqual(sigBytes, expectedBytes)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a new signing secret in Standard Webhooks format.
 * 32 bytes of random data, base64-encoded, with `whsec_` prefix.
 */
export function generateSigningSecret(): string {
  return `whsec_${randomBytes(32).toString('base64')}`;
}
