import type { StatusPillTone } from '@/pages/admin/personal-branding/personal-branding-ui';
import type {
  BrandProjectIdea,
  BrandProjectIdeaStatus,
  BrandProjectPostPlatform,
  BrandProjectRejectionCategory,
} from '@/types/api/personal-branding.dto';
import { formatDateString } from '@/utils/date-formatters';

export const BRAND_PROJECT_POST_PLATFORM_LABEL: Record<BrandProjectPostPlatform, string> = {
  x: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  other: 'Other',
};

export const BRAND_PROJECT_REJECTION_CATEGORY_LABEL: Record<BrandProjectRejectionCategory, string> =
  {
    too_complex: 'Too complex',
    not_trending: 'Not trending',
    not_shareable: 'Not shareable',
    off_niche: 'Off niche',
    already_exists: 'Already exists',
    other: 'Other',
  };

export function brandProjectRejectionCategoryLabel(
  category: BrandProjectRejectionCategory | string | null | undefined
): string | null {
  if (!category) return null;
  if (category in BRAND_PROJECT_REJECTION_CATEGORY_LABEL) {
    return BRAND_PROJECT_REJECTION_CATEGORY_LABEL[category as BrandProjectRejectionCategory];
  }
  return null;
}

export function projectIdeaStatusTone(status: BrandProjectIdeaStatus): StatusPillTone {
  switch (status) {
    case 'generated':
      return 'info';
    case 'rejected':
      return 'danger';
    case 'completed':
      return 'success';
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function projectIdeaStatusLabel(status: BrandProjectIdeaStatus): string {
  switch (status) {
    case 'generated':
      return 'Generated';
    case 'rejected':
      return 'Rejected';
    case 'completed':
      return 'Completed';
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function formatBrandProjectEstimatedHours(hours: number): string {
  const raw = String(hours);
  const trimmed = raw.endsWith('.0') ? raw.slice(0, -2) : raw;
  return `${trimmed}h`;
}

export function buildProjectIdeaMetaParts(idea: BrandProjectIdea): string[] {
  const parts: string[] = [];
  const difficulty = idea.difficulty?.trim();
  if (difficulty) {
    parts.push(difficulty);
  }
  if (idea.estimatedHours != null && !Number.isNaN(idea.estimatedHours)) {
    parts.push(formatBrandProjectEstimatedHours(idea.estimatedHours));
  }
  if (idea.generatedForDate) {
    const formatted = formatDateString(idea.generatedForDate);
    if (formatted) {
      parts.push(formatted);
    }
  }
  return parts;
}
