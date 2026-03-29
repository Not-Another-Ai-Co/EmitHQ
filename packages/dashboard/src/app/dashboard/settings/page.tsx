'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiFetch } from '@/lib/use-api';
import { Modal } from '@/components/modal';
import { UserProfile } from '@clerk/nextjs';
import { toast } from 'sonner';

const TABS = [
  { id: 'api-keys', label: 'API Keys' },
  { id: 'billing', label: 'Billing' },
  { id: 'profile', label: 'Profile' },
  { id: 'danger-zone', label: 'Danger Zone' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function SettingsTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── API Keys Tab ──────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

function ApiKeysTab() {
  const apiFetch = useApiFetch();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/auth/keys');
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setKeys(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/auth/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      const json = await res.json();
      setNewKey(json.data.key);
      setCreateName('');
      setShowCreate(false);
      await fetchKeys();
      toast.success('API key created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/auth/keys/${revokeTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      setRevokeTarget(null);
      await fetchKeys();
      toast.success('API key revoked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setRevoking(false);
    }
  }

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Loading...</p>;
  }

  return (
    <section>
      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="ml-2 text-[var(--color-error)]/70 hover:text-[var(--color-error)]"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          {showCreate ? 'Cancel' : 'Generate New Key'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div className="mb-4">
            <label
              htmlFor="api-key-name"
              className="mb-1 block text-sm text-[var(--color-text-muted)]"
            >
              Key name <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              id="api-key-name"
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Production API key"
              required
              maxLength={128}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !createName.trim()}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
          >
            {creating ? 'Generating...' : 'Generate Key'}
          </button>
        </form>
      )}

      {keys.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">
            No API keys yet. Generate a key to start using the EmitHQ API.
          </p>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
            >
              Generate First Key
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Name</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] max-sm:hidden">
                  Created
                </th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] max-sm:hidden">
                  Last Used
                </th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-4 py-3 font-medium">{key.name}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] max-sm:hidden">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] max-sm:hidden">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setRevokeTarget(key)}
                      className="rounded-lg border border-[var(--color-error)]/30 px-3 py-1.5 text-xs text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!newKey} onClose={() => setNewKey(null)} title="API Key Created">
        <p className="mb-3 text-sm text-[var(--color-warning)]">
          Copy this key now — it won&apos;t be shown again.
        </p>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <code className="block break-all font-mono text-sm">{newKey}</code>
        </div>
        <button
          onClick={() => {
            if (newKey) {
              navigator.clipboard.writeText(newKey);
              toast.success('Copied to clipboard');
            }
          }}
          className="mt-3 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          Copy to Clipboard
        </button>
      </Modal>

      <Modal open={!!revokeTarget} onClose={() => setRevokeTarget(null)} title="Revoke API Key">
        <p className="mb-2 text-sm text-[var(--color-text-muted)]">
          Are you sure you want to revoke this key? Any integrations using it will stop working.
        </p>
        {keys.length === 1 && (
          <p className="mb-2 text-sm font-medium text-[var(--color-error)]">
            This is your only API key. Revoking it will disable all API access until you generate a
            new one.
          </p>
        )}
        {revokeTarget && <p className="mb-4 font-medium">{revokeTarget.name}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-error)]/80 disabled:opacity-50"
          >
            {revoking ? 'Revoking...' : 'Revoke Key'}
          </button>
          <button
            onClick={() => setRevokeTarget(null)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </section>
  );
}

// ─── Billing Tab ───────────────────────────────────────────────────────────

interface SubscriptionData {
  tier: 'free' | 'starter' | 'growth' | 'scale';
  subscriptionStatus: 'free' | 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string | null;
  usage: { current: number; limit: number; percentage: number };
  hasStripeCustomer: boolean;
  hasSubscription: boolean;
}

