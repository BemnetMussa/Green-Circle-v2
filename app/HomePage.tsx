'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { StatsSection } from '@/components/stats-section';
import { FeaturedStartups } from '@/components/featured-startups';
import { TrustSection } from '@/components/trust-section';
import { PulseTeaser } from '@/components/pulse-teaser';
import { authClient } from '@/lib/auth-client';
import { BetterAuthSession, Startup } from '@/types';
import AdminDashboard from './admin/adminDash';
import { filterStartup } from '@/lib/call-api/call-api';
import { HERO_FOUNDER_SLIDES } from '@/lib/hero-founders';

export default function HomePage() {
  const [data, setData] = useState<Startup[]>([]);
  const [session, setSession] = useState<BetterAuthSession | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sessionResult, startups] = await Promise.all([
          authClient.getSession(),
          filterStartup().catch(() => [] as Startup[]),
        ]);
        if (cancelled) return;
        if (sessionResult.error) {
          setSession(null);
        } else {
          setSession((sessionResult.data?.user as BetterAuthSession) ?? null);
        }
        setData(Array.isArray(startups) ? startups : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!cancelled) {
          setSession(null);
          setData([]);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const sectors = new Set(
      data
        .map((s) => s.sector)
        .filter((sector): sector is string => Boolean(sector)),
    );

    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const addedThisMonth = data.filter((s) => {
      const created = (s as unknown as { createdAt?: string | Date }).createdAt;
      if (!created) return false;
      const ts = new Date(created).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    }).length;

    return {
      startups: data.length,
      sectors: sectors.size,
      addedThisMonth,
    };
  }, [data]);

  const heroFeaturedSlides = useMemo(() => {
    if (process.env.NEXT_PUBLIC_HERO_HIDE_PLACEHOLDER === '1') {
      return undefined;
    }
    return HERO_FOUNDER_SLIDES;
  }, []);

  if (!booting && session?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection
          stats={booting ? undefined : stats}
          statsPending={booting}
          featuredSlides={heroFeaturedSlides}
        />

        <StatsSection
          startupCount={booting ? undefined : stats.startups}
          sectorCount={booting ? undefined : stats.sectors}
        />

        <FeaturedStartups startups={data} loading={booting} />

        <TrustSection />

        <PulseTeaser />
      </main>
      <Footer />
    </div>
  );
}
