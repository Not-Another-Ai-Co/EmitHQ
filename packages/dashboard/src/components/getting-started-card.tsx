'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';

const SDK_SNIPPET = `import { EmitHQ } from '@emithq/sdk';

const emithq = new EmitHQ('YOUR_API_KEY');

await emithq.sendEvent('YOUR_APP_ID', {
  eventType: 'user.created',
  payload: { id: 'user_123', email: 'user@example.com' },
});`;

interface StepDef {
  id: string;
  title: string;
  description: string;
}

const STEPS: StepDef[] = [
  {
    id: 'create-app',
    title: '1. Create an application',
    description: 'Applications represent your customers or services that send webhooks.',
  },
  {
    id: 'generate-key',
    title: '2. Generate an API key',
    description: 'API keys authenticate your SDK and API calls.',
  },
  {
    id: 'create-endpoint',
    title: '3. Create an endpoint',
    description: 'Add a destination URL to receive webhook deliveries.',
  },
  {
    id: 'send-event',
    title: '4. Send your first event',
    description: 'Use the SDK or API to trigger a webhook delivery.',
  },
];

export function GettingStartedCard() {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash
  const [completed, setCompleted] = useState<Record<string, boolean>>({
    'create-app': false,
    'generate-key': false,
    'create-endpoint': false,
    'send-event': false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkDismissed = useCallback(async () => {
    // Check localStorage first for instant UI
    if (localStorage.getItem('emithq_onboarding_dismissed') === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    // Check server state
    try {
      const res = await apiFetch('/api/v1/onboarding/status');
      if (res.ok) {
        const json = await res.json();
        if (json.data.dismissed) {
          localStorage.setItem('emithq_onboarding_dismissed', 'true');
          setDismissed(true);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Server unavailable — fall back to localStorage
    }

    setDismissed(false);
  }, [apiFetch]);

  const checkProgress = useCallback(async () => {
    try {
      const [appsRes, keysRes] = await Promise.all([
        apiFetch('/api/v1/app'),
        apiFetch('/api/v1/auth/keys'),
      ]);

      const appsJson = appsRes.ok ? await appsRes.json() : { data: [] };
      const keysJson = keysRes.ok ? await keysRes.json() : { data: [] };

      const apps = appsJson.data ?? [];
      const keys = keysJson.data ?? [];

      const hasApp = apps.length > 0;
      const hasKey = keys.length > 0;
      let hasEndpoint = false;
      let hasEvent = false;

      if (hasApp) {
        const firstAppId = apps[0].uid ?? apps[0].id;
        const [endpointsRes, msgsRes] = await Promise.all([
          apiFetch(`/api/v1/app/${firstAppId}/endpoint`),
          apiFetch(`/api/v1/app/${firstAppId}/msg`),
        ]);

        if (endpointsRes.ok) {
          const endpointsJson = await endpointsRes.json();
          hasEndpoint = (endpointsJson.data ?? []).length > 0;
        }
        if (msgsRes.ok) {
          const msgsJson = await msgsRes.json();
          hasEvent = (msgsJson.data ?? []).length > 0;
        }
      }

      const newCompleted = {
        'create-app': hasApp,
        'generate-key': hasKey,
        'create-endpoint': hasEndpoint,
        'send-event': hasEvent,
      };
      setCompleted(newCompleted);

      const done = Object.values(newCompleted).every(Boolean);
      if (done) {
        setShowSuccess(true);
        // Auto-dismiss after showing success briefly
        setTimeout(() => handleDismiss(), 3000);
      }
    } catch {
      // Ignore — checklist remains in current state
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    checkDismissed().then(() => {
      // Only check progress if not dismissed
      if (localStorage.getItem('emithq_onboarding_dismissed') !== 'true') {
        checkProgress();
      }
    });
  }, []);

  async function handleDismiss() {
    // Set localStorage immediately for instant UI feedback
    localStorage.setItem('emithq_onboarding_dismissed', 'true');
    setDismissed(true);

    // Persist to server (fire-and-forget)
    try {
      await apiFetch('/api/v1/onboarding/dismiss', { method: 'POST' });
    } catch {
      // Server unavailable — localStorage already set
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(SDK_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Don't render if dismissed or still checking
  if (dismissed || loading) return null;

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPct = Math.round((completedCount / 4) * 100);

  if (showSuccess) {
    return (
      <div className="mb-6 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-5 text-center">
        <p className="text-lg font-semibold text-[var(--color-success)]">You&apos;re all set!</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Your webhook infrastructure is ready. Events will be delivered to your endpoints
          automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Getting Started</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            {completedCount} of 4 steps complete
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              backgroundColor: 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const done = completed[step.id];
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  done
                    ? 'bg-[var(--color-success)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {done ? '✓' : ''}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${done ? 'text-[var(--color-success)]' : ''}`}>
                  {step.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{step.description}</p>

                {step.id === 'send-event' && !done && (
                  <div className="mt-3">
                    <div className="relative">
                      <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
                        <code>{SDK_SNIPPET}</code>
                      </pre>
                      <button
                        onClick={handleCopy}
                        className="absolute right-2 top-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
