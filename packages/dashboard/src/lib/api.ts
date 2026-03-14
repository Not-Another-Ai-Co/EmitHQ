// Dashboard API client — calls the EmitHQ API server

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface FetchOptions {
  token?: string;
  params?: Record<string, string>;
}

export async function apiGet<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (opts.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const res = await fetch(url.toString(), { headers, cache: 'no-store' });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `API error ${res.status}`);
  }

  return res.json();
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  opts: FetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const respBody = await res.json().catch(() => ({}));
    throw new Error(respBody?.error?.message ?? `API error ${res.status}`);
  }

  return res.json();
}
