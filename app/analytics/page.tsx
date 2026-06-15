'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { LayoutList, BarChart3 } from 'lucide-react';
import { CompanyTable } from '@/components/analytics/company-table';
import { EcosystemDashboard, type EcosystemData } from '@/components/analytics/ecosystem-dashboard';

const SHELL = 'mx-auto w-full max-w-[112rem] px-5 sm:px-8 lg:px-10';

export default function AnalyticsPage() {
  const [data, setData] = useState<EcosystemData | null>(null);
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

      <main className="flex-1">
        {/* Header band */}
        <div className="bg-paper-tint border-b border-rule">
          <div className={`${SHELL} py-10`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-forest-soft">
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

        <div className="bg-paper-deep border-b border-rule">
          <div className={`${SHELL} ${view === 'companies' ? 'py-8 pb-24' : 'py-10 pb-20'}`}>
            {view === 'companies' ? (
              <CompanyTable />
            ) : (
              <StatsView data={data} loading={loading} error={error} />
            )}
          </div>
        </div>

        {/* CTA */}
        <div className={`${SHELL}`}>
          <div className="my-12 text-center py-12 border-t border-rule">
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
  data: EcosystemData | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <div className="py-20 text-center text-ink-muted animate-pulse">Loading ecosystem…</div>;
  }
  if (error || !data) {
    return <div className="py-20 text-center text-red-600">Failed to load stats. Please try again.</div>;
  }
  return <EcosystemDashboard data={data} />;
}
