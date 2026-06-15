import { Mark } from '@/components/logo/greencirlce-logo';

interface RuleProps {
  variant?: 'plain' | 'mark';
  className?: string;
  width?: 'full' | 'short';
}

/**
 * Hairline divider. Either a plain 1px rule, or a rule broken by the
 * hand-drawn ink circle at centre — used once per section at most.
 */
export function Rule({
  variant = 'plain',
  className = '',
  width = 'full',
}: RuleProps) {
  const widthClass = width === 'short' ? 'max-w-[160px]' : 'w-full';

  if (variant === 'mark') {
    return (
      <div
        className={`flex items-center gap-5 ${widthClass} ${className}`}
        role="presentation"
      >
        <div className="h-px flex-1 bg-rule" />
        <Mark className="h-4 w-4 text-ink-faint" />
        <div className="h-px flex-1 bg-rule" />
      </div>
    );
  }

  return <div className={`h-px bg-rule ${widthClass} ${className}`} role="presentation" />;
}
