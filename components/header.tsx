'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserProfileDropdown } from './user-profile-dropdown';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Logo } from './logo/greencirlce-logo';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  currentPage?: string;
}

const NAV_ITEMS: { href: string; label: string; key: string }[] = [
  { href: '/startups', label: 'Directory', key: 'startups' },
  { href: '/analytics', label: 'Analytics', key: 'analytics' },
  // Pulse moved to footer band only — system spine over publication spine.
  // { href: '/pulse', label: 'Updates', key: 'pulse' },
  // Commented out until Round 2 — routes don't exist yet:
  // { href: '/stories', label: 'Stories', key: 'stories' },
  // { href: '/about', label: 'About', key: 'about' },
];

export function Header({ currentPage }: HeaderProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (!cancelled) setSession(data?.user || null);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitHref = session
    ? session.role === 'startup'
      ? '/submit/startup-info'
      : '/submit/verify'
    : '/login?callbackUrl=/submit/verify';

  return (
    <header className="sticky top-0 z-40 border-b border-rule gc-glass-tint dark:border-rule">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          <Logo />

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm transition-colors ${
                  currentPage === item.key
                    ? 'text-forest font-semibold'
                    : 'text-ink-muted hover:text-ink font-medium'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={submitHref}
              className={`text-sm transition-colors ${
                currentPage === 'submit'
                  ? 'text-forest font-semibold'
                  : 'text-ink-muted hover:text-ink font-medium'
              }`}
            >
              Submit
            </Link>
          </nav>

          <div className="hidden min-w-0 shrink-0 items-center justify-end gap-3 md:flex">
            <ThemeToggle />
            {loading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-12 rounded bg-rule-soft dark:bg-rule/40" />
                <div className="h-9 w-20 rounded-md bg-rule-soft dark:bg-rule/40" />
              </div>
            ) : session ? (
              <UserProfileDropdown session={session} />
            ) : (
              <div className="flex items-center gap-5">
                <Link
                  href="/login"
                  className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  Log in
                </Link>
                <Button
                  asChild
                  className="h-9 px-4 rounded-md bg-forest hover:bg-forest-soft text-paper text-sm font-medium shadow-sm transition-colors"
                >
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileNav
              currentPage={currentPage}
              navItems={[
                ...NAV_ITEMS,
                { href: '/analytics', label: 'Analytics', key: 'analytics' },
                { href: submitHref, label: 'Submit', key: 'submit' } as any,
              ]}
              authed={!!session}
              submitHref={submitHref}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
