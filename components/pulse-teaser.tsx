'use client';

import { useState } from 'react';

/**
 * Update band above the footer — glass panel, linear sans type.
 */
export function PulseTeaser() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section className="gc-section-pulse border-t border-rule-soft dark:border-rule">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="max-w-xl shrink-0">
            <span className="gc-kicker">Updates</span>
            <p className="mt-3 font-sans text-sm font-normal leading-relaxed text-ink-muted md:text-base">
              <span className="font-semibold text-ink">Track the ecosystem.</span>{' '}
              Once a month — what&rsquo;s new on Green Circle, who shipped, and
              what&rsquo;s moving.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setDone(true);
            }}
            className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center md:max-w-md"
            aria-label="Subscribe to Green Circle updates"
          >
            <label htmlFor="gc-updates-email" className="sr-only">
              Email address
            </label>
            <input
              id="gc-updates-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-md border border-rule/50 bg-paper/60 px-4 font-sans text-sm text-ink backdrop-blur-sm placeholder:text-ink-faint/80 transition-all focus:border-forest/40 focus:bg-paper/80 focus:outline-none focus:ring-1 focus:ring-forest/25 sm:w-72 dark:border-rule dark:bg-paper-deep/60"
            />
            <button
              type="submit"
              disabled={done}
              className="h-11 shrink-0 rounded-md bg-forest px-5 font-sans text-sm font-medium text-paper shadow-sm transition-colors hover:bg-forest-soft disabled:opacity-70"
            >
              {done ? 'Subscribed' : 'Get updates'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
