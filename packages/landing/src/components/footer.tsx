import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>
                <Link href="/pricing" className="hover:text-[var(--color-text)]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-[var(--color-text)]">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-[var(--color-text)]">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Developers</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>
                <Link href="/docs/api" className="hover:text-[var(--color-text)]">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs/sdk" className="hover:text-[var(--color-text)]">
                  SDK Guide
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Not-Another-Ai-Co/EmitHQ"
                  className="hover:text-[var(--color-text)]"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>
                <Link href="/terms" className="hover:text-[var(--color-text)]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--color-text)]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/dpa" className="hover:text-[var(--color-text)]">
                  DPA
                </Link>
              </li>
              <li>
                <Link href="/sla" className="hover:text-[var(--color-text)]">
                  SLA
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Connect</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>
                <a href="https://twitter.com/emithq" className="hover:text-[var(--color-text)]">
                  Twitter/X
                </a>
              </li>
              <li>
                <a href="https://discord.gg/emithq" className="hover:text-[var(--color-text)]">
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--color-border)] pt-8 text-center text-sm text-[var(--color-text-muted)]">
          &copy; {new Date().getFullYear()} EmitHQ. Open-source under AGPL-3.0 (server) and MIT
          (SDKs).
        </div>
      </div>
    </footer>
  );
}
