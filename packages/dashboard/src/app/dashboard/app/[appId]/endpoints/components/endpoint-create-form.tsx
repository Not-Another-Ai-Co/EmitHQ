import {
  TransformRuleEditor,
  TransformPreview,
  hasTransformErrors,
  type TransformRule,
} from '@/components/transform-rule-editor';

interface EndpointCreateFormProps {
  tier: string;
  url: string;
  description: string;
  filter: string;
  transformRules: TransformRule[];
  creating: boolean;
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onUrlChange: (val: string) => void;
  onDescChange: (val: string) => void;
  onFilterChange: (val: string) => void;
  onTransformRulesChange: (rules: TransformRule[]) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EndpointCreateForm({
  tier,
  url,
  description,
  filter,
  transformRules,
  creating,
  apiFetch,
  onUrlChange,
  onDescChange,
  onFilterChange,
  onTransformRulesChange,
  onSubmit,
}: EndpointCreateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <h2 className="mb-4 text-lg font-semibold">Create Endpoint</h2>
      <div className="mb-4">
        <label
          htmlFor="create-ep-url"
          className="mb-1 block text-sm text-[var(--color-text-muted)]"
        >
          URL <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          id="create-ep-url"
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://your-app.com/webhooks"
          required
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="create-ep-desc"
          className="mb-1 block text-sm text-[var(--color-text-muted)]"
        >
          Description
        </label>
        <input
          id="create-ep-desc"
          type="text"
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="Production webhook endpoint"
          maxLength={256}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="create-ep-filter"
          className="mb-1 block text-sm text-[var(--color-text-muted)]"
        >
          Event type filter <span className="text-xs">(comma-separated, leave empty for all)</span>
        </label>
        <input
          id="create-ep-filter"
          type="text"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
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
            Transform Rules{transformRules.length > 0 ? ` (${transformRules.length})` : ''}
          </summary>
          <div className="mt-3">
            <TransformRuleEditor
              rules={transformRules}
              onChange={onTransformRulesChange}
              disabled={creating}
            />
            <TransformPreview rules={transformRules} apiFetch={apiFetch} />
          </div>
        </details>
      )}
      <button
        type="submit"
        disabled={creating || !url.trim() || hasTransformErrors(transformRules)}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
      >
        {creating ? 'Creating...' : 'Create Endpoint'}
      </button>
    </form>
  );
}
