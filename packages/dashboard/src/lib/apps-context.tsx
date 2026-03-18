'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';

interface App {
  id: string;
  uid: string | null;
  name: string;
  createdAt: string;
  endpointCount: number;
  events24h: number;
}

interface AppsContextValue {
  apps: App[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  removeApp: (appId: string) => void;
  addApp: (app: App) => void;
}

const AppsContext = createContext<AppsContextValue | null>(null);

export function AppsProvider({ children }: { children: React.ReactNode }) {
  const apiFetch = useApiFetch();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/app');
      if (!res.ok) throw new Error('Failed to load applications');
      const json = await res.json();
      setApps(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const removeApp = useCallback((appId: string) => {
    setApps((prev) => prev.filter((a) => a.id !== appId));
  }, []);

  const addApp = useCallback((app: App) => {
    setApps((prev) => [...prev, app]);
  }, []);

  return (
    <AppsContext.Provider value={{ apps, loading, error, refetch, removeApp, addApp }}>
      {children}
    </AppsContext.Provider>
  );
}

export function useApps(): AppsContextValue {
  const ctx = useContext(AppsContext);
  if (!ctx) throw new Error('useApps must be used within AppsProvider');
  return ctx;
}
