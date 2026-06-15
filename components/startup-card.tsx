'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Startup } from '@/types';
import { ImageWithFallback } from '@/components/image-withfallback';
import { displayStartupStage } from '@/lib/startup-stage';
import { startupDetailHref } from '@/lib/startup-detail-href';
import { computeSignalScore, type SignalScoreInput } from '@/lib/signal-score';
import { bandColor } from '@/components/investor/signal-score-ring';

interface StartupCardProps {
  startup: Startup;
  variant?: 'grid' | 'row';
}

/**
 * Startup card — polished, data-rich, and it surfaces the Green Circle Signal
 * Score (readiness portion, computed from the profile). The whole card is the
 * link. Two layouts: `grid` (vertical) and `row` (horizontal list).
 */
export function StartupCard({ startup, variant = 'grid' }: StartupCardProps) {
  if (variant === 'row') return <RowCard startup={startup} />;
  return <GridCard startup={startup} />;
}

/* -------------------------------------------------------------------------- */

function GridCard({ startup }: { startup: Startup }) {
  const stageLabel = displayStartupStage(startup.stage);
  const href = startupDetailHref(startup);
  const seeking = ['idea', 'pre-seed', 'seed'].includes(startup.stage || '');
  const signal = computeSignalScore(toSignalInput(startup));
  const color = sectorColor(startup.sector);

  return (
    <StartupCardShell
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-paper p-5 pt-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />

      <div className="flex items-start justify-between gap-3">
        <Logo logo={startup.logo} name={startup.name} size={52} />
        <SignalChip score={signal.overall} label={signal.label} />
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-forest text-balance">
        {startup.name}
      </h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {startup.sector && <Tag color={color}>{startup.sector}</Tag>}
        {stageLabel && <Tag>{stageLabel}</Tag>}
        {seeking && <Tag tone="forest">Seeking investment</Tag>}
      </div>

      <p className="mt-3 text-sm leading-[1.55] text-ink-muted line-clamp-3 text-pretty">
        {startup.description || 'Profile in progress.'}
      </p>

      <div className="flex-1" />

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule-soft pt-4 text-xs text-ink-muted">
        <Meta startup={startup} />
      </div>
    </StartupCardShell>
  );
}

/* -------------------------------------------------------------------------- */

function RowCard({ startup }: { startup: Startup }) {
  const stageLabel = displayStartupStage(startup.stage);
  const href = startupDetailHref(startup);
  const seeking = ['idea', 'pre-seed', 'seed'].includes(startup.stage || '');
  const signal = computeSignalScore(toSignalInput(startup));
  const color = sectorColor(startup.sector);

  return (
    <StartupCardShell
      href={href}
      className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-5 px-5 py-5 transition-colors hover:bg-paper-deep/40 sm:gap-7"
    >
      <span aria-hidden className="absolute bottom-3 left-0 top-3 w-1 rounded-full" style={{ backgroundColor: color }} />

      <Logo logo={startup.logo} name={startup.name} size={64} />

      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h3 className="truncate text-lg font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-forest sm:text-xl">
            {startup.name}
          </h3>
          {seeking && <Tag tone="forest">Seeking</Tag>}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {startup.sector && <Tag color={color}>{startup.sector}</Tag>}
          {stageLabel && <Tag>{stageLabel}</Tag>}
        </div>

        <p className="mt-2 max-w-2xl text-sm leading-[1.6] text-ink-muted line-clamp-2 text-pretty">
          {startup.description || 'Profile in progress.'}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <Meta startup={startup} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 self-stretch">
        <SignalChip score={signal.overall} label={signal.label} />
        <div className="flex-1" />
        <ArrowUpRight className="h-5 w-5 text-ink-faint transition-colors group-hover:text-forest" />
      </div>
    </StartupCardShell>
  );
}

/* -------------------------------------------------------------------------- */

function SignalChip({ score, label }: { score: number; label: string }) {
  const color = bandColor(score);
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-rule bg-paper-tint px-2 py-1"
      title={`Signal Score ${score} · ${label}`}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm font-bold leading-none tabular-nums" style={{ color }}>
        {score}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Signal</span>
    </div>
  );
}

function Tag({
  children,
  tone = 'neutral',
  color,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'forest';
  color?: string;
}) {
  if (color) {
    return (
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize"
        style={{ color, backgroundColor: `${color}18`, borderColor: `${color}40` }}
      >
        {children}
      </span>
    );
  }
  const cls =
    tone === 'forest'
      ? 'border-forest/30 bg-forest/10 text-forest'
      : 'border-rule bg-paper-tint text-ink-muted';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}>
      {children}
    </span>
  );
}

function Meta({ startup }: { startup: Startup }) {
  const items = [
    startup.location && firstToken(startup.location),
    startup.foundedYear && `Founded ${startup.foundedYear}`,
    startup.employees && `${startup.employees} people`,
  ].filter(Boolean) as string[];

  return (
    <>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-3">
          {i > 0 && <Dot />}
          <span className="truncate">{item}</span>
        </span>
      ))}
    </>
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

function Logo({ logo, name, size }: { logo?: string; name: string; size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-rule bg-paper"
      style={{ height: size, width: size }}
    >
      {logo && !logo.includes('placeholder') ? (
        <ImageWithFallback
          src={logo}
          alt={`${name} logo`}
          width={size}
          height={size}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="text-sm font-bold text-ink-muted">{getInitials(name)}</span>
      )}
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="h-1 w-1 rounded-full bg-ink-faint/60" />;
}

function firstToken(location: string): string {
  return location?.split(',')[0]?.trim() || location;
}

// Single cohesive brand accent (forest) — one calm colour, not a rainbow.
const SECTOR_PALETTE = ['#3a7d55'];

export function sectorColor(sector?: string): string {
  if (!sector) return SECTOR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < sector.length; i++) h = (h * 31 + sector.charCodeAt(i)) >>> 0;
  return SECTOR_PALETTE[h % SECTOR_PALETTE.length];
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

/** Adapt a directory Startup into the Signal Score input (readiness only). */
function toSignalInput(s: Startup): SignalScoreInput {
  return {
    logo: s.logo,
    description: s.description,
    founders: s.founders,
    website: s.website,
    pitch: s.pitch,
    achievements: Array.isArray(s.achievements) ? s.achievements : s.achievements ? [s.achievements] : [],
    images: s.images,
    video: null,
    revenue: s.revenue,
    employees: s.employees,
    foundedYear: typeof s.foundedYear === 'number' ? String(s.foundedYear) : s.foundedYear,
    stage: s.stage,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
