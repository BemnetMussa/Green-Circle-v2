'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Startup } from '@/types';
import { ImageWithFallback } from '@/components/image-withfallback';
import { HandpickedMark } from '@/components/editorial/handpicked-mark';
import { SectionKicker } from '@/components/editorial/section-kicker';
import { displayStartupStage } from '@/lib/startup-stage';
import { startupDetailHref } from '@/lib/startup-detail-href';

interface StartupCardProps {
  startup: Startup;
  variant?: 'grid' | 'row';
}

/**
 * Editorial startup card. Reads as a magazine-archive item, not a database
 * row. No shields, no dark navy header, no "View Details" CTA — the whole
 * card is the link.
 *
 * Two layouts:
 *   - `grid`  (default) — vertical card for the featured homepage grid and
 *                         the directory grid view.
 *   - `row`               — horizontal editorial row for the directory's
 *                         default list view.
 */
export function StartupCard({ startup, variant = 'grid' }: StartupCardProps) {
  if (variant === 'row') return <RowCard startup={startup} />;
  return <GridCard startup={startup} />;
}

/* -------------------------------------------------------------------------- */

function GridCard({ startup }: { startup: Startup }) {
  const initials = getInitials(startup.name);
  const stageLabel = displayStartupStage(startup.stage);
  const href = startupDetailHref(startup);
  const isSeekingInvestment = ['idea', 'pre-seed', 'seed'].includes(startup.stage || '');

  return (
    <StartupCardShell
      href={href}
      className="group flex flex-col h-full bg-paper-tint rounded-lg border border-rule p-6 transition-all duration-300 hover:border-ink hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <SectionKicker>{startup.sector || 'Startup'}</SectionKicker>
        {isSeekingInvestment && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-forest/10 text-forest text-[10px] font-semibold uppercase tracking-wider">
            Seeking Investment
          </span>
        )}
      </div>

      <LogoBlock
        logo={startup.logo}
        initials={initials}
        name={startup.name}
      />

      <h3 className="mt-5 font-sans text-[1.35rem] font-semibold leading-snug text-ink tracking-tight group-hover:text-forest transition-colors text-balance">
        {startup.name}
      </h3>

      <p className="mt-3 text-[0.975rem] text-ink-muted leading-[1.55] line-clamp-3 text-pretty">
        {startup.description || 'Profile in progress.'}
      </p>

      <div className="flex-1" />

      <div className="mt-8 pt-5 border-t border-rule-soft flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-ink-faint">
        {startup.location && (
          <span className="truncate">{startup.location}</span>
        )}
        {startup.foundedYear && (
          <>
            <Dot />
            <span>Founded {startup.foundedYear}</span>
          </>
        )}
        {stageLabel && (
          <>
            <Dot />
            <span>{stageLabel}</span>
          </>
        )}
        {startup.employees && (
          <>
            <Dot />
            <span>{startup.employees} people</span>
          </>
        )}
      </div>
    </StartupCardShell>
  );
}

/* -------------------------------------------------------------------------- */

function RowCard({ startup }: { startup: Startup }) {
  const initials = getInitials(startup.name);
  const stageLabel = displayStartupStage(startup.stage);
  const href = startupDetailHref(startup);
  const isSeekingInvestment = ['idea', 'pre-seed', 'seed'].includes(startup.stage || '');

  return (
    <StartupCardShell
      href={href}
      className="group grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-5 sm:gap-8 items-start py-8 border-b border-rule-soft transition-colors hover:bg-paper-tint/60 -mx-4 px-4 rounded-md"
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-md bg-paper-deep border border-rule flex items-center justify-center overflow-hidden shrink-0">
        {startup.logo ? (
          <ImageWithFallback
            src={startup.logo}
            alt={`${startup.name} logo`}
            width={80}
            height={80}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span
            className="font-display text-2xl text-ink-faint font-medium"
            style={{ fontVariationSettings: '"opsz" 48, "SOFT" 50' }}
          >
            {initials}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
          <SectionKicker>{startup.sector || 'Startup'}</SectionKicker>
          {isSeekingInvestment && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-semibold uppercase tracking-wider">
              Seeking Investment
            </span>
          )}
        </div>

        <h3 className="font-sans text-xl sm:text-[1.4rem] font-semibold leading-snug text-ink tracking-tight group-hover:text-forest transition-colors text-balance">
          {startup.name}
        </h3>

        <p className="mt-1.5 text-[0.975rem] text-ink-muted leading-[1.6] line-clamp-2 text-pretty max-w-none pr-4 sm:pr-8">
          {startup.description || 'Profile in progress.'}
        </p>

        <div className="mt-4 flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-ink-faint">
          {startup.location && <span>{startup.location}</span>}
          {startup.foundedYear && (
            <>
              <Dot />
              <span>Founded {startup.foundedYear}</span>
            </>
          )}
          {stageLabel && (
            <>
              <Dot />
              <span>{stageLabel}</span>
            </>
          )}
          {startup.employees && (
            <>
              <Dot />
              <span>{startup.employees} people</span>
            </>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center text-ink-faint group-hover:text-forest transition-colors pt-1">
        <span className="font-display text-xl">&rarr;</span>
      </div>
    </StartupCardShell>
  );
}

function StartupCardShell({
  href,
  className,
  children,
}: {
  href: string | null;
  className: string;
  children: ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <div
      className={`${className} cursor-default opacity-90`}
      role="group"
      title="This listing has no profile link id. Re-save the startup in MongoDB with a proper _id, or fix the API response."
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LogoBlock({
  logo,
  initials,
  name,
}: {
  logo?: string;
  initials: string;
  name: string;
}) {
  return (
    <div className="mt-6 h-14 w-14 rounded-md bg-paper border border-rule flex items-center justify-center overflow-hidden">
      {logo ? (
        <ImageWithFallback
          src={logo}
          alt={`${name} logo`}
          width={56}
          height={56}
          className="w-full h-full object-contain p-1.5"
        />
      ) : (
        <span
          className="font-display text-xl text-ink-faint font-medium"
          style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="h-1 w-1 rounded-full bg-ink-faint/60" />;
}

function getInitials(name: string): string {
  if (!name) return 'GC';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}
