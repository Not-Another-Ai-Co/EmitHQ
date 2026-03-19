import { lookup } from 'node:dns/promises';

/**
 * Blocked IP ranges for SSRF protection.
 * Prevents delivery worker from hitting internal/cloud metadata endpoints.
 */
const BLOCKED_RANGES = [
  // Loopback
  { prefix: '127.', description: 'loopback' },
  // RFC 1918 private
  { prefix: '10.', description: 'private (10.x)' },
  { prefix: '192.168.', description: 'private (192.168.x)' },
  // 172.16.0.0/12
  {
    prefix: '172.',
    check: (ip: string) => {
      const second = parseInt(ip.split('.')[1], 10);
      return second >= 16 && second <= 31;
    },
    description: 'private (172.16-31.x)',
  },
  // Link-local
  { prefix: '169.254.', description: 'link-local' },
  // IPv6 loopback and private
  { prefix: '::1', description: 'IPv6 loopback' },
  { prefix: 'fc', description: 'IPv6 unique local (fc00::/7)' },
  { prefix: 'fd', description: 'IPv6 unique local (fc00::/7)' },
  { prefix: 'fe80:', description: 'IPv6 link-local' },
  // Cloud metadata
  { prefix: '100.100.100.200', description: 'Alibaba metadata' },
];

/** Hostnames that should always be blocked */
const BLOCKED_HOSTNAMES = [
  'metadata.google.internal',
  'metadata.goog',
  'kubernetes.default.svc',
  'localhost',
];

function isBlockedIp(ip: string): string | null {
  const lower = ip.toLowerCase();
  for (const range of BLOCKED_RANGES) {
    if (lower.startsWith(range.prefix)) {
      if (range.check && !range.check(ip)) continue;
      return range.description;
    }
  }
  // Explicit metadata IP check
  if (ip === '169.254.169.254') return 'cloud metadata endpoint';
  return null;
}

/**
 * Validate that an endpoint URL is safe to deliver webhooks to.
 * Checks URL format, blocked hostnames, and resolves DNS to verify
 * the target IP is not in a private/blocked range (prevents DNS rebinding).
 *
 * @returns null if valid, or an error message string if blocked
 */
export async function validateEndpointUrl(url: string): Promise<string | null> {
  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL format';
  }

  // Must be HTTPS or HTTP
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return 'URL must use http or https protocol';
  }

  // Check blocked hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return `Blocked hostname: ${hostname}`;
  }

  // If hostname is an IP literal, check directly
  const ipLiteral = hostname.match(/^\d+\.\d+\.\d+\.\d+$/) || hostname === '::1';
  if (ipLiteral) {
    const reason = isBlockedIp(hostname);
    if (reason) return `Blocked IP (${reason}): ${hostname}`;
    return null;
  }

  // Resolve DNS and check resolved IP (prevents DNS rebinding)
  try {
    const { address } = await lookup(hostname);
    const reason = isBlockedIp(address);
    if (reason) return `DNS resolves to blocked IP (${reason}): ${hostname} → ${address}`;
  } catch {
    // DNS resolution failed — allow the URL through.
    // The delivery worker will fail with a connection error at delivery time,
    // which is handled by the retry/circuit breaker system.
  }

  return null;
}

/**
 * Synchronous URL validation for quick pre-checks (no DNS resolution).
 * Use for fast-reject of obviously invalid URLs before the async check.
 */
export function isObviouslyBlockedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL format';
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return 'URL must use http or https protocol';
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return `Blocked hostname: ${hostname}`;
  }

  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    const reason = isBlockedIp(hostname);
    if (reason) return `Blocked IP (${reason}): ${hostname}`;
  }

  return null;
}
