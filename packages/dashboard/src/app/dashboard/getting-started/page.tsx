'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApiFetch } from '@/lib/use-api';

interface StepDef {
  id: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}

const STEPS: StepDef[] = [
  {
    id: 'create-app',
    title: '1. Create an application',
    description: 'Applications represent your customers or services that send webhooks.',
    href: '/dashboard/applications',
    linkLabel: 'Go to Applications',
  },
  {
    id: 'generate-key',
    title: '2. Generate an API key',
    description: 'API keys authenticate your SDK and API calls.',
    href: '/dashboard/settings',
    linkLabel: 'Go to Settings',
  },
  {
    id: 'create-endpoint',
    title: '3. Create an endpoint',
    description: 'Add a destination URL to receive webhook deliveries.',
    href: '/dashboard/endpoints',
    linkLabel: 'Go to Endpoints',
  },
  {
    id: 'send-event',
    title: '4. Send your first event',
    description: 'Use the SDK or API to trigger a webhook delivery.',
    href: '',
    linkLabel: '',
  },
];

const SDK_SNIPPET = `import { EmitHQ } from '@emithq/sdk';

const emithq = new EmitHQ('YOUR_API_KEY');

await emithq.sendEvent('YOUR_APP_ID', {
  eventType: 'user.created',
  payload: { id: 'user_123', email: 'user@example.com' },
});`;

export default function GettingStartedPage() {
  const apiFetch = useApiFetch();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({
    'create-app': false,
    'generate-key': false,
    'create-endpoint': false,
    'send-event': false,
  });
  const [copied, setCopied] = useState(false);

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

      setCompleted({
        'create-app': hasApp,
        'generate-key': hasKey,
        'create-endpoint': hasEndpoint,
        'send-event': hasEvent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check progress');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    checkProgress();
  }, [checkProgress]);

  function handleDismiss() {
    localStorage.setItem('emithq_onboarding_dismissed', 'true');
    router.push('/dashboard');
  }

  function handleCopy() {
    navigator.clipboard.writeText(SDK_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const completedCount = Object.values(completed).filter(Boolean).length;
  const allDone = completedCount === 4;
  const progressPct = Math.round((completedCount / 4) * 100);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Getting Started</h1>
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Getting Started</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {allDone ? "All done! You're ready to go." : `${completedCount} of 4 steps complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          {allDone ? 'Close' : 'Dismiss'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-[var(--color-error)]/70 hover:text-[var(--color-error)]"
          >
            ×
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              backgroundColor: allDone ? 'var(--color-success)' : 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step) => {
          const done = completed[step.id];
          return (
            <div
              key={step.id}
              className={`rounded-xl border p-5 ${
                done
                  ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
                    done
                      ? 'bg-[var(--color-success)] text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {done ? '✓' : ''}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${done ? 'text-[var(--color-success)]' : ''}`}>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{step.description}</p>

                  {step.id === 'send-event' && !done && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium">
                        Install the SDK and send your first event:
                      </p>
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm">
                          <code>{SDK_SNIPPET}</code>
                        </pre>
                        <button
                          onClick={handleCopy}
                          className="absolute right-2 top-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        Replace <code>YOUR_API_KEY</code> and <code>YOUR_APP_ID</code> with your
                        actual values from the previous steps.
                      </p>
                    </div>
                  )}

                  {step.href && !done && (
                    <Link
                      href={step.href}
                      className="mt-3 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
                    >
                      {step.linkLabel}
                    </Link>
                  )}

                  {done && <p className="mt-2 text-xs text-[var(--color-success)]">Completed</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-8 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-5 text-center">
          <p className="text-lg font-semibold text-[var(--color-success)]">You&apos;re all set!</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Your webhook infrastructure is ready. Events will be delivered to your endpoints
            automatically.
          </p>
          <button
            onClick={handleDismiss}
            className="mt-4 rounded-lg bg-[var(--color-accent)] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
