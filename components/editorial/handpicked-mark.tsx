import { Mark } from '@/components/logo/greencirlce-logo';
import type { Startup } from '@/types';

interface HandpickedMarkProps {
  startup: Pick<Startup, 'updatedAt' | 'createdAt'>;
  className?: string;
  /**
   * Visual density. `inline` is the one used on cards; `detail` is a larger
   * version for the startup profile page.
   */
  size?: 'inline' | 'detail';
}

/**
 * Shows when the startup data was last updated.
 * Simple, honest timestamp — no claims about verification or curation.
 */
export function HandpickedMark({
  startup,
  className = '',
  size = 'inline',
}: HandpickedMarkProps) {
  const date = startup.updatedAt ?? startup.createdAt;

  if (!date) return null;

  const label = `Listed ${formatMonthYear(date)}`;
  const isDetail = size === 'detail';

  return (
    <span
      className={`inline-flex items-center gap-2 ${
        isDetail ? 'text-sm' : 'text-xs'
      } uppercase tracking-[0.12em] font-semibold text-ink-faint ${className}`}
      title="Data publicly available on Green Circle"
    >
      <Mark
        className={`${isDetail ? 'h-4 w-4' : 'h-3 w-3'} text-forest shrink-0`}
      />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
