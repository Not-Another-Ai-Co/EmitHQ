'use client';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]"
    >
      {message}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-2 text-[var(--color-error)]/70 hover:text-[var(--color-error)]"
      >
        ×
      </button>
    </div>
  );
}
