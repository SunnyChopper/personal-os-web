import { type ReactNode } from 'react';
import { Card } from '@/components/atoms/Card';
import { cn } from '@/lib/utils';
import { pbSectionDescriptionClassName, pbSectionTitleClassName } from './personal-branding-ui';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standard single-column card container aligned with admin `Card` primitive.
 */
export function PageCard({ children, className }: ContainerProps) {
  return <Card className={cn('rounded-2xl p-6 dark:bg-gray-900', className)}>{children}</Card>;
}

/**
 * Standard two-column layout for pages with sidebars.
 */
export function TwoColumnLayout({ children, className }: ContainerProps) {
  return <div className={cn('grid gap-6 lg:grid-cols-[280px_1fr]', className)}>{children}</div>;
}

/**
 * Standard sidebar container with consistent background and border.
 */
export function SidebarCard({ children, className }: ContainerProps) {
  return (
    <Card className={cn('space-y-4 rounded-2xl p-4 dark:bg-gray-900', className)}>{children}</Card>
  );
}

interface SectionIntroProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionIntro({ title, description, actions, className }: SectionIntroProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h2 className={pbSectionTitleClassName}>{title}</h2>
        {description ? <p className={pbSectionDescriptionClassName}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type AlertBannerTone = 'warning' | 'info';

const alertBannerToneClassName: Record<AlertBannerTone, string> = {
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100',
};

interface AlertBannerProps {
  children: ReactNode;
  tone?: AlertBannerTone;
  className?: string;
}

export function AlertBanner({ children, tone = 'warning', className }: AlertBannerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        alertBannerToneClassName[tone],
        className
      )}
    >
      {children}
    </div>
  );
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

/** Standard dialog footer row (pair with `Dialog` molecule). */
export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DataTableShellProps {
  children: ReactNode;
  className?: string;
}

/** Scrollable table wrapper with consistent border/radius. */
export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
}

export const dataTableHeadClassName = 'bg-gray-50 dark:bg-gray-900/60';

export const dataTableBodyClassName =
  'divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800';
