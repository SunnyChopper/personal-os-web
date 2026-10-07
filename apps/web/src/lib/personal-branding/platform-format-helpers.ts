import type { BrandPlatform, ContentType } from '@/types/api/personal-branding.dto';

export type PlatformFormat =
  | 'simple_post'
  | 'carousel'
  | 'reel'
  | 'long_form'
  | 'short'
  | 'single_post'
  | 'article'
  | 'thread'
  | 'deep_dive'
  | 'briefing';

export const PLATFORM_FORMATS_BY_PLATFORM: Record<BrandPlatform, PlatformFormat[]> = {
  instagram: ['simple_post', 'carousel', 'reel'],
  youtube: ['long_form', 'short'],
  linkedin: ['single_post', 'carousel', 'article'],
  x: ['single_post', 'thread'],
  medium: ['deep_dive'],
  newsletter: ['briefing'],
};

export const DEFAULT_PLATFORM_FORMAT: Record<BrandPlatform, PlatformFormat> = {
  instagram: 'carousel',
  youtube: 'long_form',
  linkedin: 'single_post',
  x: 'thread',
  medium: 'deep_dive',
  newsletter: 'briefing',
};

/** Reply/quote generation defaults (X and LinkedIn → single post, not Live Output). */
export const REPLY_DEFAULT_PLATFORM_FORMAT: Record<BrandPlatform, PlatformFormat> = {
  ...DEFAULT_PLATFORM_FORMAT,
  x: 'single_post',
  linkedin: 'single_post',
};

export function defaultReplyPlatformFormat(platform: BrandPlatform): PlatformFormat {
  return REPLY_DEFAULT_PLATFORM_FORMAT[platform];
}

export const PLATFORM_FORMAT_LABELS: Record<PlatformFormat, string> = {
  simple_post: 'Simple post',
  carousel: 'Carousel',
  reel: 'Reel',
  long_form: 'Long-form video',
  short: 'Short',
  single_post: 'Single post',
  article: 'Article',
  thread: 'Thread',
  deep_dive: 'Deep dive',
  briefing: 'Briefing',
};

export const PLATFORM_FORMAT_HELPER_COPY: Partial<Record<PlatformFormat, string>> = {
  simple_post: 'One image prompt (brand-consistent) plus caption and optional hashtags.',
  carousel: 'Carousel slides with image prompts per slide, caption, and hashtags.',
  reel: 'Cover image prompt, timed beats with on-screen text, and caption.',
  long_form: 'Script beats with description and thumbnail prompt for a full YouTube video.',
  short: '15–60s Shorts script with on-screen text, description, and thumbnail prompt.',
  single_post: 'Platform-native single post optimized for the feed.',
  article: 'Long-form article with intro, sections, and takeaway.',
  thread: 'Numbered thread with one idea per post.',
  deep_dive: 'Long-form blog-style Markdown with sections.',
  briefing: 'Newsletter with preview, hook, sections, takeaways, and CTA.',
};

const CONTENT_TYPE_BY_PLATFORM_FORMAT: Record<PlatformFormat, ContentType> = {
  simple_post: 'SOCIAL_THREAD',
  carousel: 'SOCIAL_THREAD',
  reel: 'VIDEO_SCRIPT',
  long_form: 'VIDEO_SCRIPT',
  short: 'VIDEO_SCRIPT',
  single_post: 'SOCIAL_THREAD',
  article: 'DEEP_DIVE_BLOG',
  thread: 'SOCIAL_THREAD',
  deep_dive: 'DEEP_DIVE_BLOG',
  briefing: 'DEEP_DIVE_BLOG',
};

export function contentTypeForPlatformFormat(platformFormat: PlatformFormat): ContentType {
  return CONTENT_TYPE_BY_PLATFORM_FORMAT[platformFormat];
}

export function defaultPlatformFormat(platform: BrandPlatform): PlatformFormat {
  return DEFAULT_PLATFORM_FORMAT[platform];
}

export function platformFormatHelperCopy(platformFormat: PlatformFormat): string | null {
  return PLATFORM_FORMAT_HELPER_COPY[platformFormat] ?? null;
}

export function buildOutputTestGenerateInput(params: {
  topic: string;
  platform: BrandPlatform;
  platformFormat?: PlatformFormat;
  toneBiasKey?: string;
}) {
  const platformFormat = params.platformFormat ?? defaultPlatformFormat(params.platform);
  return {
    topic: params.topic,
    platform: params.platform,
    platformFormat,
    contentType: contentTypeForPlatformFormat(platformFormat),
    ...(params.toneBiasKey ? { toneBiasKey: params.toneBiasKey } : {}),
  };
}
