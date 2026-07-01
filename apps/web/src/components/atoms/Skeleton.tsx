import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
}

const variantClassName: Record<SkeletonVariant, string> = {
  text: 'rounded h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
};

/** Reusable pulse placeholder for loading states. */
export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variantClassName[variant],
        className
      )}
      aria-hidden
    />
  );
}

export default Skeleton;
