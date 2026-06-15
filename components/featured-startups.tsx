import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Startup } from '@/types';
import { HomeDirectoryPreviewCard } from '@/components/home-directory-preview-card';

interface FeaturedStartupsProps {
  startups: Startup[];
  /** Show placeholder grid while the directory request is in flight */
  loading?: boolean;
}

/**
 * Homepage directory preview — showcase card grid so each startup earns the
 * space. Sans-first; no HandpickedMark on cards (detail pages stay truthful).
 */
export function FeaturedStartups({
  startups,
  loading,
}: FeaturedStartupsProps) {
  if (!loading && (!startups || startups.length === 0)) return null;

  const preview = loading ? [] : startups.slice(0, 9);
  const total = startups?.length ?? 0;

  return (
    <section className="gc-section-directory relative border-t border-rule-soft dark:border-rule">
      <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-32 lg:px-12 lg:py-36 xl:px-16">
        <header className="mb-12 flex flex-col gap-8 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="gc-kicker">Directory preview</span>
            <div
              className="mt-3.5 h-1 w-14 rounded-full bg-gold shadow-sm shadow-gold/25"
              aria-hidden
            />
            <h2 className="mt-5 text-2xl font-semibold leading-snug tracking-tight text-ink text-balance md:text-3xl lg:text-[2rem]">
              Companies on Green Circle today
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-sm font-normal leading-relaxed text-ink-muted text-pretty md:text-base">
              {loading
                ? 'Pulling the latest listings…'
                : `${total} public listing${total === 1 ? '' : 's'} — each card opens the full profile. Same data as the directory, built to scan fast then dig in.`}
            </p>
          </div>

          <Link
            href="/startups"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-forest px-6 font-sans text-sm font-medium text-paper shadow-sm transition-colors hover:bg-forest-soft lg:self-auto"
          >
            Browse directory
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3 xl:gap-8">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="flex min-h-[260px] animate-pulse flex-col rounded-2xl border border-rule/60 bg-paper p-6 dark:border-rule dark:bg-paper-deep"
                >
                  <div className="h-5 w-24 rounded-full bg-rule/45 dark:bg-rule/30" />
                  <div className="mt-5 h-16 w-16 rounded-xl bg-rule/40 dark:bg-rule/25" />
                  <div className="mt-5 h-6 max-w-[85%] rounded-md bg-rule/40 dark:bg-rule/25" />
                  <div className="mt-3 flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-3 w-full rounded bg-rule/35 dark:bg-rule/20" />
                    <div className="h-3 w-full rounded bg-rule/35 dark:bg-rule/20" />
                    <div className="h-3 w-[80%] rounded bg-rule/35 dark:bg-rule/20" />
                  </div>
                  <div className="mt-6 h-3 w-32 rounded bg-rule/30 dark:bg-rule/20" />
                </div>
              ))
            : preview.map((startup, idx) => (
                <HomeDirectoryPreviewCard key={`${startup._id}-${idx}`} startup={startup} />
              ))}
        </div>

        {!loading && total > preview.length && (
          <div className="mt-12 flex justify-center">
            <Link
              href="/startups"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-rule bg-paper px-6 font-sans text-sm font-medium text-ink transition-colors hover:border-forest/40 hover:bg-paper-tint dark:border-rule dark:bg-paper-deep dark:hover:bg-paper"
            >
              View all {total} startups
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
