'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '◉' },
  { href: '/dashboard/events', label: 'Events', icon: '⚡' },
  { href: '/dashboard/endpoints', label: 'Endpoints', icon: '🔗' },
  { href: '/dashboard/dlq', label: 'Dead Letter Queue', icon: '⚠' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full w-56 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 max-md:hidden">
      <div className="mb-8">
        <Link href="/dashboard" className="text-xl font-bold text-[var(--color-accent)]">
          EmitHQ
        </Link>
      </div>
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden">
      <ul className="flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                  active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
