'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, LayoutList, LayoutGrid, X, AlertCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { StartupCard } from '@/components/startup-card';
import { SectionKicker } from '@/components/editorial/section-kicker';
import { Rule } from '@/components/editorial/rule';
import { Startup } from '@/types';
import { filterStartup } from '@/lib/call-api/call-api';
import {
  STARTUP_STAGES,
  STARTUP_STAGE_LABELS,
  type StartupStage,
} from '@/lib/startup-stage';
import Loading from '../loading';

type View = 'list' | 'grid';

export default function StartupsForm() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    setSearchTerm(q ?? '');
  }, [searchParams]);
  /** Empty array = no constraint (show all). */
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [view, setView] = useState<View>('list');
  const [startups, setStartups] = useState<Startup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setLoading(true);
    (async () => {
      try {
        const data = await filterStartup();
        if (!cancelled) {
          setStartups(data ?? []);
          setLoadError(null);
        }
      } catch (err) {
        console.error('Failed to load startups:', err);
        if (!cancelled) {
          setStartups([]);
          setLoadError(
            "We couldn't load the directory. Check your connection and try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const { sectors, locations, stagesInData } = useMemo(() => {
    const s = new Set<string>();
    const l = new Set<string>();
    const st = new Set<string>();
    (startups ?? []).forEach((startup) => {
      if (startup.sector) s.add(startup.sector);
      if (startup.location) l.add(firstLocationToken(startup.location));
      const raw = startup.stage?.trim();
      if (raw) st.add(raw);
    });
    return {
      sectors: Array.from(s).sort((a, b) => a.localeCompare(b)),
      locations: Array.from(l).sort((a, b) => a.localeCompare(b)),
      stagesInData: Array.from(st).sort(compareStageKeys),
    };
  }, [startups]);

  const filtered = useMemo(() => {
    if (!startups) return [];
    const q = searchTerm.trim().toLowerCase();
    return startups.filter((startup) => {
      const matchesSearch =
        !q ||
        startup.name.toLowerCase().includes(q) ||
        startup.description.toLowerCase().includes(q);
      const matchesSector =
        selectedSectors.length === 0 ||
        Boolean(startup.sector && selectedSectors.includes(startup.sector));
      const loc = firstLocationToken(startup.location);
      const matchesLocation =
        selectedLocations.length === 0 ||
        selectedLocations.includes(loc);
      const stageKey = startup.stage?.trim() ?? '';
      const matchesStage =
        selectedStages.length === 0 ||
        (stageKey !== '' && selectedStages.includes(stageKey));
      return (
        matchesSearch && matchesSector && matchesLocation && matchesStage
      );
    });
  }, [
    startups,
    searchTerm,
    selectedSectors,
    selectedLocations,
    selectedStages,
  ]);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, selectedSectors, selectedLocations, selectedStages]);

  const hasActiveFilter =
    selectedSectors.length > 0 ||
    selectedLocations.length > 0 ||
    selectedStages.length > 0 ||
    searchTerm.trim() !== '';

  if (loading) return <Loading />;

  const visible = filtered.slice(0, visibleCount);
  const total = startups?.length ?? 0;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header currentPage="startups" />

      <main className="flex-1">
        <div className="mx-auto max-w-[90rem] px-6 lg:px-12 pt-16 pb-24">
          {loadError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-10 flex flex-col gap-4 rounded-lg border border-rule bg-paper-tint px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex gap-3 text-left">
                <AlertCircle
                  className="h-5 w-5 shrink-0 text-forest mt-0.5"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="text-sm leading-relaxed text-ink">{loadError}</p>
              </div>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="h-10 shrink-0 rounded-md bg-forest px-4 font-sans text-sm font-medium text-paper transition-colors hover:bg-forest-soft sm:self-center"
              >
                Retry
              </button>
            </div>
          )}

          <SectionKicker>The Directory</SectionKicker>
          <h1 className="mt-5 text-4xl sm:text-[2.75rem] font-sans font-semibold tracking-tight text-ink max-w-[20ch] leading-tight text-balance">
            Every startup on Green Circle.
          </h1>
          <p className="mt-6 max-w-[56ch] text-lg text-ink-muted leading-[1.6] text-pretty">
            {loadError ? (
              <>
                When the directory loads, you can search and filter every public
                listing.
              </>
            ) : total > 0 ? (
              <>
                {total} founder{total === 1 ? '' : 's'} featured. Updated
                weekly. Reach out to any of them directly.
              </>
            ) : (
              <>
                No startups featured yet. Check back next week — we add one or
                two each time we meet a founder.
              </>
            )}
          </p>

          <div className="mt-10">
            <Rule />
          </div>

          <div className="mt-12 flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
            {/* Sidebar Left */}
            <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-10">
              <div className="relative w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint"
                  strokeWidth={1.5}
                />
                <input
                  type="search"
                  placeholder="Search startups"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-paper-tint border border-rule rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors"
                />
              </div>

              <div className="flex flex-col gap-8">
                <FilterCheckboxGroup
                  label="Sector"
                  options={sectors}
                  selected={selectedSectors}
                  onToggle={(value) =>
                    setSelectedSectors((prev) => toggleList(prev, value))
                  }
                />

                {locations.length > 0 && (
                  <FilterCheckboxGroup
                    label="Location"
                    options={locations}
                    selected={selectedLocations}
                    onToggle={(value) =>
                      setSelectedLocations((prev) => toggleList(prev, value))
                    }
                  />
                )}

                {stagesInData.length > 0 && (
                  <FilterCheckboxGroup
                    label="Stage"
                    options={stagesInData}
                    selected={selectedStages}
                    onToggle={(value) =>
                      setSelectedStages((prev) => toggleList(prev, value))
                    }
                    formatLabel={stageCheckboxLabel}
                  />
                )}
              </div>
            </aside>

            {/* Main Content Title & View */}
            <div className="flex-1 min-w-0 w-full">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="h-8 flex items-center">
                  {hasActiveFilter && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-ink-muted">
                        {filtered.length} match{filtered.length === 1 ? '' : 'es'}
                      </span>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedSectors([]);
                          setSelectedLocations([]);
                          setSelectedStages([]);
                        }}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink underline underline-offset-4 decoration-rule hover:decoration-ink transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
                
                <ViewToggle view={view} onChange={setView} />
              </div>

              <div>
                {filtered.length === 0 ? (
                  <EmptyState
                    onClear={() => {
                      setSearchTerm('');
                      setSelectedSectors([]);
                      setSelectedLocations([]);
                      setSelectedStages([]);
                    }}
                    hasFilter={hasActiveFilter}
                  />
                ) : view === 'list' ? (
                  <div className="flex flex-col">
                    {visible.map((startup, idx) => (
                      <StartupCard
                        key={`${startup._id}-${idx}`}
                        startup={startup}
                        variant="row"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
                    {visible.map((startup, idx) => (
                      <StartupCard
                        key={`${startup._id}-${idx}`}
                        startup={startup}
                        variant="grid"
                      />
                    ))}
                  </div>
                )}
              </div>

              {filtered.length > 0 && visibleCount < filtered.length && (
                <div className="mt-14 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((v) => v + 12)}
                    className="h-11 px-6 rounded-md border border-ink text-ink hover:bg-ink hover:text-paper transition-colors text-sm font-medium"
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function toggleList(list: string[], value: string): string[] {
  if (list.includes(value)) return list.filter((x) => x !== value);
  return [...list, value];
}

function compareStageKeys(a: string, b: string): number {
  const ia = STARTUP_STAGES.indexOf(a as StartupStage);
  const ib = STARTUP_STAGES.indexOf(b as StartupStage);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
}

function stageCheckboxLabel(raw: string): string {
  const k = raw.trim() as StartupStage;
  if (k in STARTUP_STAGE_LABELS) return STARTUP_STAGE_LABELS[k];
  return raw.trim();
}

function FilterCheckboxGroup({
  label,
  options,
  selected,
  onToggle,
  formatLabel = (o: string) => o,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  formatLabel?: (option: string) => string;
}) {
  const baseId = useId();
  if (options.length === 0) return null;
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="mb-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </legend>
      <div className="flex flex-col gap-0.5" role="group" aria-label={label}>
        {options.map((option, idx) => {
          const checked = selected.includes(option);
          const id = `${baseId}-${idx}`;
          return (
            <label
              key={`${option}-${idx}`}
              htmlFor={id}
              className={`flex cursor-pointer items-start gap-2.5 rounded-[0.4rem] px-3 py-2 text-sm transition-colors hover:bg-paper-tint ${
                checked ? 'text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-rule text-forest focus:ring-2 focus:ring-forest/30 focus:ring-offset-0"
              />
              <span
                className={`leading-snug ${checked ? 'font-medium' : 'font-normal'}`}
              >
                {formatLabel(option)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Directory view"
      className="inline-flex self-start sm:self-auto rounded-md border border-rule bg-paper-tint p-0.5"
    >
      <ToggleButton
        active={view === 'list'}
        onClick={() => onChange('list')}
        label="List"
        icon={<LayoutList className="h-4 w-4" strokeWidth={1.5} />}
      />
      <ToggleButton
        active={view === 'grid'}
        onClick={() => onChange('grid')}
        label="Grid"
        icon={<LayoutGrid className="h-4 w-4" strokeWidth={1.5} />}
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-8 px-3 inline-flex items-center gap-2 rounded-[0.375rem] text-xs font-medium transition-colors ${
        active
          ? 'bg-paper text-ink shadow-sm'
          : 'text-ink-muted hover:text-ink'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyState({
  onClear,
  hasFilter,
}: {
  onClear: () => void;
  hasFilter: boolean;
}) {
  return (
    <div className="py-20 text-center max-w-md mx-auto">
      <p className="text-lg text-ink-muted leading-relaxed text-pretty">
        Nothing matches yet. {hasFilter && 'Try clearing a filter, or '}
        <a
          href="mailto:hello@greencircle.et?subject=A%20founder%20you%20should%20know"
          className="text-ink underline underline-offset-4 decoration-rule hover:decoration-ink transition-colors"
        >
          let us know who we&rsquo;re missing
        </a>
        .
      </p>
      {hasFilter && (
        <button
          onClick={onClear}
          className="mt-6 h-10 px-5 rounded-md border border-ink text-ink hover:bg-ink hover:text-paper transition-colors text-sm font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function firstLocationToken(location: string): string {
  return location?.split(',')[0]?.trim() || location;
}
