import { StatusBadge } from '@/components/status-badge';
import {
  TransformRuleEditor,
  TransformPreview,
  hasTransformErrors,
  type TransformRule,
} from '@/components/transform-rule-editor';
import { EndpointHealthMetrics } from './endpoint-health-metrics';
import type { Endpoint, EndpointHealth, TestResult } from '../types';

interface EndpointCardProps {
  endpoint: Endpoint;
  health?: EndpointHealth;
  tier: string;
  isEditing: boolean;
  testResult?: TestResult;
  testingId: string | null;
  togglingId: string | null;
  saving: boolean;
  editUrl: string;
  editDesc: string;
  editFilter: string;
  editTransformRules: TransformRule[];
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onStartEdit: (ep: Endpoint) => void;
  onCancelEdit: () => void;
  onSave: (epId: string) => void;
  onTest: (epId: string) => void;
  onToggleDisabled: (ep: Endpoint) => void;
  onDelete: (ep: Endpoint) => void;
  onEditUrlChange: (val: string) => void;
  onEditDescChange: (val: string) => void;
  onEditFilterChange: (val: string) => void;
  onEditTransformRulesChange: (rules: TransformRule[]) => void;
}

export function EndpointCard({
  endpoint: ep,
  health,
  tier,
  isEditing,
  testResult,
  testingId,
  togglingId,
  saving,
  editUrl,
  editDesc,
  editFilter,
  editTransformRules,
  apiFetch,
  onStartEdit,
  onCancelEdit,
  onSave,
  onTest,
  onToggleDisabled,
  onDelete,
  onEditUrlChange,
  onEditDescChange,
  onEditFilterChange,
  onEditTransformRulesChange,
}: EndpointCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm">{ep.url}</p>
          {ep.description && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{ep.description}</p>
          )}
        </div>
        <StatusBadge status={ep.disabled ? 'disabled' : 'active'} />
      </div>

      {/* Health metrics */}
      {health && <EndpointHealthMetrics health={health} />}

      {ep.disabledReason && ep.disabledReason !== 'deleted' && (
        <p className="mb-3 text-xs text-[var(--color-error)]">Disabled: {ep.disabledReason}</p>
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
            Transform: {ep.transformRules.length} rule{ep.transformRules.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Edit form (inline) */}
      {isEditing ? (
        <div className="mb-3 space-y-3 border-t border-[var(--color-border)] pt-3">
          <div>
            <label
              htmlFor={`edit-ep-url-${ep.id}`}
              className="mb-1 block text-xs text-[var(--color-text-muted)]"
            >
              URL
            </label>
            <input
              id={`edit-ep-url-${ep.id}`}
              type="url"
              value={editUrl}
              onChange={(e) => onEditUrlChange(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`edit-ep-desc-${ep.id}`}
              className="mb-1 block text-xs text-[var(--color-text-muted)]"
            >
              Description
            </label>
            <input
              id={`edit-ep-desc-${ep.id}`}
              type="text"
              value={editDesc}
              onChange={(e) => onEditDescChange(e.target.value)}
              maxLength={256}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`edit-ep-filter-${ep.id}`}
              className="mb-1 block text-xs text-[var(--color-text-muted)]"
            >
              Event filter (comma-separated)
            </label>
            <input
              id={`edit-ep-filter-${ep.id}`}
              type="text"
              value={editFilter}
              onChange={(e) => onEditFilterChange(e.target.value)}
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
                  onChange={onEditTransformRulesChange}
                  disabled={saving}
                />
                <TransformPreview rules={editTransformRules} apiFetch={apiFetch} />
              </div>
            </details>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onSave(ep.id)}
              disabled={saving || hasTransformErrors(editTransformRules)}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancelEdit}
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
            onClick={() => onStartEdit(ep)}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Edit
          </button>
          <button
            onClick={() => onTest(ep.id)}
            disabled={testingId === ep.id || ep.disabled}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
          >
            {testingId === ep.id ? 'Testing...' : 'Test'}
          </button>
          <button
            onClick={() => onToggleDisabled(ep)}
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
            onClick={() => onDelete(ep)}
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
}
