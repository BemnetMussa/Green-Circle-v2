'use client';

import Link from 'next/link';
import type { Startup } from '@/types';
import { startupDetailHref } from '@/lib/startup-detail-href';
import { ImageWithFallback } from '@/components/image-withfallback';
import { displayStartupStage } from '@/lib/startup-stage';

/**
 * Homepage directory preview — one card per startup. Built to feel like a
 * premium product surface (clear hierarchy, breathing room), not a magazine
 * tile: sans titles, quiet sector pill, no HandpickedMark here.
 */
export function HomeDirectoryPreviewCard({ startup }: { startup: Startup }) {
  const initials = getInitials(startup.name);
  const sector = startup.sector?.trim() || null;
  const stageLabel = displayStartupStage(startup.stage);
  const href = startupDetailHref(startup);

  const shellClass =
    'group flex min-h-[280px] flex-col rounded-2xl border border-rule bg-paper p-6 shadow-sm transition-all duration-200 hover:border-forest/35 hover:shadow-md dark:border-rule dark:bg-paper-deep';

  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {sector ? (
          <span className="inline-block max-w-full truncate rounded-full bg-forest/8 px-2.5 py-1 font-sans text-[11px] font-medium leading-none text-forest">
            {sector}
          </span>
        ) : (
          <span className="font-sans text-[11px] font-medium text-ink-faint">
            Startup
          </span>
        )}
        {stageLabel && (
          <span
            className="inline-block max-w-full truncate rounded-full border border-rule/90 bg-paper-deep px-2.5 py-1 font-sans text-[11px] font-medium leading-none text-ink-muted"
            title="Company stage"
          >
            {stageLabel}
          </span>
        )}
      </div>

      <div className="mt-5 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-rule/45 bg-paper/40 backdrop-blur-sm">
        {startup.logo ? (
          <ImageWithFallback
            src={startup.logo}
            alt={`${startup.name} logo`}
            width={64}
            height={64}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <span className="font-sans text-lg font-semibold tracking-tight text-ink-faint">
            {initials}
          </span>
        )}
      </div>

      <h3 className="mt-5 font-sans text-xl font-semibold leading-snug tracking-[-0.02em] text-ink group-hover:text-forest">
        {startup.name}
      </h3>

      <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-ink-muted line-clamp-3 text-pretty">
        {startup.description || 'Profile in progress.'}
      </p>

      {(startup.location || startup.foundedYear) && (
        <div className="mt-6 border-t border-rule/40 pt-4 font-sans text-[11px] font-medium uppercase tracking-[0.08em] leading-relaxed text-ink-faint">
          {[startup.location, startup.foundedYear ? `Est. ${startup.foundedYear}` : null]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={shellClass}>
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={`${shellClass} cursor-default opacity-90`}
      role="group"
      title="This listing has no profile link id."
    >
      {inner}
    </div>
  );
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
