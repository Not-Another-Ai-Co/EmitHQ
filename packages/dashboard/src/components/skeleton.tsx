export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-4 w-16" />
      </div>
      <div className="mb-3 flex gap-4">
        <div>
          <div className="skeleton mb-1 h-3 w-16" />
          <div className="skeleton h-5 w-8" />
        </div>
        <div>
          <div className="skeleton mb-1 h-3 w-20" />
          <div className="skeleton h-5 w-8" />
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] pt-3">
        <div className="skeleton h-3 w-28" />
      </div>
    </div>
  );
}

export function SkeletonEndpointCard() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton mt-2 h-3 w-32" />
        </div>
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton mb-1 h-3 w-16" />
            <div className="skeleton h-5 w-10" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-[var(--color-border)] pt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-7 w-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
