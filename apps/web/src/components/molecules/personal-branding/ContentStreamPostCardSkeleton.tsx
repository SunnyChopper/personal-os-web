import { Skeleton } from '@/components/atoms/Skeleton';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import type { ContentStreamSettings } from '@/types/api/personal-branding.dto';

type SkeletonCountSettings = Pick<ContentStreamSettings, 'remainingDailyBudget' | 'postsPerDay'>;

export function resolveContentStreamSkeletonCount(settings?: SkeletonCountSettings | null): number {
  const remaining = settings?.remainingDailyBudget;
  const postsPerDay = settings?.postsPerDay ?? 5;
  const raw = remaining != null && remaining > 0 ? remaining : postsPerDay;
  return Math.min(20, Math.max(1, raw));
}

interface ContentStreamPostCardSkeletonProps {
  className?: string;
}

/** Mirrors collapsed `PostCard` anatomy: angle chip, body lines, action row. */
export function ContentStreamPostCardSkeleton({ className }: ContentStreamPostCardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Generating short post draft"
      data-testid="content-stream-post-card-skeleton"
      className={className}
    >
      <InsetPanel className="space-y-3" padding="standard">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton variant="rectangular" className="h-5 w-20 rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton variant="rectangular" className="size-8 rounded-lg" />
          <Skeleton variant="rectangular" className="size-8 rounded-lg" />
          <Skeleton variant="rectangular" className="h-8 w-14 rounded-lg" />
        </div>
      </InsetPanel>
    </div>
  );
}

export default ContentStreamPostCardSkeleton;
