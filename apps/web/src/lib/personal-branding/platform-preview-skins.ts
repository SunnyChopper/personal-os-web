import { PLATFORM_RULE_CATALOG } from '@/lib/personal-branding/platform-rule-catalog';
import type { BrandPlatform } from '@/types/api/personal-branding.dto';

export interface PlatformPreviewSkin {
  maxWidthClass: string;
  frameClassName: string;
  proseClassName: string;
  linkHint: string;
}

const ALL_PLATFORMS: BrandPlatform[] = [
  'linkedin',
  'x',
  'medium',
  'youtube',
  'instagram',
  'newsletter',
];

const PLATFORM_PREVIEW_SKINS: Record<BrandPlatform, PlatformPreviewSkin> = {
  x: {
    maxWidthClass: 'max-w-sm',
    frameClassName:
      'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800',
    proseClassName:
      'prose-sm prose-p:my-2 prose-p:leading-snug prose-headings:my-2 prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-sky-400',
    linkHint: 'Short-post density; links render as plain blue text.',
  },
  linkedin: {
    maxWidthClass: 'max-w-md',
    frameClassName:
      'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800',
    proseClassName:
      'prose-sm prose-p:leading-relaxed prose-a:text-blue-700 prose-a:font-medium hover:prose-a:underline dark:prose-a:text-blue-400',
    linkHint: 'Feed-post width; links use LinkedIn-style emphasis.',
  },
  medium: {
    maxWidthClass: 'max-w-prose',
    frameClassName:
      'rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
    proseClassName:
      'prose-base prose-headings:font-serif prose-p:leading-7 prose-a:text-green-700 hover:prose-a:underline dark:prose-a:text-green-400',
    linkHint: 'Article column; serif headings and relaxed body.',
  },
  newsletter: {
    maxWidthClass: 'max-w-prose',
    frameClassName:
      'rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
    proseClassName:
      'prose-base prose-p:leading-7 prose-a:text-indigo-700 hover:prose-a:underline dark:prose-a:text-indigo-400',
    linkHint: 'Email-style reading width; inline links underlined on hover.',
  },
  instagram: {
    maxWidthClass: 'max-w-sm',
    frameClassName:
      'rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
    proseClassName:
      'prose-sm prose-p:my-1.5 prose-p:leading-snug prose-a:text-pink-600 hover:prose-a:underline dark:prose-a:text-pink-400',
    linkHint: 'Caption density; compact paragraphs.',
  },
  youtube: {
    maxWidthClass: 'max-w-md',
    frameClassName:
      'rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
    proseClassName:
      'prose-sm prose-p:leading-normal prose-pre:font-mono prose-pre:text-xs prose-a:text-red-600 hover:prose-a:underline dark:prose-a:text-red-400',
    linkHint: 'Script/description column; monospace code blocks.',
  },
};

/** Raw markdown body length for preview meter (matches Live Output compliance). */
export function countPreviewChars(markdown: string): number {
  return markdown.length;
}

export function getPlatformPreviewSkin(platform: BrandPlatform): PlatformPreviewSkin {
  return PLATFORM_PREVIEW_SKINS[platform];
}

export function getPlatformCharacterLimit(platform: BrandPlatform): number {
  return PLATFORM_RULE_CATALOG.limitDefaults[platform]?.characterLimit ?? 0;
}

export function isOverCharacterLimit(platform: BrandPlatform, markdown: string): boolean {
  const count = countPreviewChars(markdown);
  return count > getPlatformCharacterLimit(platform);
}

export function listPlatformPreviewSkinPlatforms(): BrandPlatform[] {
  return [...ALL_PLATFORMS];
}
