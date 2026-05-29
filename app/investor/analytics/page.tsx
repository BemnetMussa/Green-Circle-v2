'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { authClient } from '@/lib/auth-client';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, TrendingUp, Eye, Users, Building2, ArrowRight, Sparkles, BookmarkPlus, BookmarkCheck, Filter } from 'lucide-react';

interface InvestorAnalytics {
  dealFlow: {
    seekingInvestment: number;
    byStage: { name: string; count: number; trend: number }[];
    newThisWeek: number;
    newThisMonth: number;
  };
  marketIntelligence: {
    mostViewed: { name: string; views: number; sector: string }[];
    sectorMomentum: { name: string; growthRate: number; startupCount: number }[];
    stageVelocity: { from: string; to: string; avgMonths: number }[];
  };
  engagement: {
    totalViews: number;
    avgTimeOnPage: number;
    topSearchTerms: { term: string; count: number }[];
    popularFilters: { filter: string; uses: number }[];
  };
  founderDemographics: {
    teamSizeDistribution: { size: string; count: number }[];
    experienceBreakdown: { years: string; count: number }[];
    repeatFounders: number;
    firstTimeFounders: number;
  };
}

interface Startup {
  _id: string;
  name: string;
  sector: string;
  stage: string;
  location: string;
  logo: string;
  description: string;
  profileScore: number;
  isNew: boolean;
  createdAt: string;
  founders: { name: string; role: string }[];
}

const COLORS = ['#1F4F3F', '#C5A028', '#2D5A4A', '#D4B84A', '#3A7A5F', '#E8D070'];

