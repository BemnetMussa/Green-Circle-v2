import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

/** Shown when `notFound()` runs for this segment — startup id not in the directory. */
export default function StartupNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header currentPage="startups" />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-forest">
            Directory
          </p>
          <h1 className="mt-4 font-sans text-2xl font-semibold tracking-tight text-ink">
            This startup isn&apos;t in the directory
          </h1>
          <p className="mt-4 font-sans text-base leading-relaxed text-ink-muted text-pretty">
            This link doesn&apos;t match a current listing — it may be outdated, or
            the profile may have been removed. Open the directory and choose a
            live company from the list.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/startups"
              className="inline-flex h-11 items-center justify-center rounded-md bg-forest px-6 font-sans text-sm font-medium text-paper transition-colors hover:bg-forest-soft"
            >
              Browse directory
            </Link>
            <Link
              href="/"
              className="font-sans text-sm font-medium text-ink-muted underline decoration-rule underline-offset-4 transition-colors hover:text-forest hover:decoration-forest"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
