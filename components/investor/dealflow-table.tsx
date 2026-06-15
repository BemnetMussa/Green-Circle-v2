'use client';

// Ranked deal-flow table — the primary investor surface (Crunchbase/Dealroom
// style): one scannable list of opportunities with Signal Score, stage, demand
// signals, an expandable "why this score", and per-row watchlist + view actions.
import { Fragment, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  BookmarkPlus,
  BookmarkCheck,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { bandColor } from './signal-score-ring';
import { SignalBreakdownBars } from './signal-breakdown';
import { displayStartupStage } from '@/lib/startup-stage';
import type { DealCardData } from './deal-card';

export function DealflowTable({
  deals,
  watchlist,
  onWatchlist,
}: {
  deals: DealCardData[];
  watchlist: Set<string>;
  onWatchlist: (id: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-rule overflow-x-auto shadow-sm bg-paper">
      <Table className="min-w-[940px] [&_td]:py-3">
        <TableHeader>
          <TableRow className="bg-paper-deep hover:bg-paper-deep border-b-2 border-rule">
            <Th className="pl-4 w-10">#</Th>
            <Th>Company</Th>
            <Th>Signal score</Th>
            <Th>Stage</Th>
            <Th>Demand</Th>
            <Th className="pr-4 text-right">Actions</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((d, i) => {
            const open = openId === d._id;
            const stage = displayStartupStage(d.stage);
            const color = bandColor(d.signal.overall);
            const saved = watchlist.has(d._id);
            const trend = d.engagement.viewTrend;
            return (
              <Fragment key={d._id}>
                <TableRow className={`border-rule transition-colors hover:bg-forest-faint ${i % 2 ? 'bg-paper-tint/50' : ''}`}>
                  <TableCell className="pl-4 text-sm font-semibold text-ink-muted tabular-nums">{i + 1}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      {d.logo && !d.logo.includes('placeholder') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.logo} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain bg-paper border border-rule p-0.5" />
                      ) : (
                        <div className="h-9 w-9 shrink-0 rounded-md bg-paper-tint border border-rule flex items-center justify-center text-xs font-semibold text-ink-muted">
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link href={`/startups/${d._id}`} className="block max-w-[240px] truncate text-sm font-semibold text-ink hover:text-forest">
                          {d.name}
                        </Link>
                        <p className="max-w-[240px] truncate text-xs text-ink-muted capitalize">
                          {d.sector || 'Unspecified'}
                          {d.location ? ` · ${d.location.split(',')[0]}` : ''}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <div className="h-1.5 w-16 shrink-0 rounded-full bg-rule overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.signal.overall}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>{d.signal.overall}</span>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color, backgroundColor: `${color}1A` }}>
                        {d.signal.label}
                      </span>
                      <button
                        onClick={() => setOpenId(open ? null : d._id)}
                        aria-expanded={open}
                        aria-label="Why this score"
                        className="text-ink-faint hover:text-ink"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell>
                    {stage ? (
                      <span className="inline-flex rounded-md border border-rule bg-paper-tint px-2 py-0.5 text-xs font-medium text-ink-muted">
                        {stage}
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3 text-xs text-ink-muted whitespace-nowrap">
                      <span className="inline-flex items-center gap-1" title="Unique views">
                        <Eye className="h-3.5 w-3.5" /> {d.engagement.uniqueViews}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Saved by investors">
                        <BookmarkCheck className="h-3.5 w-3.5" /> {d.engagement.watchlistAdds}
                      </span>
                      {typeof trend === 'number' && trend !== 0 && (
                        <span className={`inline-flex items-center gap-0.5 font-medium ${trend > 0 ? 'text-forest' : 'text-ink-faint'}`}>
                          {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {Math.abs(trend)}%
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onWatchlist(d._id)}
                        disabled={saved}
                        aria-label={saved ? 'In watchlist' : 'Add to watchlist'}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                          saved
                            ? 'border-forest bg-forest/10 text-forest'
                            : 'border-rule bg-paper-tint text-ink-muted hover:text-forest hover:border-forest/40'
                        }`}
                      >
                        {saved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                      </button>
                      <Link
                        href={`/startups/${d._id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-rule bg-paper-tint px-3 text-xs font-medium text-ink hover:border-ink/30"
                      >
                        View <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>

                {open && (
                  <TableRow className="bg-paper-tint/70 hover:bg-paper-tint/70 border-rule">
                    <TableCell colSpan={6} className="px-4 py-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Why this score · {d.name}
                      </p>
                      <div className="max-w-md">
                        <SignalBreakdownBars breakdown={d.signal.breakdown} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <TableHead className={`h-11 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted ${className}`}>
      {children}
    </TableHead>
  );
}
