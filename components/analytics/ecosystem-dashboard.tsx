'use client';

// Dealroom-style ecosystem dashboard (the Stats tab).
// REAL: company count, sectors, geographic distribution (city bubbles), avg team.
// MOCK (clearly labelled, isolated in lib/dealroom-*-mock): funding totals,
// funding-over-time, top-sectors-by-funding, most-active investors, notable rounds.
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Building2, Banknote, TrendingUp, Users } from 'lucide-react';
import { EthiopiaMap, type MapBubble } from './ethiopia-map';
import { buildEcosystemMock } from '@/lib/dealroom-ecosystem-mock';
import { fmtAmount } from '@/lib/dealroom-mock';
import type { PublicCompany } from '@/app/api/analytics/companies/route';

// Lng/lat of Ethiopian cities we can place on the map.
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

export function EcosystemDashboard() {
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

  const bubbles: MapBubble[] = useMemo(() => {
    if (!companies) return [];
    const counts = new Map<string, number>();
    for (const c of companies) {
      const city = (c.location || '').split(',')[0].trim();
      if (city) counts.set(city, (counts.get(city) || 0) + 1);
    }
    return [...counts.entries()]
      .filter(([city]) => CITY_COORDS[city])
      .map(([city, count]) => ({
        city,
        count,
        lng: CITY_COORDS[city][0],
        lat: CITY_COORDS[city][1],
      }));
  }, [companies]);

  if (!eco) {
    return <div className="py-16 text-center text-ink-muted animate-pulse">Loading ecosystem dashboard…</div>;
  }

  const companyCount = companies?.length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* KPI band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Building2 className="h-4 w-4" />} label="Companies" value={String(companyCount)} sub="Tracked · real" />
        <Kpi icon={<Banknote className="h-4 w-4" />} label="Total funding" value={fmtAmount(eco.totalFundingUsd)} sub="Sample" muted />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Funding rounds" value={String(eco.totalRounds)} sub="Sample" muted />
        <Kpi icon={<Users className="h-4 w-4" />} label="Active investors" value={String(eco.investorCount)} sub="Sample" muted />
      </div>

      {/* Funding over time + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Funding over time" tag="Sample">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={eco.fundingByYear} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown, n: unknown) => [`$${Number(v)}m`, cap(String(n))]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="early" stackId="f" name="Early" fill="#1F4F3F" radius={[0, 0, 0, 0]} />
              <Bar dataKey="breakout" stackId="f" name="Breakout" fill="#3A7A5F" />
              <Bar dataKey="scaleup" stackId="f" name="Scaleup" fill="#C5A028" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Where startups are" tag="Real">
          <div className="flex flex-col">
            <EthiopiaMap bubbles={bubbles} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {bubbles
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((b) => (
                  <span key={b.city} className="text-xs text-ink-muted">
                    <span className="font-semibold text-ink">{b.count}</span> {b.city}
                  </span>
                ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top sectors by funding + Most active investors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top sectors by funding" tag="Sample">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eco.topSectorsByFunding} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
              <XAxis type="number" hide />
              <YAxis dataKey="sector" type="category" width={110} tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [fmtAmount(Number(v)), 'Funding']}
              />
              <Bar dataKey="fundingUsd" fill="#1F4F3F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Most active investors" tag="Sample">
          <ul className="flex flex-col divide-y divide-rule">
            {eco.activeInvestors.map((inv, i) => (
              <li key={inv.name} className="flex items-center gap-3 py-2.5">
                <span className="w-5 text-sm font-semibold text-ink-faint tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{inv.name}</p>
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
      <Card title="Notable rounds" tag="Sample">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {eco.notableRounds.map((r) => (
            <div key={r.name} className="rounded-lg border border-rule px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                <span className="shrink-0 text-sm font-semibold text-forest tabular-nums">{r.amount}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                {r.type} · {r.date}
                {r.sector ? ` · ${r.sector}` : ''}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-ink-faint">
        Funding totals, rounds, top-sectors-by-funding, the investor list and notable rounds are{' '}
        <span className="font-medium">sample data</span> for layout preview (investor names are real
        ecosystem firms; round counts are not). Company count, sectors and the map are real.
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
    <div className="rounded-xl border border-rule bg-paper p-5">
      <div className="flex items-center gap-2 text-ink-faint">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
      <p className={`mt-1 text-xs ${muted ? 'text-ink-faint' : 'text-ink-muted'}`}>{sub}</p>
    </div>
  );
}

function Card({ title, tag, children }: { title: string; tag?: 'Real' | 'Sample'; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {tag && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              tag === 'Real' ? 'bg-forest/10 text-forest' : 'bg-paper-tint text-ink-faint'
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
