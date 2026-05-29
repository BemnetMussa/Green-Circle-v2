import type { ReactNode, ElementType } from 'react';

interface EditorialHeadingProps {
  children: ReactNode;
  as?: ElementType;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  className?: string;
  /** Italic accent on a portion of the heading; use sparingly. */
  italic?: boolean;
}

const sizeMap: Record<NonNullable<EditorialHeadingProps['size']>, string> = {
  xl: 'text-5xl md:text-7xl',
  lg: 'text-4xl md:text-5xl',
  md: 'text-3xl md:text-4xl',
  sm: 'text-2xl md:text-3xl',
};

export function EditorialHeading({
  children,
  as: Tag = 'h2',
  size = 'lg',
  className = '',
  italic = false,
}: EditorialHeadingProps) {
  return (
    <Tag
      className={`font-display text-ink tracking-tight leading-[1.08] font-medium text-balance ${
        italic ? 'italic' : ''
      } ${sizeMap[size]} ${className}`}
      style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
    >
      {children}
    </Tag>
  );
}
