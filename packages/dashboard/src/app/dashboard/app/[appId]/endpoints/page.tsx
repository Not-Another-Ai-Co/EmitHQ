'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';
import { useApp } from '@/lib/use-app';
import { StatusBadge } from '@/components/status-badge';
import { Modal } from '@/components/modal';
import { SkeletonEndpointCard } from '@/components/skeleton';
import { toast } from 'sonner';
import {
  TransformRuleEditor,
  TransformPreview,
  hasTransformErrors,
  cleanRules,
  type TransformRule,
} from '@/components/transform-rule-editor';

interface Endpoint {
  id: string;
  uid: string | null;
  url: string;
  description: string | null;
  disabled: boolean;
  disabledReason: string | null;
  failureCount: number;
  eventTypeFilter: string[] | null;
  transformRules: TransformRule[] | null;
  rateLimit: number | null;
  createdAt: string;
}

interface EndpointHealth {
  id: string;
  totalAttempts: number;
  deliveredCount: number;
  successRate: number;
  avgLatencyMs: number;
  lastDelivery: string | null;
}

interface TestResult {
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}

export default function EndpointsPage() {
  const APP_ID = useApp();
  const apiFetch = useApiFetch();

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [healthMap, setHealthMap] = useState<Record<string, EndpointHealth>>({});
  const [tier, setTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createUrl, setCreateUrl] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createFilter, setCreateFilter] = useState('');
  const [createTransformRules, setCreateTransformRules] = useState<TransformRule[]>([]);
  const [creating, setCreating] = useState(false);

  // Secret modal (shown after create)
  const [newSecret, setNewSecret] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFilter, setEditFilter] = useState('');
  const [editTransformRules, setEditTransformRules] = useState<TransformRule[]>([]);
  const [saving, setSaving] = useState(false);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Test state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // Action loading (disable/enable)
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      const [epRes, healthRes, subRes] = await Promise.all([
        apiFetch(`/api/v1/app/${APP_ID}/endpoint?limit=100`),
        apiFetch(`/api/v1/app/${APP_ID}/endpoint-health`),
        apiFetch('/api/v1/billing/subscription'),
      ]);
      if (epRes.ok) {
        const epJson = await epRes.json();
        setEndpoints(epJson.data ?? []);
      }
      if (healthRes.ok) {
        const healthJson = await healthRes.json();
        const map: Record<string, EndpointHealth> = {};
        for (const h of healthJson.data ?? []) {
          map[h.id] = h;
        }
        setHealthMap(map);
      }
      if (subRes.ok) {
        const subJson = await subRes.json();
        setTier(subJson.data?.tier ?? 'free');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, APP_ID]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  // --- Create ---
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createUrl.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { url: createUrl.trim() };
      if (createDesc.trim()) body.description = createDesc.trim();
      if (createFilter.trim()) {
        body.eventTypeFilter = createFilter
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      const transformRules = cleanRules(createTransformRules);
      if (transformRules) body.transformRules = transformRules;
      const res = await apiFetch(`/api/v1/app/${APP_ID}/endpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      const json = await res.json();
      setNewSecret(json.data.signingSecret);
      setCreateUrl('');
      setCreateDesc('');
      setCreateFilter('');
      setCreateTransformRules([]);
      setShowCreate(false);
      await fetchEndpoints();
      toast.success('Endpoint created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create endpoint');
    } finally {
      setCreating(false);
    }
  }

  // --- Edit ---
  function startEdit(ep: Endpoint) {
    setEditingId(ep.id);
    setEditUrl(ep.url);
    setEditDesc(ep.description ?? '');
    setEditFilter(ep.eventTypeFilter?.join(', ') ?? '');
    setEditTransformRules(ep.transformRules ?? []);
  }

  async function handleSave(epId: string) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      const current = endpoints.find((e) => e.id === epId);
      if (editUrl.trim() !== current?.url) body.url = editUrl.trim();
      if (editDesc.trim() !== (current?.description ?? '')) body.description = editDesc.trim();
      const newFilter = editFilter
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const currentFilter = current?.eventTypeFilter ?? [];
      if (JSON.stringify(newFilter) !== JSON.stringify(currentFilter)) {
        body.eventTypeFilter = newFilter.length > 0 ? newFilter : null;
      }
      const newTransformRules = cleanRules(editTransformRules);
      const currentTransformRules = current?.transformRules ?? null;
      if (JSON.stringify(newTransformRules) !== JSON.stringify(currentTransformRules)) {
        body.transformRules = newTransformRules;
      }
      if (Object.keys(body).length === 0) {
        setEditingId(null);
        return;
      }
      const res = await apiFetch(`/api/v1/app/${APP_ID}/endpoint/${epId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      setEditingId(null);
      await fetchEndpoints();
      toast.success('Endpoint updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update endpoint');
    } finally {
      setSaving(false);
    }
  }

  // --- Delete ---
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/app/${APP_ID}/endpoint/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      setDeleteTarget(null);
      await fetchEndpoints();
      toast.success('Endpoint deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete endpoint');
    } finally {
      setDeleting(false);
    }
  }

  // --- Toggle disable/enable ---
  async function toggleDisabled(ep: Endpoint) {
    setTogglingId(ep.id);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/app/${APP_ID}/endpoint/${ep.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !ep.disabled }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      await fetchEndpoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update endpoint');
    } finally {
      setTogglingId(null);
    }
  }

  // --- Test ---
  async function handleTest(epId: string) {
    setTestingId(epId);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[epId];
      return next;
    });
    try {
      const res = await apiFetch(`/api/v1/app/${APP_ID}/endpoint/${epId}/test`, {
        method: 'POST',
      });
      const json = await res.json();
      setTestResults((prev) => ({ ...prev, [epId]: json.data }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [epId]: {
          success: false,
          statusCode: null,
          responseBody: null,
          responseTimeMs: null,
          errorMessage: 'Request failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Endpoints</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonEndpointCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Endpoints</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          {showCreate ? 'Cancel' : 'New Endpoint'}
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

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 className="mb-4 text-lg font-semibold">Create Endpoint</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
              URL <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="url"
              value={createUrl}
              onChange={(e) => setCreateUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks"
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Description</label>
            <input
              type="text"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Production webhook endpoint"
              maxLength={256}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
              Event type filter{' '}
              <span className="text-xs">(comma-separated, leave empty for all)</span>
            </label>
            <input
              type="text"
              value={createFilter}
              onChange={(e) => setCreateFilter(e.target.value)}
              placeholder="order.created, payment.completed"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          {tier === 'free' ? (
            <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
              <p className="mb-2 text-sm text-[var(--color-text-muted)]">
                Payload transforms are available on Starter and above.
              </p>
              <a
                href="/dashboard/settings?tab=billing"
                className="inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
              >
                Upgrade to Starter — $49/mo
              </a>
            </div>
          ) : (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Transform Rules
                {createTransformRules.length > 0 ? ` (${createTransformRules.length})` : ''}
              </summary>
              <div className="mt-3">
                <TransformRuleEditor
                  rules={createTransformRules}
                  onChange={setCreateTransformRules}
                  disabled={creating}
                />
                <TransformPreview rules={createTransformRules} apiFetch={apiFetch} />
              </div>
            </details>
          )}
          <button
            type="submit"
            disabled={creating || !createUrl.trim() || hasTransformErrors(createTransformRules)}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Endpoint'}
          </button>
        </form>
      )}

      {/* Endpoint list */}
      {endpoints.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">
            No endpoints configured yet. Create your first endpoint to start receiving webhooks.
          </p>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
            >
              Create First Endpoint
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {endpoints.map((ep) => {
            const health = healthMap[ep.id];
            const isEditing = editingId === ep.id;
            const testResult = testResults[ep.id];

            return (
              <div
                key={ep.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm">{ep.url}</p>
                    {ep.description && (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {ep.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={ep.disabled ? 'disabled' : 'active'} />
                </div>

                {/* Health metrics */}
                {health && (
                  <div className="mb-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Success Rate</p>
                      <p
                        className={`font-semibold ${
                          health.successRate >= 95
                            ? 'text-[var(--color-success)]'
                            : health.successRate >= 80
                              ? 'text-[var(--color-warning)]'
                              : 'text-[var(--color-error)]'
                        }`}
                      >
                        {health.successRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Avg Latency</p>
                      <p className="font-semibold">{health.avgLatencyMs}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Failures</p>
                      <p className="font-semibold">{ep.failureCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Last Delivery</p>
                      <p className="text-xs">
                        {health.lastDelivery ? new Date(health.lastDelivery).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                )}

                {ep.disabledReason && ep.disabledReason !== 'deleted' && (
                  <p className="mb-3 text-xs text-[var(--color-error)]">
                    Disabled: {ep.disabledReason}
                  </p>
                )}

                {ep.eventTypeFilter && ep.eventTypeFilter.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Filters: {ep.eventTypeFilter.join(', ')}
                    </p>
                  </div>
                )}

                {ep.transformRules && ep.transformRules.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Transform: {ep.transformRules.length} rule
                      {ep.transformRules.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Edit form (inline) */}
                {isEditing ? (
                  <div className="mb-3 space-y-3 border-t border-[var(--color-border)] pt-3">
                    <div>
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        URL
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        maxLength={256}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Event filter (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editFilter}
                        onChange={(e) => setEditFilter(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                      />
                    </div>
                    {tier === 'free' ? (
                      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Payload transforms are available on Starter and above.
                        </p>
                        <a
                          href="/dashboard/settings?tab=billing"
                          className="mt-2 inline-block rounded px-3 py-1 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
                        >
                          Upgrade to Starter
                        </a>
                      </div>
                    ) : (
                      <details open={editTransformRules.length > 0}>
                        <summary className="cursor-pointer text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                          Transform Rules
                          {editTransformRules.length > 0 ? ` (${editTransformRules.length})` : ''}
                        </summary>
                        <div className="mt-3">
                          <TransformRuleEditor
                            rules={editTransformRules}
                            onChange={setEditTransformRules}
                            disabled={saving}
                          />
                          <TransformPreview rules={editTransformRules} apiFetch={apiFetch} />
                        </div>
                      </details>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(ep.id)}
                        disabled={saving || hasTransformErrors(editTransformRules)}
                        className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                    <button
                      onClick={() => startEdit(ep)}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTest(ep.id)}
                      disabled={testingId === ep.id || ep.disabled}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
                    >
                      {testingId === ep.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => toggleDisabled(ep)}
                      disabled={togglingId === ep.id}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                        ep.disabled
                          ? 'border-[var(--color-success)]/30 text-[var(--color-success)] hover:bg-[var(--color-success)]/10'
                          : 'border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10'
                      }`}
                    >
                      {togglingId === ep.id ? '...' : ep.disabled ? 'Enable' : 'Disable'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(ep)}
                      className="rounded-lg border border-[var(--color-error)]/30 px-3 py-1.5 text-xs text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {/* Test result */}
                {testResult && (
                  <div
                    className={`mt-3 rounded-lg border p-3 text-xs ${
                      testResult.success
                        ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]'
                        : 'border-[var(--color-error)]/30 bg-[var(--color-error)]/10 text-[var(--color-error)]'
                    }`}
                  >
                    <p className="font-medium">
                      {testResult.success ? 'Test passed' : 'Test failed'}
                      {testResult.statusCode && ` — HTTP ${testResult.statusCode}`}
                      {testResult.responseTimeMs && ` (${testResult.responseTimeMs}ms)`}
                    </p>
                    {testResult.errorMessage && <p className="mt-1">{testResult.errorMessage}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Secret modal (shown after create) */}
      <Modal open={!!newSecret} onClose={() => setNewSecret(null)} title="Signing Secret">
        <p className="mb-3 text-sm text-[var(--color-warning)]">
          Copy this secret now — it won&apos;t be shown again.
        </p>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <code className="block break-all font-mono text-sm">{newSecret}</code>
        </div>
        <button
          onClick={() => {
            if (newSecret) {
              navigator.clipboard.writeText(newSecret);
              toast.success('Copied to clipboard');
            }
          }}
          className="mt-3 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          Copy to Clipboard
        </button>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Endpoint">
        <p className="mb-2 text-sm text-[var(--color-text-muted)]">
          Are you sure you want to delete this endpoint?
        </p>
        {deleteTarget && <p className="mb-4 truncate font-mono text-sm">{deleteTarget.url}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-error)]/80 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
