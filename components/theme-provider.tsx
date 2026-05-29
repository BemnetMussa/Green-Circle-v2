'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'gc-theme';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDomClass(next: Theme) {
  document.documentElement.classList.toggle('dark', next === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setThemeState(isDark ? 'dark' : 'light');
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    const run = () => {
      applyDomClass(next);
      setThemeState(next);
    };

    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as Document & { startViewTransition?: (cb: () => void) => unknown })
        .startViewTransition === 'function'
    ) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
        run
      );
      return;
    }

    const root = document.documentElement;
    root.classList.add('theme-transition');
    run();
    window.setTimeout(() => root.classList.remove('theme-transition'), 480);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark')
      ? 'light'
      : 'dark';
    setTheme(next);
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle, mounted }),
    [theme, setTheme, toggle, mounted]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
