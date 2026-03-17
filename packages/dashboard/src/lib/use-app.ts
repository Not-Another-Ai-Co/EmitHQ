'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Hook to get the selected app ID from URL search params.
 * Falls back to 'default' if no ?app= param is present.
 */
export function useApp(): string {
  const searchParams = useSearchParams();
  return searchParams.get('app') ?? 'default';
}
