import { Skeleton } from '@/components/atoms/Skeleton';
import { cn } from '@/lib/utils';

interface ReplySuggestionCardSkeletonProps {
  className?: string;
}

/** Mirrors `ReplySuggestionsList` card anatomy: label, angle, body, rationale, actions. */
export function ReplySuggestionCardSkeleton({ className }: ReplySuggestionCardSkeletonProps) {
  return (
    <article
      role="status"
      aria-label="Generating reply suggestion"
      data-testid="reply-suggestion-card-skeleton"
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900/40',
        className
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <Skeleton variant="rectangular" className="h-4 w-28 rounded-md" />
        <Skeleton variant="rectangular" className="h-3.5 w-16 rounded-md" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <Skeleton className="mt-2 h-3 w-4/5" />

      <div className="mt-3 flex flex-wrap gap-2">
        <Skeleton variant="rectangular" className="h-8 w-28 rounded-lg" />
        <Skeleton variant="rectangular" className="h-8 w-16 rounded-lg" />
      </div>
    </article>
  );
}

export default ReplySuggestionCardSkeleton;
