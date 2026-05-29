'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Mark } from '@/components/logo/greencirlce-logo';

interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  currentPage?: string;
  navItems: NavItem[];
  authed: boolean;
  submitHref: string;
}

export function MobileNav({
  currentPage,
  navItems,
  authed,
  submitHref,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="p-2 -mr-2 text-ink hover:text-forest transition-colors"
      >
        <Menu className="h-6 w-6" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex animate-in fade-in flex-col bg-paper duration-200 dark:bg-paper-deep"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-16 items-center justify-between border-b border-rule px-6 dark:border-rule">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 text-ink"
              aria-label="Green Circle — home"
            >
              <Mark className="h-6 w-6 text-forest" />
              <span className="text-lg tracking-[-0.035em]">
                <span className="font-medium text-ink">Green</span>
                <span className="ml-[0.25em] font-semibold text-forest">Circle</span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="p-2 -mr-2 text-ink hover:text-forest transition-colors"
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-10 flex flex-col gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`font-sans text-2xl font-semibold tracking-tight transition-colors ${
                  currentPage && item.href.includes(currentPage)
                    ? 'text-forest'
                    : 'text-ink hover:text-forest'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-between border-t border-rule px-6 py-6 dark:border-rule">
            {authed ? (
              <Link
                href={submitHref}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink hover:text-forest underline underline-offset-4 decoration-rule hover:decoration-forest"
              >
                Submit your startup
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-ink hover:text-forest transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="h-10 px-5 inline-flex items-center rounded-md bg-forest hover:bg-forest-soft text-paper text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
