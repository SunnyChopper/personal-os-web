import { Skeleton } from '@/components/atoms/Skeleton';
import { gridItemCardClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import { cn } from '@/lib/utils';

const DEFAULT_CONTENT_IDEA_SKELETON_COUNT = 6;

interface ContentIdeaCardSkeletonProps {
  className?: string;
}

/** Mirrors unused `ContentIdeaCard` anatomy: title row, summary, tags, action row. */
export function ContentIdeaCardSkeleton({ className }: ContentIdeaCardSkeletonProps) {
  return (
    <article
      role="status"
      aria-label="Loading content idea"
      data-testid="content-idea-card-skeleton"
      className={cn(gridItemCardClassName, 'flex flex-col', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton variant="rectangular" className="h-5 w-16 shrink-0 rounded-full" />
      </div>

      <div className="mt-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Skeleton variant="rectangular" className="h-5 w-14 rounded-full" />
        <Skeleton variant="rectangular" className="h-5 w-12 rounded-full" />
        <Skeleton variant="rectangular" className="h-5 w-16 rounded-full" />
      </div>

      <div className="mt-auto mt-4 flex gap-2">
        <Skeleton variant="rectangular" className="h-8 flex-1 rounded-lg" />
        <Skeleton variant="rectangular" className="h-8 w-20 rounded-lg" />
      </div>
    </article>
  );
}

interface ContentIdeaGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ContentIdeaGridSkeleton({
  count = DEFAULT_CONTENT_IDEA_SKELETON_COUNT,
  className,
}: ContentIdeaGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading content ideas"
      data-testid="content-idea-grid-skeleton"
      className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <ContentIdeaCardSkeleton key={`content-idea-skeleton-${index}`} />
      ))}
    </div>
  );
}

export default ContentIdeaCardSkeleton;
