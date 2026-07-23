import { BrandPlatformIcon } from '@/components/atoms/BrandPlatformIcon';
import { cn } from '@/lib/utils';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';

export type BrandPlatformChipProps = {
  platform: BrandPlatform;
  className?: string;
  /** Accessible label for the icon well when the visible label is insufficient. */
  title?: string;
};

/** Platform identity chip: icon well + uppercase label for Personal Branding cards. */
export function BrandPlatformChip({ platform, className, title }: BrandPlatformChipProps) {
  const label = BRAND_PLATFORM_LABELS[platform];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
        <BrandPlatformIcon
          platform={platform}
          className="size-4 text-blue-600 dark:text-blue-400"
          title={title}
        />
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
        {label}
      </span>
    </div>
  );
}
