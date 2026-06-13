'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ArrowRight, LayoutList, BarChart3 } from 'lucide-react';
import { CompanyTable } from '@/components/analytics/company-table';

interface AnalyticsData {
  overview: {
    totalStartups: number;
    totalSectors: number;
    avgTeamSize: number;
    seekingInvestment: number;
  };
  sectors: { name: string; count: number }[];
  stages: { name: string; count: number; percentage: number }[];
  locations: { name: string; count: number }[];
  monthlyGrowth: { month: string; count: number }[];
  foundingYears: { year: string; count: number }[];
  teamSizeDistribution: { size: string; count: number }[];
  stageVelocity: { from: string; to: string; count: number }[];
}

const COLORS = ['#1F4F3F', '#C5A028', '#2D5A4A', '#D4B84A', '#3A7A5F', '#E8D070', '#4A9A7A', '#F5E5A0'];

const SHELL = 'mx-auto w-full max-w-[112rem] px-5 sm:px-8 lg:px-10';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'companies' | 'stats'>('companies');

  useEffect(() => {
    fetch('/api/analytics/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalStartups = data?.overview.totalStartups;
  const totalSectors = data?.overview.totalSectors;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header />

      <main className="flex-1 pb-24">
        {/* Header band */}
        <div className="bg-paper-deep border-b border-rule">
          <div className={`${SHELL} py-10`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-forest">
                  Ecosystem Intelligence
                </span>
                <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
                  Ethiopian Startup Landscape
                </h1>
                <p className="mt-3 text-base text-ink-muted max-w-2xl">
                  {totalStartups != null && totalSectors != null
                    ? `Tracking ${totalStartups} startups across ${totalSectors} sectors — the innovation economy in Ethiopia.`
                    : 'Tracking the innovation economy in Ethiopia.'}
                </p>
              </div>

              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>
        </div>

        {view === 'companies' ? (
          <div className={`${SHELL} py-8`}>
            <CompanyTable />
          </div>
        ) : (
          <div className={`${SHELL} py-10`}>
            <StatsView data={data} loading={loading} error={error} />
          </div>
        )}

        {/* CTA */}
        <div className={`${SHELL}`}>
          <div className="mt-12 text-center py-12 border-t border-rule">
            <h3 className="text-xl font-semibold text-ink mb-3">Looking for deeper insights?</h3>
            <p className="text-ink-muted mb-6 max-w-lg mx-auto">
              Investors get access to deal flow metrics, founder demographics, and downloadable reports.
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-forest text-paper font-medium hover:bg-forest-soft transition-colors"
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

function ViewToggle({
  view,
  onChange,
}: {
  view: 'companies' | 'stats';
  onChange: (v: 'companies' | 'stats') => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Analytics view"
      className="inline-flex self-start rounded-lg border border-rule bg-paper p-0.5"
    >
      <ToggleBtn
        active={view === 'companies'}
        onClick={() => onChange('companies')}
        icon={<LayoutList className="h-4 w-4" strokeWidth={1.5} />}
        label="Companies"
      />
      <ToggleBtn
        active={view === 'stats'}
        onClick={() => onChange('stats')}
        icon={<BarChart3 className="h-4 w-4" strokeWidth={1.5} />}
        label="Stats"
      />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-9 px-4 inline-flex items-center gap-2 rounded-[0.45rem] text-sm font-medium transition-colors ${
        active ? 'bg-forest text-paper shadow-sm' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatsView({
  data,
  loading,
  error,
}: {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <div className="py-20 text-center text-ink-muted animate-pulse">Loading stats…</div>;
  }
  if (error || !data) {
    return <div className="py-20 text-center text-red-600">Failed to load stats. Please try again.</div>;
  }

  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Startups" value={data.overview.totalStartups} sublabel="In directory" />
        <StatCard label="Sectors Covered" value={data.overview.totalSectors} sublabel="Industries" />
        <StatCard label="Avg Team Size" value={data.overview.avgTeamSize} sublabel="Founders + employees" />
        <StatCard
          label="Seeking Investment"
          value={data.overview.seekingInvestment}
          sublabel="Active deals"
          highlight
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Startups by Sector">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.sectors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#1F4F3F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Funding Stage">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.stages} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count">
                {data.stages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value, name, props) => {
                  const percentage = props?.payload?.percentage || 0;
                  return [`${value} (${percentage}%)`, 'Startups'];
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Startups Added (12 Months)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1F4F3F"
                strokeWidth={2}
                dot={{ fill: '#1F4F3F', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#C5A028' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Startups by Location">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.locations}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#C5A028" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Team Size Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.teamSizeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                {data.teamSizeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {data.teamSizeDistribution.map((item, i) => (
              <span key={i} className="text-xs text-ink-muted flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {item.size} ({item.count})
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Funding Stage Progression">
          <div className="space-y-4 h-[250px] flex flex-col justify-center">
            {data.stageVelocity.length === 0 ? (
              <p className="text-sm text-ink-muted text-center">
                Stage-progression data appears once startups record funding history.
              </p>
            ) : (
              data.stageVelocity.map((stage, i) => (
                <div key={i} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink capitalize">{stage.from.replace('-', ' ')}</span>
                    <span className="text-sm text-forest font-medium">{stage.count} startups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-rule rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stage.count / 20) * 100, 100)}%` }}
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-faint" />
                    <span className="text-xs text-ink-muted capitalize whitespace-nowrap">{stage.to.replace('-', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartCard>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  highlight = false,
}: {
  label: string;
  value: number;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-5 rounded-xl border ${highlight ? 'bg-forest/5 border-forest/20' : 'bg-paper border-rule'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">{label}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-forest' : 'text-ink'}`}>{value}</p>
      <p className="text-xs text-ink-muted mt-1">{sublabel}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper rounded-xl border border-rule p-6">
      <h3 className="text-sm font-semibold text-ink mb-6">{title}</h3>
      {children}
    </div>
  );
}
