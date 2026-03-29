'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-error)]">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
