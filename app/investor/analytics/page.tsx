'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { authClient } from '@/lib/auth-client';
import { STARTUP_STAGES, STARTUP_STAGE_LABELS } from '@/lib/startup-stage';
import { DealflowTable } from '@/components/investor/dealflow-table';
import type { DealCardData } from '@/components/investor/deal-card';
import {
  mockDealEngagement,
  mockEngagementSummary,
  mockSectorMomentum,
  mockMonthlyGrowth,
} from '@/lib/investor-engagement-mock';
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
  Cell,
} from 'recharts';
import {
  Download,
  TrendingUp,
  Eye,
  Building2,
  Gauge,
  ArrowRight,
  BookmarkCheck,
  LayoutList,
  BarChart3,
} from 'lucide-react';

const COLORS = ['#1F4F3F', '#C5A028', '#2D5A4A', '#D4B84A', '#3A7A5F', '#E8D070'];
const SHELL = 'mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-10';

interface AnalyticsData {
  dealFlow: {
    seekingInvestment: number;
    newThisWeek: number;
    newThisMonth: number;
    totalTracked: number;
    avgSignalScore: number;
    byStage: { name: string; count: number; trend: number | null }[];
  };
  marketIntelligence: {
    sectorMomentum: { name: string; growthRate: number | null; startupCount: number }[];
    stageFunnel: { stage: string; label: string; count: number }[];
    geographic: { name: string; count: number }[];
    monthlyGrowth: { month: string; count: number }[];
    signalScoreDistribution: { range: string; count: number }[];
    mostViewed: { name: string; views: number; uniqueViews: number; sector: string }[];
  };
  engagement: {
    totalViews: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    topSearchTerms: { term: string; count: number }[];
    popularFilters: { filter: string; uses: number }[];
  };
}

type SortKey = 'score' | 'trending' | 'newest';
const SORT_LABELS: Record<SortKey, string> = { score: 'Signal Score', trending: 'Trending', newest: 'Newest' };
const STAGE_OPTIONS = STARTUP_STAGES.filter((s) => s !== 'undisclosed');

