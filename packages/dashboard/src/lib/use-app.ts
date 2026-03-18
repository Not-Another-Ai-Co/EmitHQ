'use client';

import { useParams } from 'next/navigation';

/**
 * Hook to get the selected app ID from the URL path segment.
 * Only works within /dashboard/app/[appId]/* routes.
 */
export function useApp(): string {
  const params = useParams<{ appId: string }>();
  return params.appId;
}
