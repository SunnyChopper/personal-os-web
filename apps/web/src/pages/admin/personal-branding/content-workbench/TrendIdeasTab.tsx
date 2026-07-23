import { ExternalLink, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type { BrandPlatform, ContentIdea } from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import {
  emptyStateCardClassName,
  gridItemCardClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { PageCard } from '../PersonalBrandingPageTemplate';
import { cn } from '@/lib/utils';
import { linkAccentClassName } from '../personal-branding-ui';
import { ContentIdeaWhyCreateSection } from './ContentIdeaWhyCreateSection';

interface TrendIdeasTabProps {
  ideas: ContentIdea[];
  isLoading: boolean;
  approvingId: string | null;
  onApprove: (idea: ContentIdea) => void;
  onReject: (idea: ContentIdea) => void;
}

export default function TrendIdeasTab({
  ideas,
  isLoading,
  approvingId,
  onApprove,
  onReject,
}: TrendIdeasTabProps) {
  return (
    <div className="space-y-6">
      <PageCard className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Trend Ideas</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Review AI content ideas grounded in Trend Stream signals. Approve to generate a Sandbox
            draft, or reject with feedback to improve future brainstorms.
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          To generate new ideas, select up to 10 cards on Signal Radar → Trend Stream and choose{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Brainstorm content ideas
          </span>
          .
        </p>
      </PageCard>

      <section className="space-y-4">
        <h3 className="text-base font-medium text-gray-900 dark:text-white">
          Trend-sourced content ideas
        </h3>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading ideas…</p>
        ) : ideas.length === 0 ? (
          <PageCard className={emptyStateCardClassName}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No Trend Stream ideas yet. Select cards in Signal Radar and brainstorm content ideas.
            </p>
          </PageCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <article key={idea.id} className={cn(gridItemCardClassName, 'flex flex-col')}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{idea.title}</h3>
                  <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                    {CONTENT_TYPE_LABELS[idea.contentType]}
                  </span>
                </div>
                {idea.summary ? (
                  <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
                    {idea.summary}
                  </p>
                ) : null}
                {idea.rationale ? <ContentIdeaWhyCreateSection rationale={idea.rationale} /> : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {idea.targetPlatform ? (
                    <span>{BRAND_PLATFORM_LABELS[idea.targetPlatform as BrandPlatform]}</span>
                  ) : null}
                  {(idea.radarItemSnapshots ?? []).map((snapshot) => {
                    const link = snapshot.url;
                    const label = snapshot.sourceName
                      ? `${snapshot.title} · ${snapshot.sourceName}`
                      : snapshot.title;
                    if (link) {
                      return (
                        <a
                          key={snapshot.id}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            'inline-flex max-w-full items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
                            linkAccentClassName
                          )}
                        >
                          <span className="truncate">{label}</span>
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                        </a>
                      );
                    }
                    return (
                      <span
                        key={snapshot.id}
                        className="max-w-full truncate rounded bg-sky-50 px-2 py-0.5 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                      >
                        {label}
                      </span>
                    );
                  })}
                  {idea.tags.map((tag) => (
                    <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onApprove(idea)}
                    disabled={approvingId === idea.id}
                    className="flex-1"
                  >
                    {approvingId === idea.id ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Generating…
                      </span>
                    ) : (
                      'Generate draft & open in Sandbox'
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(idea)}
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
