'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, AlertCircle, ChevronDown, Download } from 'lucide-react';
import { LineChart, Line } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { bandColor } from '@/components/investor/signal-score-ring';
import {
  STARTUP_STAGES,
  STARTUP_STAGE_LABELS,
  type StartupStage,
} from '@/lib/startup-stage';
import { dealroomMock, type DealroomMockMetrics } from '@/lib/dealroom-mock';
import type {
  PublicCompany,
  CompaniesFacets,
} from '@/app/api/analytics/companies/route';

type SortKey = 'signal' | 'newest' | 'growth';
type Row = { c: PublicCompany; m: DealroomMockMetrics };

const PAGE = 30;

export function CompanyTable() {
  const [companies, setCompanies] = useState<PublicCompany[] | null>(null);
  const [facets, setFacets] = useState<CompaniesFacets>({ sectors: [], stages: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('signal');
  const [visibleCount, setVisibleCount] = useState(PAGE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch('/api/analytics/companies');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!cancelled) {
          setCompanies(data.companies ?? []);
          setFacets(data.facets ?? { sectors: [], stages: [], locations: [] });
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
        if (!cancelled) {
          setCompanies([]);
          setLoadError("We couldn't load the companies. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Deterministic mock metrics per company (preview only — see lib/dealroom-mock).
  const metrics = useMemo(() => {
    const m = new Map<string, DealroomMockMetrics>();
    (companies ?? []).forEach((c) => m.set(c._id, dealroomMock(c)));
    return m;
  }, [companies]);

  const rows: Row[] = useMemo(() => {
    if (!companies) return [];
    const q = search.trim().toLowerCase();
    const filtered = companies.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
      const matchesSector =
        selectedSectors.length === 0 || Boolean(c.sector && selectedSectors.includes(c.sector));
      const stageKey = c.stage?.trim() ?? '';
      const matchesStage =
        selectedStages.length === 0 || (stageKey !== '' && selectedStages.includes(stageKey));
      const loc = firstLocationToken(c.location);
      const matchesLocation =
        selectedLocations.length === 0 || Boolean(loc && selectedLocations.includes(loc));
      return matchesSearch && matchesSector && matchesStage && matchesLocation;
    });

    const out: Row[] = filtered.map((c) => ({ c, m: metrics.get(c._id)! }));
    if (sort === 'newest') {
      out.sort((a, b) => (b.c.createdAt ?? '').localeCompare(a.c.createdAt ?? ''));
    } else if (sort === 'growth') {
      out.sort((a, b) => b.m.growthPct - a.m.growthPct);
    } else {
      out.sort((a, b) => b.c.signal.overall - a.c.signal.overall);
    }
    return out;
  }, [companies, metrics, search, selectedSectors, selectedStages, selectedLocations, sort]);

  useEffect(() => {
    setVisibleCount(PAGE);
  }, [search, selectedSectors, selectedStages, selectedLocations, sort]);

  const hasActiveFilter =
    search.trim() !== '' ||
    selectedSectors.length > 0 ||
    selectedStages.length > 0 ||
    selectedLocations.length > 0;

  function clearFilters() {
    setSearch('');
    setSelectedSectors([]);
    setSelectedStages([]);
    setSelectedLocations([]);
  }

  const visible = rows.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: filter chips + search + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Sector"
          options={facets.sectors}
          selected={selectedSectors}
          onToggle={(v) => setSelectedSectors((p) => toggleList(p, v))}
          onClear={() => setSelectedSectors([])}
        />
        <FilterDropdown
          label="Stage"
          options={facets.stages.slice().sort(compareStageKeys)}
          selected={selectedStages}
          onToggle={(v) => setSelectedStages((p) => toggleList(p, v))}
          onClear={() => setSelectedStages([])}
          formatLabel={stageCheckboxLabel}
        />
        <FilterDropdown
          label="Location"
          options={facets.locations}
          selected={selectedLocations}
          onToggle={(v) => setSelectedLocations((p) => toggleList(p, v))}
          onClear={() => setSelectedLocations([])}
        />
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" strokeWidth={1.5} />
            <input
              type="search"
              placeholder="Search companies"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-paper-tint border border-rule rounded-md text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink-muted whitespace-nowrap">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-md border border-rule bg-paper-tint px-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
            >
              <option value="signal">Signal score</option>
              <option value="growth">Growth</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      {/* Count + export */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">
          Showing <span className="font-semibold text-ink">{rows.length}</span>{' '}
          compan{rows.length === 1 ? 'y' : 'ies'}
        </span>
        <button
          onClick={() => exportCsv(rows)}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-rule bg-paper-tint text-sm text-ink-muted hover:text-ink hover:border-ink/30 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Export
        </button>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-lg border border-rule bg-paper-tint px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-forest mt-0.5" strokeWidth={1.75} />
            <p className="text-sm text-ink">{loadError}</p>
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="h-10 shrink-0 rounded-md bg-forest px-4 text-sm font-medium text-paper transition-colors hover:bg-forest-soft"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-ink-muted animate-pulse">Loading companies…</div>
      ) : rows.length === 0 ? (
        <div className="py-20 text-center text-ink-muted">No companies match your filters.</div>
      ) : (
        <>
          <div className="rounded-xl border border-rule overflow-x-auto">
            <Table className="min-w-[1280px]">
              <TableHeader>
                <TableRow className="bg-paper-tint hover:bg-paper-tint border-rule">
                  <Th className="pl-4">Name</Th>
                  <Th>Signal</Th>
                  <Th>Market</Th>
                  <Th>Type</Th>
                  <Th>Growth</Th>
                  <Th>Launch</Th>
                  <Th>Valuation</Th>
                  <Th>Funding</Th>
                  <Th>Location</Th>
                  <Th>Last round</Th>
                  <Th>Last round date</Th>
                  <Th className="pr-4">Jobs</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ c, m }) => (
                  <TableRow key={c._id} className="border-rule hover:bg-paper-tint/60">
                    <TableCell className="py-3 pl-4">
                      <NameCell company={c} />
                    </TableCell>
                    <TableCell>
                      <SignalCell score={c.signal.overall} label={c.signal.label} />
                    </TableCell>
                    <TableCell>
                      <MarketCell scope={m.marketScope} sector={c.sector} />
                    </TableCell>
                    <TableCell className="max-w-[150px] whitespace-normal text-xs text-ink-muted leading-snug capitalize">
                      {m.type}
                    </TableCell>
                    <TableCell>
                      <GrowthCell pct={m.growthPct} series={m.growthSeries} />
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">{c.foundedYear || <Dash />}</TableCell>
                    <TableCell className="text-sm text-ink-muted tabular-nums">
                      {m.valuation ?? <Dash />}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-ink tabular-nums">
                      {m.funding === '—' ? <Dash /> : m.funding}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {firstLocationToken(c.location) || <Dash />}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted tabular-nums whitespace-nowrap">
                      {m.lastRound}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted whitespace-nowrap">{m.lastRoundDate}</TableCell>
                    <TableCell className="pr-4 text-sm text-ink-muted tabular-nums">
                      {m.jobOpenings ?? <Dash />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-ink-faint">
            Market figures (valuation, funding, rounds, growth, type) are sample data shown for layout
            preview. Signal score, sector, launch year and location are real.
          </p>

          {visibleCount < rows.length && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVisibleCount((v) => v + PAGE)}
                className="h-11 px-6 rounded-md border border-ink text-ink hover:bg-ink hover:text-paper transition-colors text-sm font-medium"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ----------------------------------- cells ----------------------------------- */

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <TableHead className={`h-11 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint ${className}`}>
      {children}
    </TableHead>
  );
}

function Dash() {
  return <span className="text-ink-faint">—</span>;
}

function NameCell({ company }: { company: PublicCompany }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <LogoAvatar src={company.logo} name={company.name} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink truncate max-w-[220px]">{company.name}</p>
        {company.description && (
          <p className="text-xs text-ink-muted truncate max-w-[220px]">{company.description}</p>
        )}
      </div>
    </div>
  );
}

/** Real company logo, falling back to an initial-letter placeholder when the
 *  URL is missing, a placeholder, or fails to load. */
function LogoAvatar({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !src!.includes('placeholder') && !failed;

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-9 w-9 shrink-0 rounded-md object-contain bg-paper border border-rule p-0.5"
      />
    );
  }
  return (
    <div className="h-9 w-9 shrink-0 rounded-md bg-paper-tint border border-rule flex items-center justify-center text-xs font-semibold text-ink-muted">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SignalCell({ score, label }: { score: number; label: string }) {
  const color = bandColor(score);
  return (
    <div className="flex items-center gap-2.5 min-w-[100px]">
      <div className="h-1.5 flex-1 rounded-full bg-rule overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function MarketCell({ scope, sector }: { scope: string; sector?: string }) {
  return (
    <div className="min-w-[80px]">
      <p className="text-sm font-medium text-ink">{scope}</p>
      {sector && <p className="text-xs text-ink-muted capitalize">{sector}</p>}
    </div>
  );
}

function GrowthCell({ pct, series }: { pct: number; series: { i: number; v: number }[] }) {
  const up = pct >= 0;
  const color = up ? '#1F4F3F' : '#dc2626';
  return (
    <div className="flex items-center gap-2 min-w-[108px]">
      <LineChart width={60} height={26} data={series} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
      <span className={`text-sm font-medium tabular-nums ${up ? 'text-forest' : 'text-red-600'}`}>
        {up ? '+' : ''}
        {Math.round(pct)}%
      </span>
    </div>
  );
}

/* --------------------------------- toolbar ---------------------------------- */

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
  formatLabel = (o: string) => o,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  formatLabel?: (option: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  if (options.length === 0) return null;
  const count = selected.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm transition-colors ${
          count > 0
            ? 'border-forest/40 bg-forest/5 text-ink'
            : 'border-rule bg-paper-tint text-ink-muted hover:text-ink'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[11px] font-semibold text-paper">
            {count}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-60 max-h-80 overflow-auto rounded-lg border border-rule bg-paper p-1.5 shadow-lg">
          {options.map((option, idx) => {
            const checked = selected.includes(option);
            return (
              <label
                key={`${option}-${idx}`}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-paper-tint"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option)}
                  className="h-4 w-4 rounded border-rule text-forest focus:ring-2 focus:ring-forest/30"
                />
                <span className={checked ? 'text-ink font-medium' : 'text-ink-muted'}>
                  {formatLabel(option)}
                </span>
              </label>
            );
          })}
          {count > 0 && (
            <button
              onClick={onClear}
              className="mt-1 w-full rounded-md px-2.5 py-1.5 text-left text-xs text-ink-muted hover:bg-paper-tint hover:text-ink"
            >
              Clear {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- helpers ---------------------------------- */

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

function firstLocationToken(location?: string): string | undefined {
  if (!location) return undefined;
  return location.split(',')[0]?.trim() || location;
}

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(rows: Row[]) {
  const headers = [
    'Name', 'Signal', 'Market', 'Type', 'Growth %', 'Launch',
    'Valuation', 'Funding', 'Location', 'Last round', 'Last round date', 'Job openings',
  ];
  const body = rows.map(({ c, m }) =>
    [
      c.name,
      c.signal.overall,
      m.marketScope,
      m.type,
      Math.round(m.growthPct),
      c.foundedYear ?? '',
      m.valuation ?? '',
      m.funding === '—' ? '' : m.funding,
      firstLocationToken(c.location) ?? '',
      m.lastRound,
      m.lastRoundDate,
      m.jobOpenings ?? '',
    ]
      .map(csvCell)
      .join(',')
  );
  const csv = [headers.join(','), ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'green-circle-companies.csv';
  a.click();
  URL.revokeObjectURL(url);
}