const TIERS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    events: '100K',
    eventsNum: 100_000,
    features: ['100K events/month', 'Standard webhooks', 'Community support'],
  },
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 49,
    events: '500K',
    eventsNum: 500_000,
    features: [
      '500K events/month',
      'Standard webhooks',
      'Email support',
      'Payload transformations',
    ],
  },
  {
    id: 'growth' as const,
    name: 'Growth',
    price: 149,
    events: '2M',
    eventsNum: 2_000_000,
    features: [
      '2M events/month',
      'Standard webhooks',
      'Priority support',
      'Payload transformations',
      'Custom retry schedules',
    ],
  },
  {
    id: 'scale' as const,
    name: 'Scale',
    price: 349,
    events: '10M',
    eventsNum: 10_000_000,
    features: [
      '10M events/month',
      'Standard webhooks',
      'Dedicated support',
      'Payload transformations',
      'Custom retry schedules',
      'SLA guarantee',
    ],
  },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toString();
}

function usageBarColor(percentage: number): string {
  if (percentage >= 100) return 'var(--color-error)';
  if (percentage >= 70) return 'var(--color-warning)';
  return 'var(--color-success)';
}

function statusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'active':
      return { text: 'Active', color: 'var(--color-success)' };
    case 'canceled':
      return { text: 'Canceling', color: 'var(--color-warning)' };
    case 'past_due':
      return { text: 'Past Due', color: 'var(--color-error)' };
    default:
      return { text: 'Free', color: 'var(--color-text-muted)' };
  }
}

