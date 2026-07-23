import { VariantCardSkeletonLayout } from '@/components/molecules/personal-branding/VariantCardSkeletonLayout';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';

interface VariantGeneratingSkeletonProps {
  platform: BrandPlatform;
  className?: string;
  index?: number;
}

export default function VariantGeneratingSkeleton({
  platform,
  className,
  index = 0,
}: VariantGeneratingSkeletonProps) {
  return (
    <VariantCardSkeletonLayout
      platform={platform}
      generating
      index={index}
      className={className}
      aria-label={`Generating ${BRAND_PLATFORM_LABELS[platform]} variant`}
    />
  );
}
