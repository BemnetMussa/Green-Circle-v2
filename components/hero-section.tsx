'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search } from 'lucide-react';
import { Mark } from '@/components/logo/greencirlce-logo';
import { ImageWithFallback } from '@/components/image-withfallback';
import { HeroFounderCarousel } from '@/components/hero-founder-carousel';
import type { HeroFounderSlide } from '@/lib/hero-founders';

export type HeroFeaturedPhoto = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
};

interface HeroStats {
  startups?: number;
  sectors?: number;
  addedThisMonth?: number;
}

interface HeroSectionProps {
  stats?: HeroStats;
  /** Show metric placeholders while directory data is still loading */
  statsPending?: boolean;
  /** Single image — used when `featuredSlides` is omitted or empty */
  featuredPhoto?: HeroFeaturedPhoto;
  /** Founder + product carousel; overrides single `featuredPhoto` when non-empty */
  featuredSlides?: HeroFounderSlide[];
}

export function HeroSection({
  stats,
  statsPending,
  featuredPhoto,
  featuredSlides,
}: HeroSectionProps = {}) {
  const [session, setSession] = useState<any>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (!cancelled) setSession(data?.user || null);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitLink =
    session?.role === 'startup' ? '/submit/startup-info' : '/submit/verify';

  const showHeroMedia =
    (featuredSlides?.length ?? 0) > 0 || Boolean(featuredPhoto);

  const markOpacity = showHeroMedia
    ? 'opacity-[0.03] md:opacity-[0.04]'
    : 'opacity-[0.06] md:opacity-[0.08]';

  return (
    <section className="gc-section-hero relative overflow-hidden border-b border-rule dark:border-rule">
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-32 -top-40 w-[720px] ${markOpacity}`}
      >
        <Mark className="w-full h-full text-forest" />
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 md:pb-28 md:pt-32 lg:px-12 lg:pb-32 lg:pt-36 xl:px-16">
        <div
          className={
            showHeroMedia
              ? 'grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-24 lg:gap-y-12 xl:gap-x-32 xl:gap-y-12'
              : ''
          }
        >
          <div
            className={
              showHeroMedia ? 'lg:col-span-6 xl:col-span-7' : ''
            }
          >
            <HeroCopyBlock
              submitLink={submitLink}
              sessionReady={sessionReady}
              stats={stats}
              statsPending={statsPending}
            />
          </div>

          {showHeroMedia && (
            <div className="lg:col-span-6 xl:col-span-5">
              {featuredSlides && featuredSlides.length > 0 ? (
                <HeroFounderCarousel slides={featuredSlides} />
              ) : featuredPhoto ? (
                <HeroFeaturedFigure photo={featuredPhoto} />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroCopyBlock({
  submitLink,
  sessionReady,
  stats,
  statsPending,
}: {
  submitLink: string;
  sessionReady: boolean;
  stats?: HeroStats;
  statsPending?: boolean;
}) {
  return (
    <div className="hero-copy-stack">
      <div className="hero-copy-stagger-item inline-block max-w-full">
        <span className="gc-kicker">Ethiopian startup directory</span>
        <div
          className="mt-3.5 h-1 w-16 max-w-full rounded-full bg-gold shadow-sm shadow-gold/25"
          aria-hidden
        />
      </div>

      <h1 className="hero-copy-stagger-item mt-6 max-w-[44ch] text-3xl font-semibold leading-[1.18] tracking-[-0.02em] text-ink sm:text-4xl md:mt-7 md:text-[2.375rem] lg:text-[2.75rem] text-balance">
        The central directory for{' '}
        <span className="text-forest">Ethiopian innovation.</span>
      </h1>

      <p className="hero-copy-stagger-item mt-7 max-w-[62ch] font-sans text-lg font-normal leading-[1.6] text-ink-muted text-pretty md:mt-8 md:text-xl">
        The Ethiopian startups shaping the future of innovation — connected to
        the{' '}
        <strong className="text-ink font-semibold">
          capital, credit, and global partners
        </strong>{' '}
        they need to grow.
      </p>

      <div className="hero-copy-stagger-item mt-10 sm:mt-11">
        <HeroDirectorySearch />
      </div>

      <div className="hero-copy-stagger-item mt-10 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:items-center">
        <Button
          asChild
          size="lg"
          className="h-12 rounded-xl bg-forest px-6 font-sans font-medium text-paper shadow-sm transition-colors hover:bg-forest-soft"
        >
          <Link href="/startups" className="inline-flex items-center gap-2">
            Browse the directory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Link
          href={submitLink}
          aria-disabled={!sessionReady}
          className="text-sm font-medium text-ink underline decoration-rule underline-offset-4 transition-colors hover:text-forest hover:decoration-forest"
        >
          Submit your startup
        </Link>
      </div>

      <div className="hero-copy-stagger-item">
        <SystemStats stats={stats} pending={statsPending} />
      </div>
    </div>
  );
}

function HeroDirectorySearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push('/startups');
      return;
    }
    router.push(`/startups?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
      role="search"
      aria-label="Search startups in the directory"
    >
      <label htmlFor="hero-directory-search" className="sr-only">
        Search startups by name or description
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint/70"
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          id="hero-directory-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by startup name…"
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-rule/45 bg-paper/50 py-2.5 pl-11 pr-4 font-sans text-base font-normal text-ink shadow-none backdrop-blur-md placeholder:text-ink-faint/75 transition-colors focus:border-forest/40 focus:bg-paper/70 focus:outline-none focus:ring-1 focus:ring-forest/20"
        />
      </div>
      <button
        type="submit"
        className="h-12 shrink-0 rounded-xl border border-rule/45 bg-paper/35 px-6 font-sans text-sm font-medium text-ink-muted backdrop-blur-md transition-colors hover:border-forest/35 hover:bg-forest/[0.07] hover:text-forest"
      >
        Search
      </button>
    </form>
  );
}

