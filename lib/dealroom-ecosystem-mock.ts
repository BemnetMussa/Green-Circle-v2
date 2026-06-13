// ⚠️ MOCK — ecosystem-level Dealroom dashboard figures.
// Aggregated from the SAME per-company sample data (lib/dealroom-mock) so the
// dashboard totals and the companies table tell one consistent story (total
// funding = sum of the table's funding column, etc.). The investor list uses
// REAL Ethiopian ecosystem firm names with SAMPLE round counts.
//
// NOT real data — replace with the funding/investor backend before investor
// launch (Green Circle's #1 rule). Delete this file when that lands.
import type { PublicCompany } from '@/app/api/analytics/companies/route';
import { dealroomMock, fmtAmount } from '@/lib/dealroom-mock';

export interface EcosystemMock {
  totalFundingUsd: number;
  totalRounds: number;
  fundingByYear: { year: string; early: number; breakout: number; scaleup: number }[];
  topSectorsByFunding: { sector: string; fundingUsd: number; fundingLabel: string; count: number }[];
  notableRounds: { name: string; sector?: string; amount: string; type: string; date: string }[];
  activeInvestors: { name: string; rounds: number; focus: string }[];
  investorCount: number;
}

// Real Ethiopian / pan-African ecosystem investors (Business Plan, Appendix B).
// Round counts are SAMPLE values for layout preview only.
const MOCK_VCS: { name: string; rounds: number; focus: string }[] = [
  { name: 'Renew Capital', rounds: 11, focus: 'Pan-African growth' },
  { name: 'Addis Ababa Angels Network', rounds: 9, focus: 'Angel · pre-seed' },
  { name: 'TLcom Capital', rounds: 7, focus: 'Series A+' },
  { name: 'Novastar Ventures', rounds: 6, focus: 'Seed–Series B' },
  { name: 'Cepheus Growth Capital', rounds: 5, focus: 'Private equity' },
  { name: 'Norrsken22', rounds: 4, focus: 'Growth' },
  { name: 'Ventures Platform', rounds: 4, focus: 'Pre-seed–Seed' },
  { name: '54 Collective', rounds: 3, focus: 'Seed' },
];

function band(roundUsd: number): 'early' | 'breakout' | 'scaleup' {
  if (roundUsd >= 100_000_000) return 'scaleup';
  if (roundUsd >= 15_000_000) return 'breakout';
  return 'early';
}

export function buildEcosystemMock(companies: PublicCompany[]): EcosystemMock {
  const rows = companies.map((c) => ({ c, m: dealroomMock(c) }));

  const totalFundingUsd = rows.reduce((s, { m }) => s + m.fundingUsd, 0);
  const funded = rows.filter(({ m }) => m.lastRoundUsd > 0);
  const totalRounds = funded.length;

  // Funding raised by year, split into Dealroom-style stage bands ($m).
  const yearMap = new Map<number, { early: number; breakout: number; scaleup: number }>();
  for (const { m } of funded) {
    const e = yearMap.get(m.lastRoundYear) ?? { early: 0, breakout: 0, scaleup: 0 };
    e[band(m.lastRoundUsd)] += m.lastRoundUsd;
    yearMap.set(m.lastRoundYear, e);
  }
  const fundingByYear = [...yearMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, b]) => ({
      year: String(year),
      early: Math.round((b.early / 1e6) * 10) / 10,
      breakout: Math.round((b.breakout / 1e6) * 10) / 10,
      scaleup: Math.round((b.scaleup / 1e6) * 10) / 10,
    }));

  // Top sectors by total funding (real sector + count, mock funding).
  const secMap = new Map<string, { fundingUsd: number; count: number }>();
  for (const { c, m } of rows) {
    const s = c.sector || 'Other';
    const e = secMap.get(s) ?? { fundingUsd: 0, count: 0 };
    e.fundingUsd += m.fundingUsd;
    e.count += 1;
    secMap.set(s, e);
  }
  const topSectorsByFunding = [...secMap.entries()]
    .map(([sector, v]) => ({
      sector,
      fundingUsd: v.fundingUsd,
      fundingLabel: fmtAmount(v.fundingUsd),
      count: v.count,
    }))
    .sort((a, b) => b.fundingUsd - a.fundingUsd)
    .slice(0, 6);

  // Notable rounds — largest sample rounds.
  const notableRounds = funded
    .slice()
    .sort((a, b) => b.m.lastRoundUsd - a.m.lastRoundUsd)
    .slice(0, 6)
    .map(({ c, m }) => ({
      name: c.name,
      sector: c.sector,
      amount: fmtAmount(m.lastRoundUsd),
      type: m.lastRoundType,
      date: m.lastRoundDate,
    }));

  return {
    totalFundingUsd,
    totalRounds,
    fundingByYear,
    topSectorsByFunding,
    notableRounds,
    activeInvestors: MOCK_VCS,
    investorCount: MOCK_VCS.length,
  };
}
