import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type ContentStatus,
} from '@/types/api/personal-branding.dto';

function platformDisplayName(platform: BrandPlatform | null | undefined): string | null {
  if (!platform) return null;
  return BRAND_PLATFORM_LABELS[platform] ?? platform;
}

export function contentStatusBadgeLabel(
  status: ContentStatus,
  platform?: BrandPlatform | null
): string {
  if (status === 'PUBLISHED') {
    const platformName = platformDisplayName(platform);
    return platformName ? `Published · ${platformName}` : 'Published';
  }
  return 'Draft';
}

export function pipelineSourceOptionLabel(node: {
  title: string;
  status: string;
  platform?: BrandPlatform | null;
}): string {
  const platformName = platformDisplayName(node.platform);
  const base = platformName ? `${node.title} · ${platformName}` : node.title;
  if (node.status === 'PIPELINED') {
    return `${base} · Pipelined`;
  }
  return base;
}

export function originallyPublishedOnLabel(platform?: BrandPlatform | null): string {
  const platformName = platformDisplayName(platform);
  return platformName
    ? `Originally published on ${platformName}`
    : 'Originally published on Unknown platform';
}
