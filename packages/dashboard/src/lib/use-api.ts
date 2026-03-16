'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://100.82.36.13:4000';

/**
 * Hook that returns a fetch wrapper with Clerk Bearer token auth.
 * Use this instead of raw fetch with credentials: 'include'.
 */
export function useApiFetch() {
  const { getToken } = useAuth();

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const token = await getToken();
      const headers: Record<string, string> = {
        ...(init?.headers as Record<string, string>),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
      });
    },
    [getToken],
  );

  return apiFetch;
}
