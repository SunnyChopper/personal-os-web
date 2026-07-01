import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageContainerWidth = 'default' | 'narrow' | 'wide' | 'full';

const widthClassName: Record<PageContainerWidth, string> = {
  default: 'max-w-6xl',
  narrow: 'max-w-3xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  width?: PageContainerWidth;
}

/**
 * Canonical admin content-width shell. Renders inside AdminLayout's outlet column.
 * `w-full` prevents flex shrink-to-content when combined with `mx-auto`.
 * Horizontal padding is owned by AdminLayout (`px-6 lg:px-12`), not this component.
 */
export function PageContainer({
  children,
  className,
  as: Component = 'div',
  width = 'default',
}: PageContainerProps) {
  return (
    <Component className={cn('mx-auto w-full', widthClassName[width], className)}>
      {children}
    </Component>
  );
}
