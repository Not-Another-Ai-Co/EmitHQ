export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {detail && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{detail}</p>}
    </div>
  );
}
