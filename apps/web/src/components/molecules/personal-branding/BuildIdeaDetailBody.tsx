import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  Clapperboard,
  ExternalLink,
  GraduationCap,
  Layers,
  Link2,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import { ClampedExpandableText } from '@/components/molecules/personal-branding/ClampedExpandableText';
import { DEFAULT_MAX_VISIBLE_TAGS } from '@/components/molecules/personal-branding/ContentIdeaTagChips';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import { IDEA_CARD_SUMMARY_LINES } from '@/lib/personal-branding/personal-branding-surfaces';
import {
  buildIdeaHighlightGridClassName,
  buildIdeaSectionCardClassName,
  buildIdeaSectionIconClassName,
  buildIdeaSourceRowClassName,
} from '@/lib/personal-branding/build-idea-detail-surfaces';
import { cn } from '@/lib/utils';
import {
  linkAccentClassName,
  pbBodySecondaryClassName,
  pbFocusVisibleRingClassName,
  pbMetaClassName,
  statusPillClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import type {
  BrandProjectBackgroundKnowledge,
  BrandProjectIdea,
  BrandProjectTechnology,
  BrandProjectTrendSource,
} from '@/types/api/personal-branding.dto';

const BACKGROUND_PREVIEW_COUNT = 3;

const X_POST_HOSTS = new Set(['x.com', 'twitter.com', 'mobile.twitter.com']);

export type BuildIdeaDetailBodyProps = Pick<
  BrandProjectIdea,
  | 'appealSummary'
  | 'demoHook'
  | 'demoCritique'
  | 'tutorialAngle'
  | 'backgroundKnowledge'
  | 'technologies'
  | 'trendSources'
>;

function hiddenTechnologyAriaName(tech: BrandProjectTechnology): string {
  return tech.role ? `${tech.name} (${tech.role})` : tech.name;
}

function demoHookEyebrow(demoHook: string): 'Demo' | 'Post' {
  const urlMatches = demoHook.match(/https?:\/\/[^\s]+/gi);
  if (!urlMatches) {
    return 'Demo';
  }
  for (const raw of urlMatches) {
    try {
      const host = new URL(raw).hostname.replace(/^www\./i, '').toLowerCase();
      if (X_POST_HOSTS.has(host)) {
        return 'Post';
      }
    } catch {
      // ponytail: skip malformed URLs in demo hook copy
    }
  }
  return 'Demo';
}

function trendSourceDomain(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed).hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

function BuildIdeaClampedSection({
  eyebrow,
  icon,
  children,
}: {
  eyebrow: string;
  icon: ReactNode;
  children: string;
}) {
  return (
    <div className={buildIdeaSectionCardClassName}>
      <EyebrowLabel className="flex items-center gap-1.5">
        {icon}
        {eyebrow}
      </EyebrowLabel>
      <ClampedExpandableText
        lines={IDEA_CARD_SUMMARY_LINES}
        className={cn('mt-1.5', pbBodySecondaryClassName)}
      >
        {children}
      </ClampedExpandableText>
    </div>
  );
}

function BackgroundSection({ rows }: { rows: BrandProjectBackgroundKnowledge[] }) {
  const [expanded, setExpanded] = useState(false);
  const overflowCount = rows.length - BACKGROUND_PREVIEW_COUNT;
  const visibleRows =
    overflowCount > 0 && !expanded ? rows.slice(0, BACKGROUND_PREVIEW_COUNT) : rows;

  return (
    <div className={buildIdeaSectionCardClassName}>
      <EyebrowLabel className="flex items-center gap-1.5">
        <BookOpen className={buildIdeaSectionIconClassName} aria-hidden />
        Background
      </EyebrowLabel>
      <ul
        className={cn(
          'mt-1.5 list-disc space-y-1.5 pl-5 marker:text-gray-300 dark:marker:text-gray-600',
          pbBodySecondaryClassName
        )}
      >
        {visibleRows.map((row) => (
          <li key={row.topic}>
            <span className="font-medium text-gray-800 dark:text-gray-100">{row.topic}</span> —{' '}
            {row.why}
          </li>
        ))}
      </ul>
      {overflowCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className={cn(
            'mt-2 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            pbFocusVisibleRingClassName
          )}
        >
          {expanded ? 'Show less' : `Show ${overflowCount} more`}
        </button>
      ) : null}
    </div>
  );
}

