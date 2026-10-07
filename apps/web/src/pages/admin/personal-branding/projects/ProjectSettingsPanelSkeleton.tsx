import { Skeleton } from '@/components/atoms/Skeleton';
import { PageCard } from '../PersonalBrandingPageTemplate';

export function ProjectSettingsPanelSkeleton() {
  return (
    <PageCard className="space-y-6 text-left">
      <div aria-busy="true" aria-label="Loading settings" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton variant="rectangular" className="h-20 w-full rounded-lg" />
      <div className="flex items-center gap-2">
        <Skeleton variant="rectangular" className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton variant="rectangular" className="h-10 w-24" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton variant="rectangular" className="h-10 w-32" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton variant="rectangular" className="h-20 w-full" />
      </div>
      </div>
    </PageCard>
  );
}
