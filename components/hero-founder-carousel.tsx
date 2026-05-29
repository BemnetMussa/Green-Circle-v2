'use client';

import { useEffect, useId, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { ImageWithFallback } from '@/components/image-withfallback';
import type { HeroFounderSlide } from '@/lib/hero-founders';

const FADE_MS = 520;
const DEFAULT_AUTOPLAY_MS = 4000;

interface HeroFounderCarouselProps {
  slides: HeroFounderSlide[];
  autoplayMs?: number;
}

export function HeroFounderCarousel({
  slides,
  autoplayMs = DEFAULT_AUTOPLAY_MS,
}: HeroFounderCarouselProps) {
  const rootId = useId();
  const headingId = `${rootId}-heading`;

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  /** Hover/focus inside carousel — temporarily pauses autoplay */
  const [hoverPaused, setHoverPaused] = useState(false);
  /** User toggled pause — stays until they press play */
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const autoplayRunning =
    slides.length > 1 && !reduceMotion && !userPaused && !hoverPaused;

  useEffect(() => {
    if (!autoplayRunning) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayRunning, slides.length, autoplayMs]);

  const onPointerEnter = () => setHoverPaused(true);
  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    window.requestAnimationFrame(() => {
      if (!el?.matches(':focus-within')) setHoverPaused(false);
    });
  };

  const onFocusOutCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    const root = e.currentTarget;
    if (next && root?.contains(next)) return;
    setHoverPaused(false);
  };

  const onFocusInCapture = () => setHoverPaused(true);

  if (!slides.length) return null;

  const active = slides[index];
  const foundersLabel =
    slides.map((s) => s.credit).join(' and ') || 'Featured Ethiopian founders';

  return (
    <figure className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
      <div
        data-hero-carousel=""
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={headingId}
        className="relative"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocusCapture={onFocusInCapture}
        onBlurCapture={onFocusOutCapture}
      >
        <span id={headingId} className="sr-only">
          Featured Ethiopian founders — {foundersLabel}
        </span>

        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-rule/50 bg-paper-deep/90 shadow-md ring-1 ring-white/25 ring-inset backdrop-blur-[2px]">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              id={`${rootId}-slide-panel-${slide.id}`}
              className={`absolute inset-0 transition-opacity ease-out motion-reduce:transition-none ${
                i === index
                  ? 'z-[1] opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
              style={{
                transitionDuration: reduceMotion ? '0ms' : `${FADE_MS}ms`,
              }}
              aria-hidden={i !== index}
            >
              <ImageWithFallback
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover object-center"
                sizes="(min-width: 1280px) 480px, (min-width: 1024px) 40vw, 90vw"
                priority={i === 0}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <div
                className="flex justify-center gap-2"
                role="tablist"
                aria-label="Choose founder slide"
              >
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-controls={`${rootId}-caption`}
                    className={`h-2 rounded-full transition-all duration-200 ease-out ${
                      i === index
                        ? 'w-8 bg-forest'
                        : 'w-2 bg-rule hover:bg-ink-faint/80'
                    }`}
                    onClick={() => setIndex(i)}
                    aria-label={`${slide.credit}, slide ${i + 1}`}
                  />
                ))}
              </div>
              {!reduceMotion && (
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-rule/80 bg-paper/85 px-3 text-xs font-medium text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-forest/40 hover:text-forest dark:bg-paper-deep/90"
                  aria-pressed={!userPaused}
                  aria-label={
                    userPaused ? 'Resume automatic slide advance' : 'Pause automatic slide advance'
                  }
                  onClick={() => setUserPaused((p) => !p)}
                >
                  {userPaused ? (
                    <Play className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  ) : (
                    <Pause className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  )}
                  <span className="tabular-nums">
                    {userPaused ? 'Play' : 'Pause'}
                  </span>
                </button>
              )}
            </div>
            {!reduceMotion && (
              <p className="mt-2 text-center font-sans text-[11px] text-ink-faint">
                Slides advance automatically — pause with the control or by hovering.
              </p>
            )}
          </>
        )}
      </div>

      <figcaption id={`${rootId}-caption`} className="mt-4 space-y-1">
        <p className="font-sans text-sm leading-snug text-ink text-pretty">
          {active.caption}
        </p>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {active.credit}
        </p>
      </figcaption>

      <span className="sr-only" aria-live="polite">
        {active.credit}. Slide {index + 1} of {slides.length}.
      </span>
    </figure>
  );
}
