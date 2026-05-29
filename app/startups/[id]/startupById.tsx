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
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import type { Startup as StartupType } from '@/types';
import { getStartupById } from '@/lib/call-api/call-api';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ImageWithFallback } from '@/components/image-withfallback';
import { displayStartupStage } from '@/lib/startup-stage';
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

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header currentPage="startups" />

      <main className="flex-1 pb-32">
        {/* Navigation & Context */}
        <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 mb-12">
          <Link
            href="/startups"
            className="group inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to directory
          </Link>
        </div>

        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row gap-8 lg:gap-10 items-start">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-paper-deep border border-rule flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {startup.logo ? (
                <ImageWithFallback
                  src={startup.logo}
                  alt={`${startup.name} logo`}
                  width={128}
                  height={128}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <span className="font-sans font-semibold text-3xl text-ink-faint">
                  {initials}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-forest">
                  {startup.sector || 'Technology startup'}
                </span>
              </div>
              
              <h1 className="font-sans text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-none text-ink text-balance mb-5">
                {startup.name}
              </h1>
              
              <p className="text-xl sm:text-[1.35rem] font-medium text-ink-muted leading-relaxed max-w-3xl text-pretty">
                {startup.pitch || "Startup pitch and core mission currently being compiled."}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {/* Primary CTA: Revenue-driving connection request */}
                <button
                  className="h-11 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-forest hover:bg-forest-soft text-paper text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
                  onClick={() => alert('Connect feature coming soon. Express interest in this startup to unlock full founder contact details.')}
                >
                  <TrendingUp className="h-4 w-4" />
                  Apply to Connect
                </button>

                {startup.website && (
                  <Link
                    href={startup.website}
                    target="_blank"
                    className="h-11 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-ink hover:bg-ink-muted text-paper text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Globe className="h-4 w-4" />
                    Visit website
                  </Link>
                )}
              </div>
            </div>
          </div>

          <hr className="my-14 border-t-2 border-rule border-dashed" />

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Stat label="Current Stage" value={stageLabel || 'Undisclosed'} icon={<TrendingUp />} />
            <Stat label="Founded" value={startup.foundedYear?.toString() || '—'} icon={<Calendar />} />
            <Stat label="Team Size" value={startup.employees || '—'} icon={<Users />} />
            <Stat label="Location" value={startup.location || '—'} icon={<MapPin />} />
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
            
            {/* Left Column (Description & Gallery) */}
            <div className="lg:col-span-8 space-y-16">
              
              <section>
                <h2 className="font-sans text-2xl font-bold tracking-tight text-ink mb-6">About the startup</h2>
                <div className="text-lg leading-[1.75] text-ink-muted space-y-5 text-pretty">
                  {startup.description ? (
                    <p>{startup.description}</p>
                  ) : (
                    <p className="italic text-ink-faint">Background and product information coming soon.</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="font-sans text-2xl font-bold tracking-tight text-ink mb-6">Visual Overview</h2>
                {startup.images && startup.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {startup.images.map((img, i) => (
                      <div key={i} className={`relative aspect-video rounded-xl overflow-hidden border border-rule/50 bg-paper-deep ${i === 0 ? 'md:col-span-2' : ''}`}>
                         <ImageWithFallback src={img} alt={`${startup.name} gallery image ${i + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-paper-tint border border-rule border-dashed p-12 flex flex-col items-center justify-center text-center">
                    <ImageIcon className="h-8 w-8 text-ink-faint mb-3" strokeWidth={1.5} />
                    <p className="text-[0.95rem] font-medium text-ink-muted">No images provided yet.</p>
                  </div>
                )}
              </section>

            </div>

            {/* Right Column (Founders & Track Record) */}
            <aside className="lg:col-span-4 space-y-12">
              
              <section>
                <h2 className="font-sans text-xl font-bold tracking-tight text-ink mb-6">The Founders</h2>
                {startup.founders && startup.founders.length > 0 ? (
                  <div className="space-y-8">
                    {startup.founders.map((founder, i) => (
                      <div key={i} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-full overflow-hidden bg-paper-deep border border-rule shrink-0 relative">
                             {founder.image ? (
                               <ImageWithFallback src={founder.image} alt={founder.name} fill className="object-cover" sizes="56px" />
                             ) : (
                               <div className="h-full w-full flex items-center justify-center font-sans font-semibold text-lg text-ink-faint">
                                 {getInitials(founder.name)}
                               </div>
                             )}
                          </div>
                          <div>
                            <h3 className="font-sans text-base font-bold text-ink">{founder.name || 'Anonymous'}</h3>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-forest/80 mt-0.5">{founder.role || 'Founder'}</p>
                          </div>
                        </div>
                        
                        {founder.bio && (
                          <p className="text-sm leading-relaxed text-ink-muted">
                            {founder.bio}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3">
                           {founder.email && (
                             <a href={`mailto:${founder.email}`} className="text-ink-muted hover:text-ink transition-colors p-1" title="Email">
                               <Mail className="h-4 w-4" strokeWidth={2} />
                             </a>
                           )}
                           {founder.linkedin && (
                             <a href={founder.linkedin} target="_blank" className="text-ink-muted hover:text-ink transition-colors p-1" title="LinkedIn">
                               <Linkedin className="h-4 w-4" strokeWidth={2} />
                             </a>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted italic">Founder profiles pending.</p>
                )}
              </section>

              {achievements.length > 0 && (
                <section>
                  <h2 className="font-sans text-xl font-bold tracking-tight text-ink mb-6">Track Record</h2>
                  <ul className="space-y-4">
                     {achievements.map((item, i) => (
                       <li key={i} className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-forest shrink-0 mt-0.5" strokeWidth={1.5} />
                          <span className="text-[0.95rem] leading-relaxed text-ink-muted">
                            {item}
                          </span>
                       </li>
                     ))}
                  </ul>
                </section>
              )}

              <div className="pt-8 border-t border-rule text-sm text-ink-faint">
                Profile updated {new Date(startup.updatedAt).toLocaleDateString()}
              </div>

            </aside>
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      <div className="bg-paper-tint border-t border-rule py-16 text-center">
        <h3 className="font-sans text-xl font-bold text-ink mb-3">Discover more companies</h3>
        <p className="text-sm text-ink-muted mb-8">Green Circle is the living registry of Ethiopian innovation.</p>
        <Link
          href="/startups"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-ink text-ink font-medium hover:bg-ink hover:text-paper transition-all"
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
        <h1 className="mt-6 font-sans text-xl font-semibold tracking-tight text-ink">
          Couldn&apos;t load this profile
        </h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted text-pretty">
          {message}
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-ink-faint text-pretty">
          This usually isn&apos;t about the company being removed — try again, or open the
          directory from the link below.
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center rounded-md bg-forest px-6 font-sans text-sm font-medium text-paper transition-colors hover:bg-forest-soft"
          >
            Try again
          </button>
          <Link
            href="/startups"
            className="inline-flex h-11 items-center justify-center rounded-md border border-ink px-6 font-sans text-sm font-medium text-ink transition-colors hover:bg-paper-tint"
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

function Stat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded flex items-center justify-center text-ink-faint border border-rule bg-paper-tint shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-ink-faint mb-1">{label}</p>
        <p className="font-semibold text-ink leading-tight">{value}</p>
      </div>
    </div>
  );
}

function normalizeAchievements(
  input: string | string[] | undefined,
): string[] {
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
