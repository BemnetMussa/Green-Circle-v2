'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { authClient } from '@/lib/auth-client';
import { STARTUP_STAGES, STARTUP_STAGE_LABELS } from '@/lib/startup-stage';
import { DealCard, type DealCardData } from '@/components/investor/deal-card';
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
  Sparkles,
  Flame,
  Gauge,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';

const COLORS = ['#1F4F3F', '#C5A028', '#2D5A4A', '#D4B84A', '#3A7A5F', '#E8D070'];

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

const STAGE_OPTIONS = STARTUP_STAGES.filter((s) => s !== 'undisclosed');

export default function InvestorAnalyticsPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ email?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [deals, setDeals] = useState<DealCardData[]>([]);
  const [trending, setTrending] = useState<DealCardData[]>([]);
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

      // Trending rail (separate sort) + watchlist
      fetch('/api/investor/dealflow?sort=trending&limit=6')
        .then((r) => r.json())
        .then((d) => setTrending(d.items ?? []))
        .catch(() => {});
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
  const exportHref = `/api/investor/dealflow/export?${queryString()}`;

  return (
    <div className="min-h-screen bg-paper">
      <Header currentPage="analytics" />

      {/* Hero */}
      <div className="bg-forest text-paper">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <span className="rounded bg-paper/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
            Investor Intelligence
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Deal Flow &amp; Signal Intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-paper/80">
            {data.dealFlow.totalTracked} startups scored on investment signal ·{' '}
            {data.dealFlow.seekingInvestment} actively seeking investment.
          </p>
          <a
            href={exportHref}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-paper px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-paper/90"
          >
            <Download className="h-4 w-4" /> Export deal flow (CSV)
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-12 pb-24 sm:px-8">
        {/* KPI band */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Kpi icon={<Gauge className="h-4 w-4" />} label="Avg Signal Score" value={data.dealFlow.avgSignalScore} sub="Across tracked startups" />
          <Kpi label="Seeking Investment" value={data.dealFlow.seekingInvestment} sub="Active deals" />
          <Kpi label="New This Week" value={data.dealFlow.newThisWeek} sub="Fresh opportunities" />
          <Kpi label="Startups Tracked" value={data.dealFlow.totalTracked} sub="Approved profiles" />
          <Kpi icon={<Eye className="h-4 w-4" />} label="Profile Views" value={hasEngagement ? data.engagement.uniqueViews : '—'} sub={hasEngagement ? 'Unique, last 30d' : 'Accruing'} />
        </div>

        {/* Trending now */}
        <Section title="Trending Now" icon={<Flame className="h-5 w-5" />}>
          {!hasEngagement && (
            <p className="-mt-3 mb-4 text-xs text-ink-muted">
              Ranked by investment potential until viewing activity builds up.
            </p>
          )}
          {trending.length === 0 ? (
            <Empty>No startups to rank yet.</Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trending.slice(0, 6).map((d) => (
                <DealCard key={d._id} deal={d} watchlisted={watchlist.has(d._id)} onWatchlist={addToWatchlist} />
              ))}
            </div>
          )}
        </Section>

        {/* Top opportunities + thesis filters */}
        <Section title="Top Opportunities" icon={<Sparkles className="h-5 w-5" />}>
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-paper-deep p-3">
            <FilterSelect label="Sector" value={sector} onChange={setSector}
              options={[{ v: 'all', l: 'All sectors' }, ...data.marketIntelligence.sectorMomentum.map((s) => ({ v: s.name, l: s.name }))]} />
            <FilterSelect label="Stage" value={stage} onChange={setStage}
              options={[{ v: 'all', l: 'All stages' }, ...STAGE_OPTIONS.map((s) => ({ v: s, l: STARTUP_STAGE_LABELS[s] }))]} />
            <FilterSelect label="Sort" value={sort} onChange={(v) => setSort(v as SortKey)}
              options={[{ v: 'score', l: 'Signal Score' }, { v: 'trending', l: 'Trending' }, { v: 'newest', l: 'Newest' }]} />
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              Min score: <span className="font-semibold text-ink">{minScore}</span>
              <input type="range" min={0} max={100} step={5} value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))} className="accent-forest" />
            </label>
          </div>

          {dealsLoading ? (
            <Empty>Loading opportunities…</Empty>
          ) : deals.length === 0 ? (
            <Empty>No startups match these filters.</Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deals.map((d) => (
                <DealCard key={d._id} deal={d} watchlisted={watchlist.has(d._id)} onWatchlist={addToWatchlist} />
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <Link href="/startups" className="inline-flex items-center gap-2 font-medium text-forest hover:underline">
              Browse full directory <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/investor/watchlist" className="inline-flex items-center gap-2 font-medium text-ink-muted hover:text-forest">
              <BookmarkCheck className="h-4 w-4" /> Your watchlist ({watchlist.size})
            </Link>
          </div>
        </Section>

        {/* Market intelligence */}
        <Section title="Market Intelligence" icon={<Building2 className="h-5 w-5" />}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ChartCard title="Signal Score Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.marketIntelligence.signalScoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} allowDecimals={false} />
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
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.marketIntelligence.stageFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis dataKey="label" type="category" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} startups`, 'Count']} />
                  <Bar dataKey="count" fill="#1F4F3F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sector Momentum (30-day growth)">
              {data.marketIntelligence.sectorMomentum.length === 0 ? (
                <Empty>No sectors yet.</Empty>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.marketIntelligence.sectorMomentum} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle}
                      formatter={(v, _n, p) => [`${v ?? 0}% growth`, `${p.payload.startupCount} startups`]} />
                    <Bar dataKey="growthRate" fill="#C5A028" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Startup Growth (12 months)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.marketIntelligence.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} joined`, 'New']} />
                  <Line type="monotone" dataKey="count" stroke="#1F4F3F" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Geographic */}
          <div className="mt-8">
            <ChartCard title="Geographic Distribution">
              {data.marketIntelligence.geographic.length === 0 ? (
                <Empty>No locations yet.</Empty>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.marketIntelligence.geographic}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} startups`, 'Count']} />
                    <Bar dataKey="count" fill="#2D5A4A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </Section>

        {/* Engagement — real, with honest empty states */}
        <Section title="Investor Engagement" icon={<Eye className="h-5 w-5" />}>
          {!hasEngagement ? (
            <Empty>
              Engagement insights — top searches, most-viewed startups, dwell time — unlock
              automatically as investors browse the platform. No activity recorded yet.
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-rule bg-paper p-6 lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-ink">Most Viewed (7 days)</h3>
                <div className="space-y-3">
                  {data.marketIntelligence.mostViewed.length === 0 ? (
                    <Empty>No views yet this week.</Empty>
                  ) : (
                    data.marketIntelligence.mostViewed.map((s, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-rule/50 bg-paper-deep p-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-ink-faint">#{i + 1}</span>
                          <div>
                            <p className="font-medium text-ink">{s.name}</p>
                            <p className="text-xs text-ink-muted">{s.sector}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
                          <Eye className="h-4 w-4" /> {s.uniqueViews}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-rule bg-paper p-6">
                <h3 className="mb-4 text-sm font-semibold text-ink">Top Searches</h3>
                {data.engagement.topSearchTerms.length === 0 ? (
                  <Empty>No searches yet.</Empty>
                ) : (
                  <div className="space-y-2">
                    {data.engagement.topSearchTerms.map((t, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-ink">{t.term}</span>
                        <span className="text-xs text-ink-muted">{t.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <h3 className="mb-3 mt-6 text-sm font-semibold text-ink">Avg Time on Profile</h3>
                <p className="text-2xl font-bold text-ink">{data.engagement.avgTimeOnPage}s</p>
              </div>
            </div>
          )}
        </Section>
      </main>

      <Footer />
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #E5E5E5',
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

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-forest/10 p-2 text-forest">{icon}</div>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Kpi({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-5">
      <div className="mb-1 flex items-center gap-1.5 text-ink-faint">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-6">
      <h3 className="mb-4 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-rule bg-paper-deep/40 px-6 py-8 text-center text-sm text-ink-muted">
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
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      {label}:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-rule bg-paper px-2 py-1.5 text-xs font-medium text-ink focus:border-forest focus:outline-none"
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
