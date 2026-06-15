import { Database, LayoutList, Map } from 'lucide-react';

const STEPS = [
  {
    icon: Database,
    title: 'We gather data',
    body: 'What is already in the public record and what founders give us — team, company, traction, story — comes through one intake. Same questions, same shape, so nothing important lives in a stray PDF or a dead link.',
  },
  {
    icon: LayoutList,
    title: 'We list the startups',
    body: 'Each team that belongs on Green Circle gets a full profile in the directory: one page per startup, same fields every time. That list is the running inventory of who is building in Ethiopia right now.',
  },
  {
    icon: Map,
    title: "We map Ethiopia's innovation ecosystem",
    body: 'From those listings we pull sector, place, and stage into a view you can actually move through — so innovation here stops sounding like gossip in a chat and starts looking like a country-sized map capital and partners can use.',
  },
] as const;

const GOLD = '#C5A028';

/** Homepage — vertical pipeline with black spine + gold nodes (no glass shell). */
export function TrustSection() {
  return (
    <section className="gc-section-method border-t border-rule-soft dark:border-rule">
      <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8 md:py-24">
        <span className="gc-kicker">How it works</span>
        <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-ink md:text-[1.65rem]">
          We gather data. We list the startups. We map the ecosystem.
        </h2>
        <div className="mt-5 space-y-4 font-sans text-sm font-normal leading-relaxed text-ink-muted md:text-base">
          <p>
            Three steps, in order. We collect what matters from the open web
            and from founders. We turn that into structured listings on Green
            Circle.
          </p>
          <p>
            Then we use those listings to show how Ethiopian innovation
            actually spreads — by sector, by place, by who is building — so
            anyone looking for capital, credit, or a partner can navigate the
            country instead of guessing.
          </p>
        </div>

        <div className="relative mt-14">
          <div
            className="pointer-events-none absolute left-4 top-2 bottom-2 w-px bg-ink/20 dark:bg-ink/35"
            aria-hidden
          />
          <ol className="relative list-none space-y-0 p-0">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className="relative pb-12 pl-11 last:pb-0 md:pl-12"
              >
                <div
                  className="absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-paper font-sans text-[11px] font-bold tabular-nums text-ink shadow-sm border-gold dark:bg-paper"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="flex items-start gap-2.5 text-base font-semibold text-ink">
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span>{title}</span>
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted md:text-[0.9375rem]">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
