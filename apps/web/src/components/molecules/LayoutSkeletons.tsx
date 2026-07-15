import Skeleton from '@/components/atoms/Skeleton';
import { Card } from '@/components/atoms/Card';
import { cn } from '@/lib/utils';
import {
  gridItemCardClassName,
  PageCard,
} from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';

interface LayoutSkeletonProps {
  className?: string;
}

function SidebarListItemSkeleton({ active = false }: { active?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        active ? 'border-blue-500/40 bg-blue-600/10' : 'border-gray-200 dark:border-gray-700'
      )}
    >
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

/** Mirrors `TwoColumnLayout` + sidebar list + main editor card (Content Workbench / Brand Identity). */
export function TwoColumnSkeleton({ className }: LayoutSkeletonProps) {
  return (
    <div
      className={cn('grid min-h-[640px] gap-6 lg:grid-cols-[280px_1fr]', className)}
      role="status"
      aria-label="Loading workspace"
    >
      <Card className="flex h-full flex-col space-y-4 rounded-2xl p-4 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton variant="rectangular" className="h-4 w-10" />
        </div>
        <div className="space-y-2">
          <SidebarListItemSkeleton active />
          <SidebarListItemSkeleton />
          <SidebarListItemSkeleton />
        </div>
      </Card>

      <Card className="flex min-w-0 flex-col gap-3 rounded-2xl p-4 sm:p-6 dark:bg-gray-900">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-gray-200 pb-3 dark:border-gray-700">
          <Skeleton variant="rectangular" className="h-8 w-8 shrink-0" />
          <Skeleton variant="rectangular" className="h-8 w-8 shrink-0" />
          <Skeleton variant="rectangular" className="h-9 min-w-0 flex-1" />
          <Skeleton variant="rectangular" className="h-7 w-24 shrink-0 rounded-full" />
          <Skeleton variant="rectangular" className="h-8 w-16 shrink-0" />
          <Skeleton variant="rectangular" className="h-8 w-8 shrink-0" />
          <Skeleton variant="rectangular" className="h-8 w-20 shrink-0" />
          <Skeleton variant="rectangular" className="h-8 w-8 shrink-0" />
        </div>
        <div className="min-h-[480px] flex-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" className="h-7 w-7" />
              ))}
            </div>
            <Skeleton className="h-3 w-36" />
          </div>
          <div className="grid min-h-[420px] gap-px bg-gray-200 dark:bg-gray-700 lg:grid-cols-2">
            <div className="space-y-3 bg-white p-4 dark:bg-gray-900">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="hidden space-y-3 bg-white p-4 dark:bg-gray-900 lg:block">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function GridCardSkeleton() {
  return (
    <div className={cn(gridItemCardClassName, 'space-y-3')}>
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton variant="rectangular" className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex flex-wrap gap-2 pt-1">
        <Skeleton variant="rectangular" className="h-5 w-14 rounded-full" />
        <Skeleton variant="rectangular" className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

/** Mirrors Content Pipeline → Platform Repurposer (`PageCard` + empty-state body + variants section). */
export function PlatformRepurposerSkeleton({ className }: LayoutSkeletonProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-label="Loading platform repurposer"
    >
      <PageCard>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />

        <div className="mt-6 flex flex-col items-center py-12 text-center">
          <Skeleton variant="circular" className="mb-4 h-16 w-16" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
          <Skeleton className="mt-1 h-4 w-4/5 max-w-md" />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Skeleton variant="rectangular" className="h-10 w-52" />
            <Skeleton variant="rectangular" className="h-10 w-44" />
          </div>
        </div>
      </PageCard>

      <section className="space-y-4" aria-hidden>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-28" />
      </section>
    </div>
  );
}

/** Mirrors a single `PageCard` with intro + responsive card grid (Signal Radar / Rolodex). */
export function SingleColumnSkeleton({ className }: LayoutSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-label="Loading content">
      <Card className="space-y-4 rounded-2xl p-6 dark:bg-gray-900">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton variant="rectangular" className="h-10 w-full" />
          <Skeleton variant="rectangular" className="h-10 w-full" />
        </div>
        <Skeleton variant="rectangular" className="h-24 w-full" />
        <Skeleton variant="rectangular" className="h-9 w-32" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GridCardSkeleton />
        <GridCardSkeleton />
        <GridCardSkeleton />
      </div>
    </div>
  );
}

/** Mirrors a `PageCard` wrapping a data table (Connection Directory). */
export function TableSkeleton({ className, rows = 5 }: LayoutSkeletonProps & { rows?: number }) {
  const columns = 7;
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading table">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton variant="rectangular" className="h-8 w-32" />
      </div>

      <Card className="overflow-hidden rounded-2xl p-0 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <div className="flex gap-4 bg-gray-50 px-4 py-3 dark:bg-gray-900/60">
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1 min-w-[72px]" />
              ))}
            </div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-4 bg-white px-4 py-3 dark:bg-gray-800">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    className={cn('h-4 flex-1 min-w-[72px]', colIndex === 0 ? 'w-32' : '')}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
