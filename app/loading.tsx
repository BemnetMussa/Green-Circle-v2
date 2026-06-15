/**
 * Route-level fallback — minimal, token-aware, no heavy animation libs.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[38vh] flex-col items-center justify-center gap-3 bg-background px-6 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="animate-gc-spin h-8 w-8 rounded-full border-2 border-forest/20 border-t-forest dark:border-forest/35 dark:border-t-forest"
        aria-hidden="true"
      />
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Loading
      </p>
    </div>
  );
}