function HeroFeaturedFigure({ photo }: { photo: HeroFeaturedPhoto }) {
  const isSvg = photo.src.toLowerCase().endsWith('.svg');

  return (
    <figure className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-rule/50 bg-paper-deep/90 shadow-md ring-1 ring-white/25 ring-inset backdrop-blur-[2px]"
      >
        <ImageWithFallback
          src={photo.src}
          alt={photo.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 480px, (min-width: 1024px) 40vw, 90vw"
          priority
          unoptimized={isSvg}
        />
      </div>
      <figcaption className="mt-4 space-y-1">
        <p className="font-sans text-sm leading-snug text-ink text-pretty">
          {photo.caption}
        </p>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {photo.credit}
        </p>
      </figcaption>
    </figure>
  );
}

function SystemStats({
  stats,
  pending,
}: {
  stats?: HeroStats;
  pending?: boolean;
}) {
  if (pending) {
    return (
      <dl className="mt-20 grid max-w-2xl grid-cols-2 gap-x-10 gap-y-8 border-t border-rule pt-10 sm:grid-cols-3 sm:gap-x-12 dark:border-rule">
        {['Listed startups', 'Industry sectors', 'Added this month'].map(
          (label) => (
            <div key={label} className="animate-pulse">
              <dt className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint/80">
                {label}
              </dt>
              <dd className="mt-2 h-9 w-16 max-w-full rounded-md bg-rule/50 dark:bg-rule/35" />
            </div>
          )
        )}
      </dl>
    );
  }

  if (!stats) return null;

  const items: { label: string; value: string }[] = [];

  if (typeof stats.startups === 'number' && stats.startups > 0) {
    items.push({
      label: 'Listed startups',
      value: stats.startups.toLocaleString(),
    });
  }
  if (typeof stats.sectors === 'number' && stats.sectors > 0) {
    items.push({
      label: 'Industry sectors',
      value: stats.sectors.toString(),
    });
  }
  if (typeof stats.addedThisMonth === 'number' && stats.addedThisMonth > 0) {
    items.push({
      label: 'Added this month',
      value: `+${stats.addedThisMonth}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <dl className="mt-20 grid max-w-2xl grid-cols-2 gap-x-10 gap-y-8 border-t border-rule pt-10 sm:grid-cols-3 sm:gap-x-12 dark:border-rule">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {item.label}
          </dt>
          <dd className="mt-2 font-sans text-2xl font-semibold tracking-tight text-ink tabular-nums md:text-3xl">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
