// @emithq/sdk — Webhook signature verification for consumers
// Uses WebCrypto API for universal compatibility (Node.js 18+, browsers, edge runtimes)

const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Verify an incoming webhook signature (Standard Webhooks spec).
 *
 * @param payload - Raw request body as string
 * @param headers - Object with webhook-id, webhook-timestamp, and webhook-signature headers
 * @param secret - Signing secret (whsec_ prefixed, base64-encoded key after prefix)
 * @returns true if signature is valid
 * @throws Error if signature is invalid, timestamp is out of tolerance, or headers are missing
 */
export async function verifyWebhook(
  payload: string,
  headers: {
    'webhook-id': string;
    'webhook-timestamp': string;
    'webhook-signature': string;
  },
  secret: string,
): Promise<boolean> {
  const msgId = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signature = headers['webhook-signature'];

  if (!msgId || !timestamp || !signature) {
    throw new Error(
      'Missing required webhook headers (webhook-id, webhook-timestamp, webhook-signature)',
    );
  }

  // Validate timestamp tolerance
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) {
    throw new Error('Invalid webhook-timestamp header');
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_SECONDS) {
    throw new Error('Webhook timestamp is outside tolerance window');
  }

  // Strip whsec_ prefix and decode base64 key
  const keyBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const keyBytes = base64ToUint8Array(keyBase64);

  // Signed content: {msg_id}.{timestamp}.{body}
  const signedContent = `${msgId}.${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(signedContent);

  // Compute HMAC-SHA256
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, contentBytes);
  const computedSignature = `v1,${uint8ArrayToBase64(new Uint8Array(signatureBytes))}`;

  // Compare against all provided signatures (comma-separated)
  const providedSignatures = signature.split(' ');
  for (const sig of providedSignatures) {
    if (timingSafeEqual(computedSignature, sig.trim())) {
      return true;
    }
  }

  throw new Error('Invalid webhook signature');
}

/** Base64 string to Uint8Array */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/** Uint8Array to base64 string */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Falls back to character-by-character XOR comparison.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
