import { Link } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import {
  BRAND_PROJECT_POST_PLATFORM_LABEL,
  brandProjectRejectionCategoryLabel,
  buildProjectIdeaMetaParts,
  projectIdeaStatusLabel,
  projectIdeaStatusTone,
} from '@/lib/personal-branding/brand-project-display';
import { gridItemCardClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import {
  pbCardTitleClassName,
  pbMetaClassName,
  statusPillClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import { personalBrandingProjectIdeaPath } from '@/routes';
import { cn } from '@/lib/utils';
import type { BrandProjectIdea, BrandProjectTechnology } from '@/types/api/personal-branding.dto';

const SCAN_CARD_MAX_VISIBLE_TECH = 2;

interface ProjectIdeaCardProps {
  idea: BrandProjectIdea;
  onReject: () => void;
  onComplete: () => void;
}

function hiddenTechnologyAriaName(tech: BrandProjectTechnology): string {
  return tech.name;
}

export default function ProjectIdeaCard({ idea, onReject, onComplete }: ProjectIdeaCardProps) {
  const rejectionCategoryLabel = brandProjectRejectionCategoryLabel(
    idea.rejection?.feedbackCategory
  );
  const showViewKitForTerminal =
    (idea.status === 'completed' || idea.status === 'rejected') && Boolean(idea.buildKit);

  const metaParts = buildProjectIdeaMetaParts(idea);
  const detailPath = personalBrandingProjectIdeaPath(idea.id);
  const visibleTechnologies = idea.technologies.slice(0, SCAN_CARD_MAX_VISIBLE_TECH);
  const hiddenTechnologies = idea.technologies.slice(SCAN_CARD_MAX_VISIBLE_TECH);
  const hiddenTechLabel = hiddenTechnologies.map(hiddenTechnologyAriaName).join(', ');

  return (
    <article className={cn(gridItemCardClassName, 'relative flex h-full min-w-0 flex-col gap-3')}>
      <Link
        to={detailPath}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
        aria-label={idea.title}
      />

      <div className="pointer-events-none flex items-start justify-between gap-2">
        <h3 className={cn(pbCardTitleClassName, 'line-clamp-2 min-w-0 flex-1')}>{idea.title}</h3>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {idea.buildKit ? <span className={statusPillClassName('success')}>Kit ready</span> : null}
          <span className={statusPillClassName(projectIdeaStatusTone(idea.status))}>
            {projectIdeaStatusLabel(idea.status)}
          </span>
        </div>
      </div>

      {idea.oneLiner ? (
        <p className="pointer-events-none line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
          {idea.oneLiner}
        </p>
      ) : null}

      {metaParts.length > 0 ? (
        <p className={cn(pbMetaClassName, 'pointer-events-none')}>{metaParts.join(' · ')}</p>
      ) : null}

      {idea.technologies.length > 0 ? (
        <div className="pointer-events-none flex flex-wrap gap-2">
          {visibleTechnologies.map((tech) => (
            <span key={tech.name} className={statusPillClassName('neutral')}>
              {tech.name}
            </span>
          ))}
          {hiddenTechnologies.length > 0 ? (
            <span
              className={statusPillClassName('neutral')}
              title={hiddenTechLabel}
              aria-label={`${hiddenTechnologies.length} more technologies: ${hiddenTechLabel}`}
            >
              +{hiddenTechnologies.length}
            </span>
          ) : null}
        </div>
      ) : null}

      {idea.status === 'rejected' && idea.rejection ? (
        <div className="pointer-events-none">
          <EyebrowLabel>Rejection feedback</EyebrowLabel>
          {rejectionCategoryLabel ? (
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {rejectionCategoryLabel}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
            {idea.rejection.feedbackText}
          </p>
        </div>
      ) : null}

      {idea.status === 'completed' && idea.completion?.postLinks?.length ? (
        <div className="relative z-10">
          <EyebrowLabel>Posts</EyebrowLabel>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-700 dark:text-gray-200">
            {idea.completion.postLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                {BRAND_PROJECT_POST_PLATFORM_LABEL[link.platform]}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-2">
        {idea.status === 'generated' ? (
          <>
            <Button type="button" size="sm" variant="ghost" onClick={onReject}>
              Reject
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onComplete}>
              Mark complete
            </Button>
          </>
        ) : null}
        {showViewKitForTerminal ? (
          <Link
            to={`${detailPath}#build-kit`}
            className={cn(
              'relative z-10 inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark'
            )}
          >
            View build kit
          </Link>
        ) : null}
      </div>
    </article>
  );
}
