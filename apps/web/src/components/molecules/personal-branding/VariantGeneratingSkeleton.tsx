import { VariantCardSkeletonLayout } from '@/components/molecules/personal-branding/VariantCardSkeletonLayout';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';

interface VariantGeneratingSkeletonProps {
  platform: BrandPlatform;
  className?: string;
  index?: number;
  statusLabel?: string;
  detailMessage?: string;
}

export default function VariantGeneratingSkeleton({
  platform,
  className,
  index = 0,
  statusLabel,
  detailMessage,
}: VariantGeneratingSkeletonProps) {
  return (
    <VariantCardSkeletonLayout
      platform={platform}
      generating
      index={index}
      className={className}
      statusLabel={statusLabel}
      detailMessage={detailMessage}
      aria-label={`Generating ${BRAND_PLATFORM_LABELS[platform]} variant`}
    />
  );
}