function StackSection({ technologies }: { technologies: BrandProjectTechnology[] }) {
  const visibleTechnologies = technologies.slice(0, DEFAULT_MAX_VISIBLE_TAGS);
  const hiddenTechnologies = technologies.slice(DEFAULT_MAX_VISIBLE_TAGS);
  const hiddenTechLabel = hiddenTechnologies.map(hiddenTechnologyAriaName).join(', ');

  return (
    <div className={buildIdeaSectionCardClassName}>
      <EyebrowLabel className="flex items-center gap-1.5">
        <Layers className={buildIdeaSectionIconClassName} aria-hidden />
        Stack
      </EyebrowLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {visibleTechnologies.map((tech) => (
          <span
            key={tech.name}
            className={statusPillClassName(tech.isTrending ? 'info' : 'neutral')}
          >
            <span className="font-semibold">{tech.name}</span>
            {tech.role ? <span className="font-normal opacity-80">&nbsp;· {tech.role}</span> : null}
            {tech.isTrending ? <span className="font-normal">&nbsp;· trending</span> : null}
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
    </div>
  );
}

function SourceRow({ source }: { source: BrandProjectTrendSource }) {
  const url = source.url?.trim();
  const domain = trendSourceDomain(url);
  const hasOutboundLink = Boolean(url && domain);

  return (
    <li className={buildIdeaSourceRowClassName}>
      {domain ? (
        <span className={cn(pbMetaClassName, 'shrink-0 tabular-nums')}>{domain}</span>
      ) : null}
      <span
        className={cn('min-w-0 flex-1 break-words', pbBodySecondaryClassName)}
        title={source.title}
      >
        {source.title}
      </span>
      {hasOutboundLink ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open source: ${source.title}`}
          className={cn(linkAccentClassName, 'inline-flex shrink-0 items-center rounded-md p-1.5')}
        >
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </li>
  );
}

function SourcesSection({ sources }: { sources: BrandProjectTrendSource[] }) {
  return (
    <div className={buildIdeaSectionCardClassName}>
      <EyebrowLabel className="flex items-center gap-1.5">
        <Link2 className={buildIdeaSectionIconClassName} aria-hidden />
        Sources
      </EyebrowLabel>
      <ul className="mt-2 space-y-2">
        {sources.map((source) => (
          <SourceRow key={source.radarItemId ?? source.title} source={source} />
        ))}
      </ul>
    </div>
  );
}

export function BuildIdeaDetailBody({
  appealSummary,
  demoHook,
  demoCritique,
  tutorialAngle,
  backgroundKnowledge,
  technologies,
  trendSources,
}: BuildIdeaDetailBodyProps) {
  const hasAppeal = Boolean(appealSummary?.trim());
  const hasDemo = Boolean(demoHook?.trim());
  const hasCritique = Boolean(demoCritique?.trim());
  const hasTutorial = Boolean(tutorialAngle?.trim());
  const hasBackground = backgroundKnowledge.length > 0;
  const hasStack = technologies.length > 0;
  const hasSources = trendSources.length > 0;
  const hasHighlights = hasAppeal || hasDemo || hasCritique || hasTutorial;

  if (!hasHighlights && !hasBackground && !hasStack && !hasSources) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {hasHighlights ? (
        <div className={buildIdeaHighlightGridClassName}>
          {hasAppeal ? (
            <BuildIdeaClampedSection
              eyebrow="Why it works"
              icon={<Sparkles className={buildIdeaSectionIconClassName} aria-hidden />}
            >
              {appealSummary!.trim()}
            </BuildIdeaClampedSection>
          ) : null}

          {hasDemo ? (
            <BuildIdeaClampedSection
              eyebrow={demoHookEyebrow(demoHook!.trim())}
              icon={<Clapperboard className={buildIdeaSectionIconClassName} aria-hidden />}
            >
              {demoHook!.trim()}
            </BuildIdeaClampedSection>
          ) : null}

          {hasCritique ? (
            <BuildIdeaClampedSection
              eyebrow="Critic"
              icon={<ListOrdered className={buildIdeaSectionIconClassName} aria-hidden />}
            >
              {demoCritique!.trim()}
            </BuildIdeaClampedSection>
          ) : null}

          {hasTutorial ? (
            <BuildIdeaClampedSection
              eyebrow="Tutorial"
              icon={<GraduationCap className={buildIdeaSectionIconClassName} aria-hidden />}
            >
              {tutorialAngle!.trim()}
            </BuildIdeaClampedSection>
          ) : null}
        </div>
      ) : null}

      {hasBackground ? <BackgroundSection rows={backgroundKnowledge} /> : null}

      {hasStack ? <StackSection technologies={technologies} /> : null}

      {hasSources ? <SourcesSection sources={trendSources} /> : null}
    </div>
  );
}
