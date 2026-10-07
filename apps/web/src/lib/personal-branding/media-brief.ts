import type {
  ContentStreamMediaBrief,
  ContentStreamMemeSuggestion,
} from '@/types/api/personal-branding.dto';

export const MEDIA_BRIEF_KIND_LABELS: Record<ContentStreamMediaBrief['kind'], string> = {
  image: 'Image',
  shortVideo: 'Short video',
  carousel: 'Carousel',
};

export function formatMediaBriefForClipboard(brief: ContentStreamMediaBrief): string {
  const lines = [
    `Kind: ${MEDIA_BRIEF_KIND_LABELS[brief.kind]}`,
    `Concept: ${brief.concept}`,
    `Visual: ${brief.visualBrief}`,
  ];
  if (brief.altText?.trim()) {
    lines.push(`Alt text: ${brief.altText.trim()}`);
  }
  if (brief.captionHook?.trim()) {
    lines.push(`Caption hook: ${brief.captionHook.trim()}`);
  }
  if (brief.carouselSlides?.length) {
    brief.carouselSlides.forEach((slide, index) => {
      lines.push(`Slide ${index + 1}: ${slide}`);
    });
  }
  return lines.join('\n');
}

export function formatMemeSuggestionForClipboard(meme: ContentStreamMemeSuggestion): string {
  const lines = [
    meme.formatName ? `Format: ${meme.formatName}` : null,
    `Concept: ${meme.concept}`,
    `Visual: ${meme.visualBrief}`,
    meme.suggestedCaption?.trim() ? `Caption: ${meme.suggestedCaption.trim()}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.join('\n');
}
