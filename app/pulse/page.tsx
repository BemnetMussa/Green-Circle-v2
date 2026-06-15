import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EditorialHeading } from '@/components/editorial/editorial-heading';
import { SectionKicker } from '@/components/editorial/section-kicker';
import { Rule } from '@/components/editorial/rule';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'The Pulse',
  description:
    'A monthly note from Green Circle on what\'s moving in Ethiopian startups.',
};

export default function PulseStubPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header currentPage="pulse" />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <SectionKicker tone="ember">The Pulse</SectionKicker>

          <EditorialHeading as="h1" size="lg" className="mt-6 max-w-[22ch]">
            The first issue lands in November.
          </EditorialHeading>

          <p className="mt-8 text-lg text-ink-muted leading-[1.65] text-pretty max-w-[56ch]">
            Each month we&rsquo;ll publish one short editorial from Addis
            Ababa: the founders we met, the launches that stuck with us, the
            honest numbers. No hype. No roundups. Just a note from two
            Ethiopians about what&rsquo;s actually moving.
          </p>

          <div className="mt-12">
            <Rule variant="mark" width="short" />
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-forest underline underline-offset-4 decoration-rule hover:decoration-forest transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Green Circle
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
