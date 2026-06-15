'use client';

// Ethiopia ecosystem summary (the Stats tab) — a readable story of what's being
// built: how many startups, where, which sectors are growing, and the funding.
// REAL: startup counts, sectors, growth over time, stage mix, geography.
// MOCK (clearly tagged, isolated in lib/dealroom-*-mock): funding totals,
// funding-over-time, most-active investors, notable rounds.
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Treemap,
} from 'recharts';
import dynamic from 'next/dynamic';
import { Building2, Banknote, Layers, Users } from 'lucide-react';
import type { MapBubble } from './coverage-map';
import { buildEcosystemMock, mockCityDistribution } from '@/lib/dealroom-ecosystem-mock';
import { fmtAmount } from '@/lib/dealroom-mock';
import { STARTUP_STAGE_LABELS, type StartupStage } from '@/lib/startup-stage';
import type { PublicCompany } from '@/app/api/analytics/companies/route';

export interface EcosystemData {
  overview: { totalStartups: number; totalSectors: number; avgTeamSize: number; seekingInvestment: number };
  sectors: { name: string; count: number }[];
  stages: { name: string; count: number; percentage: number }[];
  locations: { name: string; count: number }[];
  monthlyGrowth: { month: string; count: number }[];
  foundingYears: { year: string; count: number }[];
  teamSizeDistribution: { size: string; count: number }[];
  stageVelocity: { from: string; to: string; count: number }[];
}

// Chart palette tuned for contrast on the cards.
const GRID = '#d9d2c1';
const TICK = '#5e584e';
const TIP = { backgroundColor: '#fff', border: '1px solid #d9d2c1', borderRadius: 8, fontSize: 12 } as const;

// Leaflet needs the browser — load the map client-side only.
const CoverageMap = dynamic(() => import('./coverage-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center rounded-lg border border-rule bg-paper-tint text-sm text-ink-muted">
      Loading map…
    </div>
  ),
});

const CITY_COORDS: Record<string, [number, number]> = {
  'Addis Ababa': [38.7578, 9.0192],
  Hawassa: [38.4763, 7.0504],
  Awassa: [38.4763, 7.0504],
  'Bahir Dar': [37.3833, 11.5936],
  'Dire Dawa': [41.8661, 9.5931],
  Mekelle: [39.4753, 13.4969],
  Adama: [39.27, 8.54],
  Gondar: [37.46, 12.6],
  Jimma: [36.83, 7.67],
};

