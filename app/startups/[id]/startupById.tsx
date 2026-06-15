'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Mail,
  Linkedin,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Layers,
  Clock,
  Banknote,
  Award,
  Sparkles,
} from 'lucide-react';
import type { Startup as StartupType } from '@/types';
import { getStartupById } from '@/lib/call-api/call-api';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ImageWithFallback } from '@/components/image-withfallback';
import { displayStartupStage } from '@/lib/startup-stage';
import { computeSignalScore, type SignalScoreInput } from '@/lib/signal-score';
import { SignalScoreRing, bandColor } from '@/components/investor/signal-score-ring';
import { SignalBreakdownBars } from '@/components/investor/signal-breakdown';
import Loading from '@/app/loading';

export default function StartupDetailPage({ id }: { id: string }) {
  const [startup, setStartup] = useState<StartupType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFetchError(null);
    setNotFoundFlag(false);
    setStartup(null);
    setLoading(true);

    (async () => {
      const result = await getStartupById(id);
      if (cancelled) return;
      if (result.ok) {
        setStartup(result.startup);
      } else if (result.reason === 'not_found') {
        setNotFoundFlag(true);
      } else {
        setFetchError(result.message);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, retryToken]);

  if (loading) return <Loading />;
  if (notFoundFlag) return notFound();
  if (fetchError) {
    return (
      <StartupFetchErrorView
        message={fetchError}
        onRetry={() => {
          setFetchError(null);
          setLoading(true);
          setRetryToken((t) => t + 1);
        }}
      />
    );
  }
  if (!startup) return notFound();

  const achievements = normalizeAchievements(startup.achievements);
  const initials = getInitials(startup.name);
  const stageLabel = displayStartupStage(startup.stage);
  const signal = computeSignalScore(toSignalInput(startup));
  const scoreColor = bandColor(signal.overall);

  const yearNum = parseInt(String(startup.foundedYear ?? ''), 10);
  const yearsOperating =
    Number.isFinite(yearNum) && yearNum > 1990 ? new Date().getFullYear() - yearNum : null;
  const hasRevenue = Boolean(startup.revenue && String(startup.revenue).trim());

  return (
    <div className="min-h-screen bg-paper-deep flex flex-col">
      <Header currentPage="startups" />

      <main className="flex-1 pb-24">
        <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
          <Link
            href="/startups"
            className="group inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to directory
          </Link>
        </div>

        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* Hero */}
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-rule bg-paper shadow-sm sm:h-28 sm:w-28">
              {startup.logo && !startup.logo.includes('placeholder') ? (
                <ImageWithFallback
                  src={startup.logo}
                  alt={`${startup.name} logo`}
                  width={112}
                  height={112}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <span className="text-3xl font-bold text-ink-muted">{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-forest-soft">
                {startup.sector || 'Technology startup'}
              </span>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink text-balance sm:text-4xl">
                {startup.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted text-pretty">
                {startup.pitch || startup.description || 'Startup pitch and core mission currently being compiled.'}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-forest px-6 text-sm font-medium text-paper shadow-sm transition-all hover:bg-forest-soft active:scale-[0.98]"
                  onClick={() =>
                    alert('Connect feature coming soon. Express interest in this startup to unlock full founder contact details.')
                  }
                >
                  <TrendingUp className="h-4 w-4" />
                  Apply to Connect
                </button>
                {startup.website && (
                  <Link
                    href={startup.website}
                    target="_blank"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rule bg-paper-tint px-6 text-sm font-medium text-ink shadow-sm transition-all hover:border-ink/30 active:scale-[0.98]"
                  >
                    <Globe className="h-4 w-4" />
                    Visit website
                  </Link>
                )}
              </div>
            </div>

            {/* Signal Score badge */}
            <div className="flex shrink-0 flex-col items-center gap-2 self-start rounded-xl border border-rule bg-paper p-5 shadow-sm">
              <SignalScoreRing score={signal.overall} label={signal.label} size={88} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Signal Score</span>
            </div>
          </div>

          {/* Key facts */}
          <div className="mt-10 grid grid-cols-2 gap-5 rounded-xl border border-rule bg-paper-tint p-6 shadow-sm md:grid-cols-4">
            <Stat label="Current stage" value={stageLabel || 'Undisclosed'} icon={<Layers />} />
            <Stat label="Founded" value={startup.foundedYear?.toString() || '—'} icon={<Calendar />} />
            <Stat label="Team size" value={startup.employees || '—'} icon={<Users />} />
            <Stat label="Location" value={firstToken(startup.location) || '—'} icon={<MapPin />} />
          </div>

          {/* Body */}
          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="space-y-14 lg:col-span-8">
              {/* About */}
              <section>
                <h2 className="mb-5 text-2xl font-bold tracking-tight text-ink">About</h2>
                {startup.description ? (
                  <p className="text-lg leading-[1.75] text-ink-muted text-pretty">{startup.description}</p>
                ) : (
                  <p className="italic text-ink-faint">Background and product information coming soon.</p>
                )}
              </section>

              {/* Traction & track record */}
              <section>
                <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
                  <Sparkles className="h-6 w-6 text-forest" strokeWidth={1.75} />
                  Traction &amp; track record
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <TractionTile
                    icon={<Clock className="h-4 w-4" />}
                    label="Operating"
                    value={yearsOperating != null ? `${yearsOperating} yr${yearsOperating === 1 ? '' : 's'}` : '—'}
                    sub={startup.foundedYear ? `Since ${startup.foundedYear}` : 'Founding year pending'}
                  />
                  <TractionTile
                    icon={<Banknote className="h-4 w-4" />}
                    label="Revenue"
                    value={hasRevenue ? String(startup.revenue) : '—'}
                    sub={hasRevenue ? 'Disclosed' : 'Undisclosed'}
                  />
                  <TractionTile
                    icon={<Award className="h-4 w-4" />}
                    label="Milestones"
                    value={achievements.length > 0 ? String(achievements.length) : '—'}
                    sub={achievements.length > 0 ? 'Recorded' : 'None listed yet'}
                  />
                </div>

                <h3 className="mb-4 mt-10 text-sm font-bold uppercase tracking-wider text-ink-muted">
                  What they&apos;ve done
                </h3>
                {achievements.length > 0 ? (
                  <ul className="space-y-3">
                    {achievements.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-lg border border-rule bg-paper p-4 shadow-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest" strokeWidth={1.75} />
                        <span className="text-[0.95rem] leading-relaxed text-ink">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-rule bg-paper-tint p-6 text-sm text-ink-muted">
                    No milestones recorded yet — traction highlights appear here as the founder adds them.
                  </p>
                )}
              </section>

              {/* Gallery */}
              {startup.images && startup.images.length > 0 && (
                <section>
                  <h2 className="mb-5 text-2xl font-bold tracking-tight text-ink">Gallery</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {startup.images.map((img, i) => (
                      <div
                        key={i}
                        className={`relative aspect-video overflow-hidden rounded-xl border border-rule bg-paper-deep ${i === 0 ? 'md:col-span-2' : ''}`}
                      >
                        <ImageWithFallback src={img} alt={`${startup.name} image ${i + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Aside */}
            <aside className="space-y-10 lg:col-span-4">
              {/* Signal breakdown */}
              <div className="rounded-xl border border-rule bg-paper p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-ink">How the score is built</h2>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: scoreColor }}>
                    {signal.overall}
                  </span>
                </div>
                <SignalBreakdownBars breakdown={signal.breakdown} />
                <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                  A transparent 0–100 readiness signal computed from the profile. Investor demand grows as
                  investors view and save this startup.
                </p>
              </div>

              {/* Founders */}
              <section>
                <h2 className="mb-5 text-base font-semibold text-ink">Founders</h2>
                {startup.founders && startup.founders.length > 0 ? (
                  <div className="space-y-6">
                    {startup.founders.map((founder, i) => (
                      <div key={i} className="flex flex-col gap-3 rounded-xl border border-rule bg-paper p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-rule bg-paper-deep">
                            {founder.image ? (
                              <ImageWithFallback src={founder.image} alt={founder.name} fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink-muted">
                                {getInitials(founder.name)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-ink">{founder.name || 'Anonymous'}</h3>
                            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-forest-soft">
                              {founder.role || 'Founder'}
                            </p>
                          </div>
                        </div>
                        {founder.bio && <p className="text-sm leading-relaxed text-ink-muted">{founder.bio}</p>}
                        <div className="flex items-center gap-2">
                          {founder.email && (
                            <a href={`mailto:${founder.email}`} className="rounded p-1 text-ink-muted transition-colors hover:text-forest" title="Email">
                              <Mail className="h-4 w-4" strokeWidth={2} />
                            </a>
                          )}
                          {founder.linkedin && (
                            <a href={founder.linkedin} target="_blank" className="rounded p-1 text-ink-muted transition-colors hover:text-forest" title="LinkedIn">
                              <Linkedin className="h-4 w-4" strokeWidth={2} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-ink-muted">Founder profiles pending.</p>
                )}
              </section>

              <div className="border-t border-rule pt-6 text-sm text-ink-muted">
                Profile updated {new Date(startup.updatedAt).toLocaleDateString()}
              </div>
            </aside>
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      <div className="border-t border-rule bg-paper-tint py-16 text-center">
        <h3 className="mb-3 text-xl font-bold text-ink">Discover more companies</h3>
        <p className="mb-8 text-sm text-ink-muted">Green Circle is the living registry of Ethiopian innovation.</p>
        <Link
          href="/startups"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-ink px-6 font-medium text-ink transition-all hover:bg-ink hover:text-paper"
        >
          View full directory
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Footer />
    </div>
  );
}

function StartupFetchErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header currentPage="startups" />
      <main className="mx-auto flex flex-1 max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border border-rule bg-paper-tint text-forest"
          aria-hidden
        >
          <AlertCircle className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">
          Couldn&apos;t load this profile
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted text-pretty">{message}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
          This usually isn&apos;t about the company being removed — try again, or open the
          directory from the link below.
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center rounded-md bg-forest px-6 text-sm font-medium text-paper transition-colors hover:bg-forest-soft"
          >
            Try again
          </button>
          <Link
            href="/startups"
            className="inline-flex h-11 items-center justify-center rounded-md border border-ink px-6 text-sm font-medium text-ink transition-colors hover:bg-paper-tint"
          >
            Back to directory
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-rule bg-paper text-ink-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-muted">{label}</p>
        <p className="truncate font-semibold leading-tight text-ink">{value}</p>
      </div>
    </div>
  );
}

function TractionTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-5 shadow-sm">
      <div className="flex items-center gap-2 text-ink-muted">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

function toSignalInput(s: StartupType): SignalScoreInput {
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

function firstToken(location?: string): string {
  if (!location) return '';
  return location.split(',')[0]?.trim() || location;
}

function normalizeAchievements(input: string | string[] | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  return input
    .split(/[\n•;]/)
    .map((s) => s.trim())
    .filter(Boolean);
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
