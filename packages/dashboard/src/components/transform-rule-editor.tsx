'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TransformRule {
  sourcePath: string;
  targetField: string;
  template?: string;
}

const MAX_RULES = 20;
const TARGET_FIELD_RE = /^[a-zA-Z0-9_.-]{1,64}$/;

interface TransformRuleEditorProps {
  rules: TransformRule[];
  onChange: (rules: TransformRule[]) => void;
  disabled?: boolean;
}

function validateSourcePath(path: string): string | null {
  if (!path) return null; // empty is handled by required check on save
  if (!path.startsWith('$')) return 'Must start with $';
  if (path.length > 256) return 'Max 256 characters';
  return null;
}

function validateTargetField(field: string): string | null {
  if (!field) return null;
  if (!TARGET_FIELD_RE.test(field)) return 'Letters, numbers, _ . - only (max 64)';
  return null;
}

function validateTemplate(tpl: string): string | null {
  if (!tpl) return null;
  if (tpl.length > 512) return 'Max 512 characters';
  return null;
}

const FUNCTION_REFERENCE = [
  { name: 'uppercase', sig: 'uppercase($.path)', desc: 'Convert to uppercase' },
  { name: 'lowercase', sig: 'lowercase($.path)', desc: 'Convert to lowercase' },
  { name: 'formatDate', sig: 'formatDate($.path, "YYYY-MM-DD")', desc: 'Format a date' },
  { name: 'concat', sig: 'concat($.first, " ", $.last)', desc: 'Join values' },
];

