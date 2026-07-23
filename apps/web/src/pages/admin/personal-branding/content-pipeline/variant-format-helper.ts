import type { BrandPlatform } from '@/types/api/personal-branding.dto';

const FORMAT_HELPER_COPY: Partial<Record<BrandPlatform, string>> = {
  newsletter:
    'Newsletter variants use structured sections in the body: Preview, Hook, 2–5 content sections, Takeaways, CTA, and optional P.S. The title is the email subject line.',
  youtube:
    'YouTube variants use script beats in the body: [INTRO], [SECTION n], and [OUTRO] blocks with On-camera lines and optional B-roll notes. The title is the video title.',
  instagram:
    'Instagram variants use a carousel outline in the body: ## Carousel with ### Slide k sections, then ## Caption and optional ## Hashtags. The title is a working hook.',
};

export function variantFormatHelperCopy(platform: BrandPlatform): string | null {
  return FORMAT_HELPER_COPY[platform] ?? null;
}