function BillingTab() {
  const apiFetch = useApiFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/billing/subscription');
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setSub(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setShowSuccess(true);
      router.replace('/dashboard/settings?tab=billing');
      fetchSubscription();
    }
  }, [searchParams, router, fetchSubscription]);

  async function handleCheckout(tier: string) {
    setActionLoading(tier);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError(
            'You already have an active subscription. Use "Manage Subscription" to change plans.',
          );
          return;
        }
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      const json = await res.json();
      window.location.href = json.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePortal() {
    setActionLoading('portal');
    setError(null);
    try {
      const res = await apiFetch('/api/v1/billing/portal', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      const json = await res.json();
      window.location.href = json.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;

  const currentTier = TIERS.find((t) => t.id === sub?.tier) ?? TIERS[0];
  const status = statusLabel(sub?.subscriptionStatus ?? 'free');
  const pct = sub?.usage.percentage ?? 0;
  const barColor = usageBarColor(pct);

  return (
    <div>
      {showSuccess && (
        <div className="mb-4 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]">
          Subscription activated! Your plan has been upgraded.
          <button
            onClick={() => setShowSuccess(false)}
            aria-label="Dismiss"
            className="ml-2 text-[var(--color-success)]/70 hover:text-[var(--color-success)]"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="ml-2 text-[var(--color-error)]/70 hover:text-[var(--color-error)]"
          >
            ×
          </button>
        </div>
      )}

      {sub?.subscriptionStatus === 'past_due' && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          Your payment has failed. Please update your payment method to avoid service interruption.
          {sub.hasStripeCustomer && (
            <button
              onClick={handlePortal}
              disabled={actionLoading === 'portal'}
              className="ml-2 underline hover:no-underline"
            >
              Update payment method
            </button>
          )}
        </div>
      )}

      {/* Current Plan */}
      <section className="mb-8">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{currentTier.name} Plan</h2>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${status.color}20`, color: status.color }}
                >
                  {status.text}
                </span>
                {currentTier.price > 0 && (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    ${currentTier.price}/mo
                  </span>
                )}
              </div>
            </div>
            {sub?.hasStripeCustomer && (
              <button
                onClick={handlePortal}
                disabled={!!actionLoading}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
              >
                {actionLoading === 'portal' ? 'Opening...' : 'Manage Subscription'}
              </button>
            )}
          </div>
          <ul className="mb-4 space-y-1">
            {currentTier.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
              >
                <span className="text-[var(--color-success)]">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {sub?.subscriptionStatus === 'canceled' && sub.currentPeriodEnd && (
            <p className="mb-4 text-sm text-[var(--color-warning)]">
              Your subscription will end on{' '}
              {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              . You can resubscribe anytime.
            </p>
          )}
          <div className="mt-2">
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Events this month</span>
              <span>
                <span className="font-medium">{formatNumber(sub?.usage.current ?? 0)}</span>
                <span className="text-[var(--color-text-muted)]">
                  {' '}
                  / {formatNumber(sub?.usage.limit ?? 0)}
                </span>
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-[var(--color-text-muted)]">
              {pct >= 100 ? `${pct}% — over limit` : `${pct}% used`}
            </p>
          </div>
        </div>
      </section>

      {/* Tier Cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          {sub?.tier === 'free' ? 'Upgrade your plan' : 'Available plans'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.id === sub?.tier;
            const isDowngrade =
              sub?.tier !== 'free' && tier.eventsNum < (currentTier?.eventsNum ?? 0);
            return (
              <div
                key={tier.id}
                className={`flex flex-col rounded-xl border p-5 ${isCurrent ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}
              >
                <h3 className="font-semibold">{tier.name}</h3>
                <p className="mt-1 text-2xl font-bold">
                  {tier.price === 0 ? (
                    'Free'
                  ) : (
                    <>
                      ${tier.price}
                      <span className="text-sm font-normal text-[var(--color-text-muted)]">
                        /mo
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {tier.events} events/month
                </p>
                <ul className="mt-4 space-y-1.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]"
                    >
                      <span className="mt-0.5 text-[var(--color-success)]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4">
                  {isCurrent ? (
                    <span className="inline-block rounded-lg border border-[var(--color-accent)]/30 px-4 py-2 text-sm text-[var(--color-accent)]">
                      Current plan
                    </span>
                  ) : tier.id === 'free' ? (
                    isDowngrade && sub?.hasStripeCustomer ? (
                      <button
                        onClick={handlePortal}
                        disabled={!!actionLoading}
                        className="w-full rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
                      >
                        Manage in portal
                      </button>
                    ) : null
                  ) : sub?.subscriptionStatus === 'active' ? (
                    <button
                      onClick={handlePortal}
                      disabled={!!actionLoading}
                      className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${isDowngrade ? 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]' : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/80'}`}
                    >
                      {isDowngrade ? 'Downgrade' : 'Upgrade'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(tier.id)}
                      disabled={!!actionLoading}
                      className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
                    >
                      {actionLoading === tier.id ? 'Redirecting...' : `Upgrade to ${tier.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────

function ProfileTab() {
  return <UserProfile routing="hash" />;
}

// ─── Danger Zone Tab ───────────────────────────────────────────────────────

interface DeletedApp {
  id: string;
  uid: string | null;
  name: string;
  deletedAt: string;
}

function DangerZoneTab() {
  const apiFetch = useApiFetch();
  const [apps, setApps] = useState<DeletedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchDeleted = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/app?deleted=true');
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setApps(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deleted apps');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  async function handleRestore(appId: string) {
    setRestoring(appId);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/app/${appId}/restore`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      await fetchDeleted();
      toast.success('Application restored');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore application');
    } finally {
      setRestoring(null);
    }
  }

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="ml-2 text-[var(--color-error)]/70 hover:text-[var(--color-error)]"
          >
            ×
          </button>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No recently deleted apps.</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Deleted apps will appear here for 30 days before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            These apps will be permanently deleted after 30 days.
          </p>
          {apps.map((app) => {
            const deletedDate = new Date(app.deletedAt);
            const daysRemaining = Math.max(
              0,
              30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)),
            );
            return (
              <div
                key={app.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div>
                  <p className="font-medium">{app.name}</p>
                  {app.uid && (
                    <p className="text-xs text-[var(--color-text-muted)]">uid: {app.uid}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Deleted {deletedDate.toLocaleDateString()} · {daysRemaining} day
                    {daysRemaining !== 1 ? 's' : ''} remaining
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(app.id)}
                  disabled={restoring === app.id}
                  className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
                >
                  {restoring === app.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Settings Page (Tabbed) ────────────────────────────────────────────────

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const activeTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'api-keys';

  function handleTabChange(tab: TabId) {
    router.push(`/dashboard/settings?tab=${tab}`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <SettingsTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === 'api-keys' && <ApiKeysTab />}
      {activeTab === 'billing' && <BillingTab />}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'danger-zone' && <DangerZoneTab />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <h1 className="mb-6 text-2xl font-bold">Settings</h1>
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
