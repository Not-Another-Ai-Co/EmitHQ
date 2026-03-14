import Link from 'next/link';

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/compare', label: 'Compare' },
  { href: '/docs', label: 'Docs' },
];

export function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-[var(--color-accent)]">
          EmitHQ
        </Link>
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/Not-Another-Ai-Co/EmitHQ"
            className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] max-sm:hidden"
          >
            GitHub
          </a>
          <a
            href="https://app.emithq.com"
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}
