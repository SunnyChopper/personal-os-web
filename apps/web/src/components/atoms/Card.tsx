import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Canonical card surface for admin panels and list items. */
export const cardSurfaceClassName =
  'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn(cardSurfaceClassName, className)} {...props} />;
});

export type CardSectionProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 sm:py-4',
        className
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: CardSectionProps) {
  return <div className={cn('px-4 py-3 sm:px-6 sm:py-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        'border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 sm:py-4',
        className
      )}
      {...props}
    />
  );
}

export type CardTitleProps = { children: ReactNode; className?: string };

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h3>
  );
}