export default function InvestorAnalyticsPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ email?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [deals, setDeals] = useState<DealCardData[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Thesis filters
  const [sector, setSector] = useState('all');
  const [stage, setStage] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState<SortKey>('score');

  // --- auth gate ---
  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      const user = data?.user as { email?: string; role?: string } | undefined;
      setSession(user ?? null);
      if (!user) {
        setError('not_authenticated');
        setLoading(false);
        return;
      }
      if (user.role !== 'investor' && user.role !== 'admin') {
        setError('not_investor');
        setLoading(false);
        return;
      }
      fetch('/api/analytics/investor')
        .then((res) => (res.status === 403 ? Promise.reject('access_denied') : res.json()))
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setData(d);
          setLoading(false);
        })
        .catch((err) => {
          setError(typeof err === 'string' ? err : err.message);
          setLoading(false);
        });

      fetch('/api/investor/watchlist')
        .then((r) => r.json())
        .then((d) => {
          if (d.watchlist) {
            setWatchlist(new Set<string>(d.watchlist.map((w: { startupId: string }) => w.startupId)));
          }
        })
        .catch(() => {});
    });
  }, []);

  // --- deal flow (refetches on filter change) ---
  const queryString = useCallback(() => {
    const p = new URLSearchParams();
    if (sector !== 'all') p.set('sector', sector);
    if (stage !== 'all') p.set('stage', stage);
    if (minScore > 0) p.set('minScore', String(minScore));
    p.set('sort', sort);
    return p.toString();
  }, [sector, stage, minScore, sort]);

  useEffect(() => {
    if (!session || (session.role !== 'investor' && session.role !== 'admin')) return;
    setDealsLoading(true);
    fetch(`/api/investor/dealflow?${queryString()}`)
      .then((r) => r.json())
      .then((d) => setDeals(d.items ?? []))
      .catch(() => setDeals([]))
      .finally(() => setDealsLoading(false));
  }, [session, queryString]);

  const addToWatchlist = async (startupId: string) => {
    try {
      const res = await fetch('/api/investor/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId, priority: 'medium' }),
      });
      if (res.ok) setWatchlist((prev) => new Set([...prev, startupId]));
    } catch {}
  };

  const resetFilters = () => {
    setSector('all');
    setStage('all');
    setMinScore(0);
    setSort('score');
  };

  // ---- gates ----
  if (loading) return <Shell><Center>Loading investor intelligence…</Center></Shell>;
  if (error === 'not_authenticated') {
    return (
      <Shell>
        <Gate
          icon={<TrendingUp className="h-8 w-8 text-forest" />}
          title="Investor Access"
          body="Sign in or create an investor account to access deal flow, Signal Scores, and market intelligence."
          actions={
            <>
              <a href="/login?callbackUrl=/investor/analytics" className="btn-outline">Sign in</a>
              <a href="/register" className="btn-primary">Create investor account</a>
            </>
          }
        />
      </Shell>
    );
  }
  if (error === 'not_investor') {
    return (
      <Shell>
        <Gate
          icon={<Building2 className="h-8 w-8 text-amber-600" />}
          title="Investor Verification Required"
          body={`Your account (${session?.email}) is registered as ${session?.role}. Investor intelligence requires verified investor status.`}
          actions={
            <>
              <button onClick={() => router.push('/')} className="btn-outline">Go home</button>
              <a href="/contact?subject=investor-verification" className="btn-primary">Request access</a>
            </>
          }
        />
      </Shell>
    );
  }
  if (error || !data) {
    return (
      <Shell>
        <Center>
          <p className="mb-4 text-red-600">{error || 'Failed to load.'}</p>
          <button onClick={() => window.location.reload()} className="text-forest hover:underline">
            Try again →
          </button>
        </Center>
      </Shell>
    );
  }

  const hasEngagement = data.engagement.totalViews > 0;
  const hasFilter = sector !== 'all' || stage !== 'all' || minScore > 0 || sort !== 'score';
  const exportHref = `/api/investor/dealflow/export?${queryString()}`;

  // Until real investor traffic accrues, fill engagement with deterministic
  // SAMPLE figures so the cockpit isn't empty (clearly tagged "Sample").
  const mockEng = mockEngagementSummary(deals);
  const engUnique = hasEngagement ? data.engagement.uniqueViews : mockEng.uniqueViews;
  const tableDeals: DealCardData[] = hasEngagement
    ? deals
    : deals.map((d) => ({ ...d, engagement: mockDealEngagement(d._id, d.signal.overall) }));
  const eng = hasEngagement
    ? {
        mostViewed: data.marketIntelligence.mostViewed,
        topSearches: data.engagement.topSearchTerms,
        avgTime: data.engagement.avgTimeOnPage,
      }
    : { mostViewed: mockEng.mostViewed, topSearches: mockEng.topSearches, avgTime: mockEng.avgTimeSec };

  // Charts with no real data yet fall back to sample so they don't read empty.
  const realMomentum = data.marketIntelligence.sectorMomentum.filter((s) => s.growthRate != null);
  const momentum = realMomentum.length > 0 ? { rows: realMomentum, sample: false } : { rows: mockSectorMomentum(), sample: true };
  const realGrowthTotal = data.marketIntelligence.monthlyGrowth.reduce((s, m) => s + m.count, 0);
  const growth =
    realGrowthTotal >= 8
      ? { rows: data.marketIntelligence.monthlyGrowth, sample: false }
      : { rows: mockMonthlyGrowth(), sample: true };

  return (
    <div className="min-h-screen bg-paper-deep">
      <Header currentPage="analytics" />

      {/* Hero */}
      <div className="bg-forest text-paper">
        <div className={`${SHELL} py-12`}>
          <span className="rounded bg-paper/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
            Investor Intelligence
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Deal Flow &amp; Signal Intelligence</h1>
          <p className="mt-3 max-w-2xl text-paper/85">
            {data.dealFlow.totalTracked} startups scored on investment signal ·{' '}
            {data.dealFlow.seekingInvestment} actively seeking investment.
          </p>
        </div>
      </div>

      <main className={`${SHELL} py-10 pb-24`}>
        {/* KPI band */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Kpi icon={<Gauge className="h-4 w-4" />} label="Avg Signal Score" value={data.dealFlow.avgSignalScore} sub="Across tracked startups" />
          <Kpi label="Seeking Investment" value={data.dealFlow.seekingInvestment} sub="Active deals" />
          <Kpi label="New This Week" value={data.dealFlow.newThisWeek} sub="Fresh opportunities" />
          <Kpi label="Startups Tracked" value={data.dealFlow.totalTracked} sub="Approved profiles" />
          <Kpi icon={<Eye className="h-4 w-4" />} label="Profile Views" value={engUnique} sub={hasEngagement ? 'Unique, last 30d' : 'Sample · last 30d'} />
        </div>

        {/* Deal flow — primary surface */}
        <Section title="Deal flow" icon={<LayoutList className="h-5 w-5" />} subtitle="Every tracked startup, ranked by investment signal. Filter to your thesis, then save or open a profile.">
          {/* Filter toolbar */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="Sector" value={sector} onChange={setSector}
                options={[{ v: 'all', l: 'All sectors' }, ...data.marketIntelligence.sectorMomentum.map((s) => ({ v: s.name, l: s.name }))]} />
              <FilterSelect label="Stage" value={stage} onChange={setStage}
                options={[{ v: 'all', l: 'All stages' }, ...STAGE_OPTIONS.map((s) => ({ v: s, l: STARTUP_STAGE_LABELS[s] }))]} />
              <FilterSelect label="Sort" value={sort} onChange={(v) => setSort(v as SortKey)}
                options={(['score', 'trending', 'newest'] as SortKey[]).map((s) => ({ v: s, l: SORT_LABELS[s] }))} />
              <label className="inline-flex items-center gap-2 rounded-md border border-rule bg-paper-tint px-3 h-9 text-xs text-ink-muted">
                Min score <span className="font-bold text-ink tabular-nums">{minScore}</span>
                <input type="range" min={0} max={100} step={5} value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value, 10))} className="accent-forest" />
              </label>
              {hasFilter && (
                <button onClick={resetFilters} className="h-9 px-2.5 text-sm text-ink-muted hover:text-ink">Clear</button>
              )}
            </div>
            <a href={exportHref}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-rule bg-paper-tint px-3 text-sm font-medium text-ink-muted hover:text-ink hover:border-ink/30">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </div>

          {/* Count + quick links */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-ink-muted">
              Showing <span className="font-semibold text-ink">{deals.length}</span>{' '}
              {deals.length === 1 ? 'opportunity' : 'opportunities'} · sorted by {SORT_LABELS[sort]}
            </span>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/investor/watchlist" className="inline-flex items-center gap-1.5 font-medium text-ink-muted hover:text-forest">
                <BookmarkCheck className="h-4 w-4" /> Watchlist ({watchlist.size})
              </Link>
              <Link href="/startups" className="inline-flex items-center gap-1.5 font-medium text-forest hover:underline">
                Full directory <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {dealsLoading ? (
            <Empty>Loading opportunities…</Empty>
          ) : deals.length === 0 ? (
            <Empty>No startups match these filters. Try widening your thesis or lowering the minimum score.</Empty>
          ) : (
            <DealflowTable deals={tableDeals} watchlist={watchlist} onWatchlist={addToWatchlist} />
          )}
          {!dealsLoading && deals.length > 0 && !hasEngagement && (
            <p className="mt-3 text-xs text-ink-muted">
              <span className="font-semibold">Sample:</span> demand figures (views, saved, trend) are
              placeholder until live investor traffic accrues. Signal Score, stage and sector are real.
            </p>
          )}
        </Section>

        {/* Market signals — focused charts */}
        <Section title="Market signals" icon={<BarChart3 className="h-5 w-5" />} subtitle="Quality, stage, sector momentum and growth across the tracked ecosystem. Charts tagged “Sample” use placeholder data until real volume builds.">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Signal Score Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.marketIntelligence.signalScoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9d2c1" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#5e584e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#5e584e' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} startups`, 'Count']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.marketIntelligence.signalScoreDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Stage Funnel">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.marketIntelligence.stageFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d9d2c1" />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis dataKey="label" type="category" width={92} tick={{ fontSize: 11, fill: '#5e584e' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} startups`, 'Count']} />
                  <Bar dataKey="count" fill="#1F4F3F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sector Momentum (30-day growth)" tag={momentum.sample ? 'Sample' : undefined}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={momentum.rows} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d9d2c1" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#5e584e' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 11, fill: '#5e584e' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(v, _n, p) => [`${v ?? 0}% growth`, `${p.payload.startupCount} startups`]} cursor={{ fill: '#00000008' }} />
                  <Bar dataKey="growthRate" fill="#C5A028" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Startups Added (12 months)" tag={growth.sample ? 'Sample' : undefined}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={growth.rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9d2c1" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5e584e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#5e584e' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} joined`, 'New']} />
                  <Line type="monotone" dataKey="count" stroke="#1F4F3F" strokeWidth={2.5} dot={{ r: 3, fill: '#1F4F3F' }} activeDot={{ r: 6, fill: '#C5A028' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </Section>

        {/* Engagement — real once traffic accrues, sample until then */}
        <Section
          title="Investor engagement"
          icon={<Eye className="h-5 w-5" />}
          subtitle="What investors are viewing and searching across the platform."
          tag={hasEngagement ? 'Real' : 'Sample'}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-rule bg-paper p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-4 text-base font-semibold text-ink">Most viewed startups</h3>
              <div className="space-y-2.5">
                {eng.mostViewed.length === 0 ? (
                  <Empty>No views yet.</Empty>
                ) : (
                  eng.mostViewed.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-rule bg-paper-tint p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-ink-muted">#{i + 1}</span>
                        <div>
                          <p className="font-medium text-ink">{s.name}</p>
                          <p className="text-xs text-ink-muted capitalize">{s.sector}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                        <Eye className="h-4 w-4 text-ink-muted" /> {s.uniqueViews}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-xl border border-rule bg-paper p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-ink">Top searches</h3>
              {eng.topSearches.length === 0 ? (
                <Empty>No searches yet.</Empty>
              ) : (
                <div className="space-y-2.5">
                  {eng.topSearches.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="capitalize text-ink">{t.term}</span>
                      <span className="rounded bg-paper-tint px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-muted">{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
              <h3 className="mb-2 mt-6 text-base font-semibold text-ink">Avg time on profile</h3>
              <p className="text-2xl font-bold tabular-nums text-ink">{eng.avgTime}s</p>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #d9d2c1',
  borderRadius: '8px',
  fontSize: '12px',
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="flex items-center justify-center px-6">{children}</main>
      <Footer />
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex h-[60vh] flex-col items-center justify-center text-center text-ink-muted">{children}</div>;
}

function Gate({
  icon,
  title,
  body,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="max-w-md px-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">{icon}</div>
        <h2 className="mb-3 text-2xl font-bold text-ink">{title}</h2>
        <p className="mb-6 text-ink-muted">{body}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row [&_.btn-outline]:inline-flex [&_.btn-outline]:h-11 [&_.btn-outline]:items-center [&_.btn-outline]:justify-center [&_.btn-outline]:rounded-lg [&_.btn-outline]:border [&_.btn-outline]:border-rule [&_.btn-outline]:px-6 [&_.btn-outline]:font-medium [&_.btn-outline]:text-ink [&_.btn-primary]:inline-flex [&_.btn-primary]:h-11 [&_.btn-primary]:items-center [&_.btn-primary]:justify-center [&_.btn-primary]:rounded-lg [&_.btn-primary]:bg-forest [&_.btn-primary]:px-6 [&_.btn-primary]:font-medium [&_.btn-primary]:text-paper">
          {actions}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  subtitle,
  tag,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  tag?: 'Real' | 'Sample';
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-forest/10 p-2 text-forest">{icon}</div>
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          {tag && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                tag === 'Real'
                  ? 'border-forest/25 bg-forest/10 text-forest-soft'
                  : 'border-gold/40 bg-gold-faint text-ink-muted'
              }`}
            >
              {tag}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Kpi({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-forest">{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

function ChartCard({ title, tag, children }: { title: string; tag?: 'Real' | 'Sample'; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {tag && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              tag === 'Real' ? 'border-forest/25 bg-forest/10 text-forest-soft' : 'border-gold/40 bg-gold-faint text-ink-muted'
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-rule bg-paper-tint px-6 py-8 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-rule bg-paper-tint pl-3 pr-1 h-9 text-xs font-medium text-ink-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full rounded-md bg-transparent pr-1 text-xs font-semibold text-ink focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}
