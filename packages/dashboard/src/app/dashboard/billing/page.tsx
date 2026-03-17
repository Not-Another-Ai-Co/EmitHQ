'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiFetch } from '@/lib/use-api';

interface SubscriptionData {
  tier: 'free' | 'starter' | 'growth' | 'scale';
  subscriptionStatus: 'free' | 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string | null;
  usage: {
    current: number;
    limit: number;
    percentage: number;
  };
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

export default function BillingPage() {
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
      router.replace('/dashboard/billing');
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
      const res = await apiFetch('/api/v1/billing/portal', {
        method: 'POST',
      });
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

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Billing</h1>
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    );
  }

  const currentTier = TIERS.find((t) => t.id === sub?.tier) ?? TIERS[0];
  const status = statusLabel(sub?.subscriptionStatus ?? 'free');
  const pct = sub?.usage.percentage ?? 0;
  const barColor = usageBarColor(pct);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Billing</h1>

      {showSuccess && (
        <div className="mb-4 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]">
          Subscription activated! Your plan has been upgraded.
          <button
            onClick={() => setShowSuccess(false)}
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

          {/* Usage Bar */}
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
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: barColor,
                }}
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
                className={`rounded-xl border p-5 ${
                  isCurrent
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
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

                <div className="mt-4">
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
                      className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                        isDowngrade
                          ? 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                          : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/80'
                      }`}
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
