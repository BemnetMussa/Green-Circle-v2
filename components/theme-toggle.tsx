'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rule bg-paper text-ink-muted transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-40 dark:border-rule dark:bg-paper-tint dark:text-ink-muted dark:hover:text-forest"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}
