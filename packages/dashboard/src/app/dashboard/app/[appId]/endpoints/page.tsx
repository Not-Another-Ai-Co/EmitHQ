'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';
import { useApp } from '@/lib/use-app';
import { Modal } from '@/components/modal';
import { ErrorBanner } from '@/components/error-banner';
import { SkeletonEndpointCard } from '@/components/skeleton';
import { toast } from 'sonner';
import { cleanRules, type TransformRule } from '@/components/transform-rule-editor';
import { EndpointCard } from './components/endpoint-card';
import { EndpointCreateForm } from './components/endpoint-create-form';
import type { Endpoint, EndpointHealth, TestResult } from './types';

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
  const [newSecret, setNewSecret] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFilter, setEditFilter] = useState('');
  const [editTransformRules, setEditTransformRules] = useState<TransformRule[]>([]);
  const [saving, setSaving] = useState(false);

  // Delete / test / toggle state
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
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
        for (const h of healthJson.data ?? []) map[h.id] = h;
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

  async function handleTest(epId: string) {
    setTestingId(epId);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[epId];
      return next;
    });
    try {
      const res = await apiFetch(`/api/v1/app/${APP_ID}/endpoint/${epId}/test`, { method: 'POST' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message ?? `Test failed (${res.status})`);
      }
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

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {showCreate && (
        <EndpointCreateForm
          tier={tier}
          url={createUrl}
          description={createDesc}
          filter={createFilter}
          transformRules={createTransformRules}
          creating={creating}
          apiFetch={apiFetch}
          onUrlChange={setCreateUrl}
          onDescChange={setCreateDesc}
          onFilterChange={setCreateFilter}
          onTransformRulesChange={setCreateTransformRules}
          onSubmit={handleCreate}
        />
      )}

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
          {endpoints.map((ep) => (
            <EndpointCard
              key={ep.id}
              endpoint={ep}
              health={healthMap[ep.id]}
              tier={tier}
              isEditing={editingId === ep.id}
              testResult={testResults[ep.id]}
              testingId={testingId}
              togglingId={togglingId}
              saving={saving}
              editUrl={editUrl}
              editDesc={editDesc}
              editFilter={editFilter}
              editTransformRules={editTransformRules}
              apiFetch={apiFetch}
              onStartEdit={startEdit}
              onCancelEdit={() => setEditingId(null)}
              onSave={handleSave}
              onTest={handleTest}
              onToggleDisabled={toggleDisabled}
              onDelete={setDeleteTarget}
              onEditUrlChange={setEditUrl}
              onEditDescChange={setEditDesc}
              onEditFilterChange={setEditFilter}
              onEditTransformRulesChange={setEditTransformRules}
            />
          ))}
        </div>
      )}

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
