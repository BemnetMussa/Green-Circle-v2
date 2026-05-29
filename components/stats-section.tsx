import { Coins, Handshake, Globe2 } from 'lucide-react';

interface StatsSectionProps {
  startupCount?: number;
  sectorCount?: number;
}

const PILLARS = [
  {
    icon: Coins,
    title: 'Capital',
    body: 'Public listings, structured profiles, dated milestones — the diligence signal investors need to deploy with confidence in Ethiopia.',
  },
  {
    icon: Handshake,
    title: 'Credit',
    body: 'Lenders and credit providers see real businesses, real traction, and real founders — not pitch decks and screenshots alone.',
  },
  {
    icon: Globe2,
    title: 'Global Partners',
    body: 'Distributors, customers, mentors, and hiring partners reach Ethiopian founders directly — no gatekeepers, no middlemen.',
  },
] as const;

/** “Why Green Circle” — immediately after the hero. */
export function StatsSection({
  startupCount,
  sectorCount,
}: StatsSectionProps = {}) {
  const liveLine =
    typeof startupCount === 'number' &&
    startupCount > 0 &&
    typeof sectorCount === 'number' &&
    sectorCount > 0
      ? `${startupCount} startup${startupCount === 1 ? '' : 's'} · ${sectorCount} sector${sectorCount === 1 ? '' : 's'} on the directory today.`
      : typeof startupCount === 'number' && startupCount > 0
        ? `${startupCount} startup${startupCount === 1 ? '' : 's'} on the directory today.`
        : null;

  return (
    <section className="gc-section-why relative border-t border-rule-soft dark:border-rule">
      <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-32 lg:px-12 lg:py-36 xl:px-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20 xl:gap-28">
          <div className="max-w-xl shrink-0 lg:max-w-md xl:max-w-lg">
            <span className="gc-kicker">Why Green Circle</span>
            <div
              className="mt-3.5 h-1 w-16 rounded-full bg-gold shadow-sm shadow-gold/25"
              aria-hidden
            />
            <h2 className="mt-6 max-w-[20ch] text-2xl font-semibold leading-snug tracking-tight text-ink md:text-3xl lg:text-[2rem] text-balance">
              Every startup shaping Ethiopia, in one place.
            </h2>
          </div>

          <div className="min-w-0 flex-1 space-y-6 pt-1">
            <div className="max-w-[58ch] space-y-5">
              <p className="font-sans text-base font-normal leading-relaxed text-ink-muted text-pretty md:text-lg">
                Ethiopian founders are building remarkable companies — and
                dying in silence. Green Circle is the living infrastructure
                that ends that. Every startup is structured, browsable, and
                reachable in one click — turning scattered noise into a
                usable map of Ethiopian innovation.
              </p>
              <p className="font-sans text-base font-normal leading-relaxed text-ink-muted text-pretty md:text-lg">
                We built it so capital can act, partners can find who&rsquo;s
                worth backing, and the whole ecosystem can finally be seen.
              </p>
            </div>
            {liveLine && (
              <p className="font-sans text-sm font-medium leading-relaxed text-ink-faint">
                {liveLine}
              </p>
            )}
          </div>
        </div>

        <div className="mt-20 md:mt-24">
          <ul className="grid gap-6 md:grid-cols-3 md:gap-7 lg:gap-8">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="group rounded-xl border border-rule bg-paper p-7 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-8 dark:border-rule dark:bg-paper-deep"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rule/80 bg-paper-tint text-forest dark:border-rule dark:bg-paper">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-ink md:text-xl">
                  {title}
                </h3>
                <p className="mt-2.5 font-sans text-sm font-normal leading-relaxed text-ink-muted text-pretty md:text-[0.9375rem]">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