export function TransformRuleEditor({ rules, onChange, disabled }: TransformRuleEditorProps) {
  const [showHelp, setShowHelp] = useState(false);

  function addRule() {
    if (rules.length >= MAX_RULES) return;
    onChange([...rules, { sourcePath: '', targetField: '' }]);
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, i) => i !== index));
  }

  function updateRule(index: number, field: keyof TransformRule, value: string) {
    const updated = rules.map((r, i) =>
      i === index ? { ...r, [field]: value || (field === 'template' ? undefined : '') } : r,
    );
    onChange(updated);
  }

  // Check for duplicate target fields
  const targetCounts = new Map<string, number>();
  for (const r of rules) {
    if (r.targetField) {
      targetCounts.set(r.targetField, (targetCounts.get(r.targetField) ?? 0) + 1);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <label className="text-sm text-[var(--color-text-muted)]">
          Transform Rules{' '}
          {rules.length > 0 && (
            <span className="text-xs">
              ({rules.length}/{MAX_RULES})
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="rounded px-1.5 py-0.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
          title="Function reference"
        >
          ?
        </button>
      </div>

      {showHelp && (
        <div className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
          <p className="mb-2 font-medium">Available template functions:</p>
          <div className="space-y-1">
            {FUNCTION_REFERENCE.map((fn) => (
              <div key={fn.name} className="flex gap-2">
                <code className="shrink-0 text-[var(--color-accent)]">{fn.sig}</code>
                <span className="text-[var(--color-text-muted)]">{fn.desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Source paths use JSONPath: <code>$.data.user.email</code>, <code>$.items[0].name</code>
          </p>
        </div>
      )}

      {rules.length === 0 ? (
        <p className="mb-2 text-xs text-[var(--color-text-muted)]">
          No transform rules — payload will be forwarded as-is.
        </p>
      ) : (
        <div className="mb-2 space-y-2">
          {rules.map((rule, i) => {
            const sourceErr = validateSourcePath(rule.sourcePath);
            const targetErr = validateTargetField(rule.targetField);
            const templateErr = validateTemplate(rule.template ?? '');
            const isDuplicate = rule.targetField && (targetCounts.get(rule.targetField) ?? 0) > 1;

            return (
              <div
                key={i}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={rule.sourcePath}
                      onChange={(e) => updateRule(i, 'sourcePath', e.target.value)}
                      placeholder="$.data.user.email"
                      disabled={disabled}
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
                    />
                    {sourceErr && (
                      <p className="mt-0.5 text-xs text-[var(--color-error)]">{sourceErr}</p>
                    )}
                  </div>
                  <span className="hidden text-xs text-[var(--color-text-muted)] sm:block sm:py-1.5">
                    →
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={rule.targetField}
                      onChange={(e) => updateRule(i, 'targetField', e.target.value)}
                      placeholder="customer_email"
                      disabled={disabled}
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
                    />
                    {targetErr && (
                      <p className="mt-0.5 text-xs text-[var(--color-error)]">{targetErr}</p>
                    )}
                    {isDuplicate && (
                      <p className="mt-0.5 text-xs text-[var(--color-error)]">
                        Duplicate target field
                      </p>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={rule.template ?? ''}
                      onChange={(e) => updateRule(i, 'template', e.target.value)}
                      placeholder="Template (optional)"
                      disabled={disabled}
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
                    />
                    {templateErr && (
                      <p className="mt-0.5 text-xs text-[var(--color-error)]">{templateErr}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    disabled={disabled}
                    className="shrink-0 rounded p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-50"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    title="Remove rule"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addRule}
        disabled={disabled || rules.length >= MAX_RULES}
        className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add Rule
      </button>
      {rules.length >= MAX_RULES && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Maximum of {MAX_RULES} transform rules per endpoint
        </p>
      )}
    </div>
  );
}

/** Check if any rule has validation errors */
export function hasTransformErrors(rules: TransformRule[]): boolean {
  const targetCounts = new Map<string, number>();
  for (const r of rules) {
    if (r.targetField) {
      targetCounts.set(r.targetField, (targetCounts.get(r.targetField) ?? 0) + 1);
    }
  }

  return rules.some((r) => {
    if (r.sourcePath && !r.sourcePath.startsWith('$')) return true;
    if (r.sourcePath && r.sourcePath.length > 256) return true;
    if (r.targetField && !TARGET_FIELD_RE.test(r.targetField)) return true;
    if (r.template && r.template.length > 512) return true;
    if (r.targetField && (targetCounts.get(r.targetField) ?? 0) > 1) return true;
    // Check for empty required fields in non-empty rules
    if ((r.sourcePath || r.targetField || r.template) && (!r.sourcePath || !r.targetField))
      return true;
    return false;
  });
}

/** Clean rules for API submission — remove empty rows, strip empty templates */
export function cleanRules(rules: TransformRule[]): TransformRule[] | null {
  const cleaned = rules
    .filter((r) => r.sourcePath && r.targetField)
    .map((r) => ({
      sourcePath: r.sourcePath,
      targetField: r.targetField,
      ...(r.template ? { template: r.template } : {}),
    }));
  return cleaned.length > 0 ? cleaned : null;
}

// ─── Live Preview ───────────────────────────────────────────────────────────

interface TransformPreviewProps {
  rules: TransformRule[];
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export function TransformPreview({ rules, apiFetch }: TransformPreviewProps) {
  const [samplePayload, setSamplePayload] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validRules = cleanRules(rules);

  const runPreview = useCallback(
    async (payload: string, currentRules: TransformRule[] | null) => {
      if (!payload.trim()) {
        setOutput(null);
        setPreviewError(null);
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch {
        setPreviewError('Invalid JSON — paste a valid JSON object');
        setOutput(null);
        return;
      }

      if (!currentRules || currentRules.length === 0) {
        setOutput(JSON.stringify(parsed, null, 2));
        setPreviewError(null);
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch('/api/v1/transform/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: parsed, rules: currentRules }),
        });
        const json = await res.json();
        if (!res.ok) {
          setPreviewError(json?.error?.message ?? `Error ${res.status}`);
          setOutput(null);
        } else {
          setOutput(JSON.stringify(json.data.transformed, null, 2));
          setPreviewError(null);
        }
      } catch {
        setPreviewError('Preview request failed');
        setOutput(null);
      } finally {
        setLoading(false);
      }
    },
    [apiFetch],
  );

  // Debounced preview on payload or rules change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runPreview(samplePayload, validRules);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samplePayload, JSON.stringify(validRules)]);

  return (
    <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">Live Preview</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
            Sample Payload
          </label>
          <textarea
            value={samplePayload}
            onChange={(e) => setSamplePayload(e.target.value)}
            placeholder='{"user": {"email": "jane@example.com"}}'
            rows={5}
            className="w-full resize-y rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
            Transformed Output {loading && <span className="text-[var(--color-accent)]">...</span>}
            {!validRules && samplePayload.trim() && !previewError && (
              <span className="text-[var(--color-text-muted)]">(passthrough)</span>
            )}
          </label>
          {previewError ? (
            <div className="rounded border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-2 py-1.5 text-xs text-[var(--color-error)]">
              {previewError}
            </div>
          ) : (
            <pre className="min-h-[7.5rem] overflow-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)]">
              {output ?? ''}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
