import { describe, it, expect, vi } from 'vitest';

// Mock dns/promises before importing the module
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }),
}));

import { validateEndpointUrl, isObviouslyBlockedUrl } from './url-validator';
import { lookup } from 'node:dns/promises';

describe('isObviouslyBlockedUrl (sync)', () => {
  it('allows valid HTTPS URLs', () => {
    expect(isObviouslyBlockedUrl('https://example.com/webhooks')).toBeNull();
  });

  it('allows valid HTTP URLs', () => {
    expect(isObviouslyBlockedUrl('http://example.com/webhooks')).toBeNull();
  });

  it('rejects invalid URL format', () => {
    expect(isObviouslyBlockedUrl('not-a-url')).toBe('Invalid URL format');
  });

  it('rejects non-http protocols', () => {
    expect(isObviouslyBlockedUrl('ftp://example.com')).toBe('URL must use http or https protocol');
    expect(isObviouslyBlockedUrl('file:///etc/passwd')).toBe('URL must use http or https protocol');
  });

  it('blocks localhost', () => {
    expect(isObviouslyBlockedUrl('http://localhost/hook')).toBe('Blocked hostname: localhost');
  });

  it('blocks metadata.google.internal', () => {
    expect(isObviouslyBlockedUrl('http://metadata.google.internal/computeMetadata')).toBe(
      'Blocked hostname: metadata.google.internal',
    );
  });

  it('blocks loopback IP', () => {
    expect(isObviouslyBlockedUrl('http://127.0.0.1/hook')).toMatch(/loopback/);
  });

  it('blocks 10.x private IP', () => {
    expect(isObviouslyBlockedUrl('http://10.0.0.1/hook')).toMatch(/private/);
  });

  it('blocks 192.168.x private IP', () => {
    expect(isObviouslyBlockedUrl('http://192.168.1.1/hook')).toMatch(/private/);
  });

  it('blocks 172.16-31.x private IP', () => {
    expect(isObviouslyBlockedUrl('http://172.16.0.1/hook')).toMatch(/private/);
    expect(isObviouslyBlockedUrl('http://172.31.255.255/hook')).toMatch(/private/);
  });

  it('allows 172.32.x (not private)', () => {
    expect(isObviouslyBlockedUrl('http://172.32.0.1/hook')).toBeNull();
  });

  it('blocks link-local 169.254.x', () => {
    expect(isObviouslyBlockedUrl('http://169.254.169.254/latest/meta-data/')).toMatch(/link-local/);
  });

  it('does not block public IPs', () => {
    expect(isObviouslyBlockedUrl('http://93.184.216.34/hook')).toBeNull();
    expect(isObviouslyBlockedUrl('http://8.8.8.8/hook')).toBeNull();
  });
});

describe('validateEndpointUrl (async, with DNS)', () => {
  it('allows URLs resolving to public IPs', async () => {
    (lookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      address: '93.184.216.34',
      family: 4,
    });
    const result = await validateEndpointUrl('https://example.com/webhooks');
    expect(result).toBeNull();
  });

  it('blocks URLs resolving to private IPs (DNS rebinding)', async () => {
    (lookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      address: '10.0.0.5',
      family: 4,
    });
    const result = await validateEndpointUrl('https://evil-rebind.example.com/hook');
    expect(result).toMatch(/DNS resolves to blocked IP/);
    expect(result).toMatch(/10\.0\.0\.5/);
  });

  it('blocks URLs resolving to loopback', async () => {
    (lookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      address: '127.0.0.1',
      family: 4,
    });
    const result = await validateEndpointUrl('https://sneaky.example.com/hook');
    expect(result).toMatch(/loopback/);
  });

  it('blocks URLs resolving to cloud metadata IP', async () => {
    (lookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      address: '169.254.169.254',
      family: 4,
    });
    const result = await validateEndpointUrl('https://metadata-rebind.example.com');
    expect(result).toMatch(/link-local/);
  });

  it('allows URLs when DNS resolution fails (connectivity issue)', async () => {
    (lookup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('ENOTFOUND'));
    const result = await validateEndpointUrl('https://unreachable.example.com/hook');
    expect(result).toBeNull();
  });

  it('blocks IP literal in private range', async () => {
    const result = await validateEndpointUrl('https://192.168.1.1/hook');
    expect(result).toMatch(/private/);
  });

  it('rejects invalid URLs', async () => {
    const result = await validateEndpointUrl('not-a-url');
    expect(result).toBe('Invalid URL format');
  });
});
