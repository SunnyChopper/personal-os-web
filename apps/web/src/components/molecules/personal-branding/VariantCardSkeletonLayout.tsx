import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { BrandPlatformIcon } from '@/components/atoms/BrandPlatformIcon';
import { Skeleton } from '@/components/atoms/Skeleton';
import { cn } from '@/lib/utils';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';
import { gridItemCardClassName } from '@/lib/personal-branding/personal-branding-surfaces';

interface VariantCardSkeletonLayoutProps {
  className?: string;
  platform?: BrandPlatform;
  /** When true, show platform header with spinner (generating state). */
  generating?: boolean;
  /** Stage label shown in generating header (e.g. "Searching references"). */
  statusLabel?: string;
  /** Latest job message shown under the generating header. */
  detailMessage?: string;
  /** Stagger index for entrance animation. */
  index?: number;
  'aria-label'?: string;
}

/**
 * Mirrors collapsed `VariantActiveCard` anatomy: header, title, body preview, meta, action row.
 */
export function VariantCardSkeletonLayout({
  className,
  platform,
  generating = false,
  statusLabel,
  detailMessage,
  index = 0,
  'aria-label': ariaLabel,
}: VariantCardSkeletonLayoutProps) {
  const generatingStatusLabel = statusLabel ?? 'Generating…';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(gridItemCardClassName, 'space-y-3', className)}
      role="status"
      aria-label={ariaLabel}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {platform ? (
            <>
              <BrandPlatformIcon
                platform={platform}
                className="size-5 text-blue-600 dark:text-blue-400"
                title={BRAND_PLATFORM_LABELS[platform]}
              />
              {generating ? (
                <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
              ) : (
                <Skeleton variant="circular" className="size-4" />
              )}
              <span className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400">
                {BRAND_PLATFORM_LABELS[platform]}
              </span>
              {generating ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  · {generatingStatusLabel}
                </span>
              ) : null}
            </>
          ) : (
            <>
              <Skeleton variant="circular" className="size-5" />
              <Skeleton className="h-3 w-16" />
            </>
          )}
        </div>
        {generating && detailMessage ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{detailMessage}</p>
        ) : null}
      </div>

      <Skeleton className="h-4 w-3/4" />

      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>

      <Skeleton className="h-3 w-2/5" />

      <div className="flex flex-wrap gap-2 pt-1">
        <Skeleton variant="rectangular" className="h-8 w-14 rounded-lg" />
        <Skeleton variant="rectangular" className="h-8 w-28 rounded-lg" />
        <Skeleton variant="rectangular" className="h-8 w-24 rounded-lg" />
        <Skeleton variant="rectangular" className="h-8 w-14 rounded-lg" />
        <Skeleton variant="rectangular" className="h-8 w-16 rounded-lg" />
      </div>
    </motion.div>
  );
}
