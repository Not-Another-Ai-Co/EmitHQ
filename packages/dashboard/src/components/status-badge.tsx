const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  active: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  pending: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  failed: 'bg-[var(--color-error)]/15 text-[var(--color-error)]',
  exhausted: 'bg-[var(--color-error)]/15 text-[var(--color-error)]',
  disabled: 'bg-[var(--color-error)]/15 text-[var(--color-error)]/70',
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-500/15 text-gray-400';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}