export function EcosystemDashboard({ data }: { data: EcosystemData }) {
  const [companies, setCompanies] = useState<PublicCompany[] | null>(null);

  useEffect(() => {
    let on = true;
    fetch('/api/analytics/companies')
      .then((r) => r.json())
      .then((d) => {
        if (on) setCompanies(d.companies ?? []);
      })
      .catch(() => {
        if (on) setCompanies([]);
      });
    return () => {
      on = false;
    };
  }, []);

  const eco = useMemo(() => (companies ? buildEcosystemMock(companies) : null), [companies]);

  // Geographic spread is SAMPLE (real data is Addis-only) so the map shows coverage.
  const bubbles: MapBubble[] = useMemo(
    () =>
      mockCityDistribution(data.overview.totalStartups)
        .filter((l) => CITY_COORDS[l.city])
        .map((l) => ({ city: l.city, count: l.count, lng: CITY_COORDS[l.city][0], lat: CITY_COORDS[l.city][1] })),
    [data.overview.totalStartups]
  );

  const sectorsByCount = useMemo(() => data.sectors.slice(0, 8), [data.sectors]);
  const stagesData = useMemo(
    () =>
      data.stages
        .map((s) => ({ label: STARTUP_STAGE_LABELS[s.name as StartupStage] ?? cap(s.name), count: s.count }))
        .sort((a, b) => b.count - a.count),
    [data.stages]
  );

  const totalAdded12mo = data.monthlyGrowth.reduce((s, m) => s + m.count, 0);

  return (
    <div className="flex flex-col gap-10">
      {/* Headline */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Ethiopia&rsquo;s startup ecosystem</h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          A snapshot of what&rsquo;s being built — how many startups, where they are, which sectors are
          growing, and the capital flowing in.
        </p>
      </div>

      {/* KPI band */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Building2 className="h-4 w-4" />} label="Startups tracked" value={String(data.overview.totalStartups)} sub="On Green Circle" />
        <Kpi icon={<Layers className="h-4 w-4" />} label="Sectors" value={String(data.overview.totalSectors)} sub="Active industries" />
        <Kpi icon={<Banknote className="h-4 w-4" />} label="Total funding" value={eco ? fmtAmount(eco.totalFundingUsd) : '—'} sub="Sample" muted />
        <Kpi icon={<Users className="h-4 w-4" />} label="Active investors" value={eco ? String(eco.investorCount) : '—'} sub="Sample" muted />
      </div>

      {/* Map */}
      <Card title="Where startups are" subtitle="Startup hubs across Ethiopia — bubbles sized by number of startups." tag="Sample">
        <div className="grid items-center gap-6 lg:grid-cols-[1.6fr_1fr]">
          <CoverageMap bubbles={bubbles} />
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Top locations</p>
            {bubbles.length === 0 ? (
              <p className="text-sm text-ink-muted">No locations yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-rule">
                {bubbles
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((b, i) => (
                    <li key={b.city} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2.5 text-sm text-ink">
                        <span className="w-4 tabular-nums text-ink-muted">{i + 1}</span>
                        {b.city}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">{b.count}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* Sectors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Sector landscape" subtitle="Each tile sized by number of startups in the sector." tag="Real">
          <ResponsiveContainer width="100%" height={300}>
            <Treemap data={data.sectors} dataKey="count" nameKey="name" stroke="#fff" isAnimationActive={false} content={<SectorTile />}>
              <Tooltip contentStyle={TIP} formatter={(v: unknown) => [`${Number(v)} startups`, 'Count']} />
            </Treemap>
          </ResponsiveContainer>
        </Card>

        <Card title="Startups by sector" subtitle="Which industries the ecosystem is concentrated in." tag="Real">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorsByCount} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
              <XAxis type="number" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TIP} formatter={(v: unknown) => [`${Number(v)} startups`, 'Count']} cursor={{ fill: '#00000008' }} />
              <Bar dataKey="count" fill="#1F4F3F" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Growth */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Ecosystem growth"
          subtitle={`New startups added each month — ${totalAdded12mo} in the last 12 months.`}
          tag="Real"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthlyGrowth} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: TICK }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TIP} formatter={(v: unknown) => [`${Number(v)} added`, 'Startups']} />
              <Line type="monotone" dataKey="count" stroke="#1F4F3F" strokeWidth={2.5} dot={{ fill: '#1F4F3F', r: 3 }} activeDot={{ r: 6, fill: '#C5A028' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Funding over time" subtitle="Capital raised per year, split by stage band." tag="Sample">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eco?.fundingByYear ?? []} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip contentStyle={TIP} formatter={(v: unknown, n: unknown) => [`$${Number(v)}m`, cap(String(n))]} cursor={{ fill: '#00000008' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="early" stackId="f" name="Early" fill="#1F4F3F" />
              <Bar dataKey="breakout" stackId="f" name="Breakout" fill="#3A7A5F" />
              <Bar dataKey="scaleup" stackId="f" name="Scaleup" fill="#C5A028" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Stages + investors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Funding stages" subtitle="Where tracked startups sit in their journey." tag="Real">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stagesData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
              <XAxis type="number" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="label" type="category" width={104} tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TIP} formatter={(v: unknown) => [`${Number(v)} startups`, 'Count']} cursor={{ fill: '#00000008' }} />
              <Bar dataKey="count" fill="#C5A028" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Most active investors" subtitle="Investor names are real ecosystem firms; round counts are sample." tag="Sample">
          <ul className="flex flex-col divide-y divide-rule">
            {(eco?.activeInvestors ?? []).map((inv, i) => (
              <li key={inv.name} className="flex items-center gap-3 py-2.5">
                <span className="w-5 text-sm font-semibold tabular-nums text-ink-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{inv.name}</p>
                  <p className="text-xs text-ink-muted">{inv.focus}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-ink-muted">
                  <span className="font-semibold text-ink">{inv.rounds}</span> rounds
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Notable rounds */}
      <Card title="Notable rounds" subtitle="Largest sample rounds across the tracked set." tag="Sample">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(eco?.notableRounds ?? []).map((r) => (
            <div key={r.name} className="rounded-lg border border-rule bg-paper-tint px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-forest-soft">{r.amount}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                {r.type} · {r.date}
                {r.sector ? ` · ${r.sector}` : ''}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-ink-muted">
        <span className="font-semibold">Sample data:</span> funding totals, funding-over-time, the
        investor list, notable rounds and the map&rsquo;s city spread are placeholders for layout preview
        (investor names are real ecosystem firms; figures are not — real listings are Addis-concentrated).
        Startup counts, sectors, growth and stages are real.
      </p>
    </div>
  );
}

/* --------------------------------- pieces ---------------------------------- */

function Kpi({
  icon,
  label,
  value,
  sub,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-forest-soft">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{value}</p>
      <p className={`mt-1 text-xs font-medium ${muted ? 'text-ink-muted' : 'text-forest-soft'}`}>{sub}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  tag,
  children,
}: {
  title: string;
  subtitle?: string;
  tag?: 'Real' | 'Sample';
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {tag && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              tag === 'Real'
                ? 'border-forest/25 bg-forest/10 text-forest-soft'
                : 'border-gold/40 bg-gold-faint text-ink-muted'
            }`}
          >
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TREEMAP_COLORS = ['#1F4F3F', '#2D5A4A', '#3A7A5F', '#4A9A7A', '#C5A028', '#D4B84A', '#6f9c82', '#2D6A8E'];

function SectorTile({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  name = '',
  value = 0,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
}) {
  if (width <= 0 || height <= 0) return null;
  const color = TREEMAP_COLORS[index % TREEMAP_COLORS.length];
  const showLabel = width > 56 && height > 30;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} stroke="#fff" strokeWidth={2} rx={3} />
      {showLabel && (
        <>
          <text x={x + 8} y={y + 20} fill="#fff" className="capitalize" style={{ fontSize: 12, fontWeight: 600 }}>
            {name}
          </text>
          <text x={x + 8} y={y + 36} fill="rgba(255,255,255,0.85)" style={{ fontSize: 11 }}>
            {value}
          </text>
        </>
      )}
    </g>
  );
}