export default function InvestorAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<InvestorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  
  // Discovery feed state
  const [discoveryStartups, setDiscoveryStartups] = useState<Startup[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryFilter, setDiscoveryFilter] = useState('week');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check auth and role
    authClient.getSession().then(({ data }) => {
      const user = data?.user;
      setSession(user);
      
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
      
      // Load analytics data
      fetch('/api/analytics/investor')
        .then(res => {
          if (res.status === 403) {
            setError('access_denied');
            setLoading(false);
            return;
          }
          return res.json();
        })
        .then(data => {
          if (!data) return; // 403 case already handled
          if (data.error) throw new Error(data.error);
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    });
  }, [router]);

  // Load discovery feed data
  useEffect(() => {
    if (!session || (session.role !== 'investor' && session.role !== 'admin')) return;
    
    setDiscoveryLoading(true);
    
    // Load discovery startups
    fetch(`/api/startups/discover?since=${discoveryFilter}&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (data.startups) {
          setDiscoveryStartups(data.startups);
        }
        setDiscoveryLoading(false);
      })
      .catch(() => setDiscoveryLoading(false));
    
    // Load watchlist
    fetch('/api/investor/watchlist')
      .then(res => res.json())
      .then(data => {
        if (data.watchlist) {
          const ids = new Set<string>(data.watchlist.map((w: any) => w.startupId as string));
          setWatchlist(ids);
        }
      })
      .catch(() => {});
  }, [session, discoveryFilter]);

  const addToWatchlist = async (startupId: string) => {
    try {
      const res = await fetch('/api/investor/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId, priority: 'medium' }),
      });
      if (res.ok) {
        setWatchlist(prev => new Set([...prev, startupId]));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-ink-muted">Loading investor insights...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error === 'not_authenticated') {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-forest/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-forest" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-3">Investor Access</h2>
            <p className="text-ink-muted mb-6">
              Sign in or create an investor account to access deal flow metrics, 
              founder demographics, and exclusive market intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a 
                href="/login?callbackUrl=/investor/analytics"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-rule text-ink font-medium hover:bg-paper-deep transition-colors"
              >
                Sign in
              </a>
              <a 
                href="/register"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-forest text-paper font-medium hover:bg-forest-soft transition-colors"
              >
                Create investor account
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error === 'not_investor') {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-3">Investor Verification Required</h2>
            <p className="text-ink-muted mb-6">
              Your current account ({session?.email}) is registered as a <strong>{session?.role}</strong>. 
              Investor analytics require verified investor status.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-rule text-ink font-medium hover:bg-paper-deep transition-colors"
              >
                Go to Dashboard
              </button>
              <a 
                href="/contact?subject=investor-verification"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-forest text-paper font-medium hover:bg-forest-soft transition-colors"
              >
                Request investor access
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error === 'access_denied') {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-3">Access Denied</h2>
            <p className="text-ink-muted mb-6">
              You do not have permission to access this page. Please contact support for assistance.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && error !== 'not_authenticated' && error !== 'not_investor' && error !== 'access_denied') {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-forest hover:underline"
            >
              Try again →
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-paper">
      <Header currentPage="analytics" />
      
      <main className="pb-24">
        {/* Hero */}
        <div className="bg-forest text-paper">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded bg-paper/20 text-[10px] font-semibold uppercase tracking-wider">
                Investor Intelligence
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Deal Flow & Market Intelligence
            </h1>
            <p className="mt-3 text-paper/80 max-w-2xl">
              Exclusive insights on {data.dealFlow.seekingInvestment} startups actively 
              seeking investment. Updated weekly.
            </p>
            
            <div className="mt-6 flex gap-4">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-paper text-forest text-sm font-medium hover:bg-paper/90 transition-colors">
                <Download className="h-4 w-4" />
                Export report (CSV)
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          {/* Discovery Feed - New Startups */}
          <Section title="Discovery Feed" icon={<Sparkles className="h-5 w-5" />}>
            <div className="mb-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 p-1 rounded-lg bg-paper-deep border border-rule">
                <Filter className="w-4 h-4 text-ink-muted ml-2" />
                {['week', 'month', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDiscoveryFilter(filter)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      discoveryFilter === filter
                        ? 'bg-forest text-paper'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {filter === 'week' && 'This Week'}
                    {filter === 'month' && 'This Month'}
                    {filter === 'all' && 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {discoveryLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-pulse text-ink-muted">Loading opportunities...</div>
              </div>
            ) : discoveryStartups.length === 0 ? (
              <div className="text-center py-12 text-ink-muted">
                No new startups found for this period
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveryStartups.map((startup) => (
                  <div
                    key={startup._id}
                    className="group p-5 rounded-xl border border-rule bg-paper hover:border-forest/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center text-forest font-bold text-sm">
                          {startup.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-ink text-sm">{startup.name}</h3>
                          <p className="text-xs text-ink-muted">{startup.sector || 'Technology'}</p>
                        </div>
                      </div>
                      {startup.isNew && (
                        <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-medium">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-ink-muted mb-3 line-clamp-2">
                      {startup.description || 'No description available'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <span className="px-2 py-1 rounded bg-paper-deep border border-rule">
                          {startup.stage || 'Early Stage'}
                        </span>
                        <span>{startup.location?.split(',')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          startup.profileScore >= 70 ? 'bg-green-500' :
                          startup.profileScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs font-medium">{startup.profileScore}%</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/startups/${startup._id}`}
                        className="flex-1 h-9 flex items-center justify-center rounded-lg bg-paper-deep border border-rule text-sm font-medium text-ink hover:bg-paper transition-colors"
                      >
                        View Profile
                      </a>
                      <button
                        onClick={() => addToWatchlist(startup._id)}
                        className={`h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          watchlist.has(startup._id)
                            ? 'bg-forest/10 border-forest text-forest'
                            : 'bg-paper-deep border-rule text-ink-muted hover:text-forest'
                        }`}
                        disabled={watchlist.has(startup._id)}
                      >
                        {watchlist.has(startup._id) ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <BookmarkPlus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-6">
              <a
                href="/startups"
                className="inline-flex items-center gap-2 text-forest hover:underline text-sm font-medium"
              >
                View all startups
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/investor/watchlist"
                className="inline-flex items-center gap-2 text-ink-muted hover:text-forest text-sm font-medium"
              >
                <BookmarkCheck className="w-4 h-4" />
                Your watchlist ({watchlist.size})
              </a>
            </div>
          </Section>

          {/* Deal Flow Overview */}
          <Section title="Active Deal Flow" icon={<TrendingUp className="h-5 w-5" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard 
                label="Seeking Investment" 
                value={data.dealFlow.seekingInvestment}
                sublabel="Active deals"
              />
              <StatCard 
                label="New This Week" 
                value={data.dealFlow.newThisWeek}
                sublabel="Fresh opportunities"
                trend="up"
              />
              <StatCard 
                label="New This Month" 
                value={data.dealFlow.newThisMonth}
                sublabel="Monthly pipeline"
              />
              <StatCard 
                label="Avg Response Time" 
                value="48h"
                sublabel="Founder reply rate"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartCard title="Deals by Stage">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.dealFlow.byStage}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value, name, props) => [`${value} deals`, `Trend: ${props.payload.trend > 0 ? '+' : ''}${props.payload.trend}%` ]}
                    />
                    <Bar dataKey="count" fill="#1F4F3F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Sector Momentum (Growth Rate)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.marketIntelligence.sectorMomentum} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value, name, props) => [`${value}% growth`, `${props.payload.startupCount} startups`]}
                    />
                    <Bar dataKey="growthRate" fill="#C5A028" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </Section>

          {/* Market Intelligence */}
          <Section title="Market Intelligence" icon={<Building2 className="h-5 w-5" />}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Most Viewed Startups */}
              <div className="lg:col-span-2 bg-paper rounded-xl border border-rule p-6">
                <h3 className="text-sm font-semibold text-ink mb-4">Most Viewed This Week</h3>
                <div className="space-y-3">
                  {data.marketIntelligence.mostViewed.map((startup, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-paper-deep border border-rule/50">
                      <div className="flex items-center gap-3">
                        <span className="text-ink-faint font-mono text-sm">#{i + 1}</span>
                        <div>
                          <p className="font-medium text-ink">{startup.name}</p>
                          <p className="text-xs text-ink-muted">{startup.sector}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-ink-muted text-sm">
                        <Eye className="h-4 w-4" />
                        {startup.views.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Trends */}
              <div className="bg-paper rounded-xl border border-rule p-6">
                <h3 className="text-sm font-semibold text-ink mb-4">Top Search Terms</h3>
                <div className="space-y-3">
                  {data.engagement.topSearchTerms.map((term, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-ink">{term.term}</span>
                      <span className="text-xs text-ink-muted">{term.count} searches</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-semibold text-ink mb-4 mt-8">Popular Filters</h3>
                <div className="space-y-3">
                  {data.engagement.popularFilters.map((filter, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-ink">{filter.filter}</span>
                      <span className="text-xs text-ink-muted">{filter.uses} uses</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Founder Demographics */}
          <Section title="Founder Demographics" icon={<Users className="h-5 w-5" />}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <ChartCard title="Team Size Distribution">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.founderDemographics.teamSizeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {data.founderDemographics.teamSizeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {data.founderDemographics.teamSizeDistribution.map((item, i) => (
                    <span key={i} className="text-xs text-ink-muted flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {item.size}
                    </span>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Founder Experience">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.founderDemographics.experienceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="years" tick={{ fontSize: 10 }} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#1F4F3F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="bg-paper rounded-xl border border-rule p-6 flex flex-col justify-center">
                <h3 className="text-sm font-semibold text-ink mb-6">Founder Type</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-paper-deep border border-rule/50">
                    <span className="text-sm text-ink">Repeat Founders</span>
                    <span className="font-semibold text-forest">{data.founderDemographics.repeatFounders}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-paper-deep border border-rule/50">
                    <span className="text-sm text-ink">First-time Founders</span>
                    <span className="font-semibold text-forest">{data.founderDemographics.firstTimeFounders}</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Engagement Metrics */}
          <Section title="Platform Engagement" icon={<Eye className="h-5 w-5" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard 
                label="Total Profile Views" 
                value={data.engagement.totalViews.toLocaleString()}
                sublabel="Last 30 days"
              />
              <StatCard 
                label="Avg Time on Page" 
                value={`${data.engagement.avgTimeOnPage}s`}
                sublabel="Startup profiles"
              />
              <StatCard 
                label="Connection Requests" 
                value="--"
                sublabel="Coming soon"
              />
            </div>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-forest/10 text-forest">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, sublabel, trend }: { label: string; value: string | number; sublabel: string; trend?: 'up' | 'down' }) {
  return (
    <div className="p-5 rounded-xl border border-rule bg-paper">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-ink">{value}</p>
        {trend && (
          <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className="text-xs text-ink-muted mt-1">{sublabel}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper rounded-xl border border-rule p-6">
      <h3 className="text-sm font-semibold text-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}
