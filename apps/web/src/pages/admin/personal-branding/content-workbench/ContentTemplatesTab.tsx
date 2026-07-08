import { Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type {
  BrandPlatform,
  ContentTemplate,
  ContentTemplateCandidate,
  ContentTemplateExtractionContextStats,
  ContentType,
  TemplateSourceKind,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import {
  PageCard,
  emptyStateCardClassName,
  gridItemCardClassName,
} from '../PersonalBrandingPageTemplate';
import { cn } from '@/lib/utils';

const SOURCE_KIND_OPTIONS: { id: TemplateSourceKind; label: string; disabled?: boolean }[] = [
  { id: 'GENERIC_URL', label: 'Generic URL' },
  { id: 'MEDIUM_ARTICLE', label: 'Medium article' },
];

interface ContentTemplatesTabProps {
  templates: ContentTemplate[];
  candidates: ContentTemplateCandidate[];
  templatesLoading: boolean;
  candidatesLoading: boolean;
  sourceKind: TemplateSourceKind;
  onSourceKindChange: (kind: TemplateSourceKind) => void;
  sourceUrl: string;
  onSourceUrlChange: (url: string) => void;
  mediumApiKey: string;
  onMediumApiKeyChange: (key: string) => void;
  hasMediumApiKey: boolean;
  isSavingSettings: boolean;
  onSaveMediumApiKey: () => void;
  isExtracting: boolean;
  extractError: string | null;
  lastExtractionStats: ContentTemplateExtractionContextStats | null;
  onExtract: () => void;
  approvingId: string | null;
  retryingId: string | null;
  onCreateTemplate: () => void;
  onEditTemplate: (template: ContentTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApprove: (candidateId: string) => void;
  onReject: (candidate: ContentTemplateCandidate) => void;
  onRetry: (candidate: ContentTemplateCandidate) => void;
}

function formatOptionalLabel(
  contentType?: ContentType | null,
  platform?: BrandPlatform | null
): string {
  const parts: string[] = [];
  if (contentType) parts.push(CONTENT_TYPE_LABELS[contentType]);
  if (platform) parts.push(BRAND_PLATFORM_LABELS[platform]);
  return parts.length > 0 ? parts.join(' · ') : 'Any format / platform';
}

export default function ContentTemplatesTab({
  templates,
  candidates,
  templatesLoading,
  candidatesLoading,
  sourceKind,
  onSourceKindChange,
  sourceUrl,
  onSourceUrlChange,
  mediumApiKey,
  onMediumApiKeyChange,
  hasMediumApiKey,
  isSavingSettings,
  onSaveMediumApiKey,
  isExtracting,
  extractError,
  lastExtractionStats,
  onExtract,
  approvingId,
  retryingId,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onApprove,
  onReject,
  onRetry,
}: ContentTemplatesTabProps) {
  const canExtract = Boolean(sourceUrl.trim()) && !isExtracting;

  return (
    <div className="space-y-6">
      <PageCard className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Template library</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Reusable structural skeletons for drafts and other content generation features.
            </p>
          </div>
          <Button type="button" size="sm" onClick={onCreateTemplate} className="inline-flex gap-2">
            <Plus size={16} />
            New template
          </Button>
        </div>

        {templatesLoading ? (
          <p className="text-sm text-gray-500">Loading templates…</p>
        ) : templates.length === 0 ? (
          <div className={emptyStateCardClassName}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No saved templates yet. Create one manually or extract from a URL below.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <article key={template.id} className={cn(gridItemCardClassName, 'space-y-2')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{template.title}</h3>
                    <p className="text-xs text-gray-500">
                      {formatOptionalLabel(template.contentType, template.platform)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${template.title}`}
                      onClick={() => onEditTemplate(template)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${template.title}`}
                      onClick={() => onDeleteTemplate(template.id)}
                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {template.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                ) : null}
                <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {template.templateBody}
                </pre>
              </article>
            ))}
          </div>
        )}
      </PageCard>

      <PageCard className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Extract from URL</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Scrape a public page or Medium article and let the agent propose reusable templates.
            Approve, reject with feedback, or retry with feedback before saving.
          </p>
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Source type</span>
          <div className="flex flex-wrap gap-2">
            {SOURCE_KIND_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                  sourceKind === option.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-100'
                    : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
                  option.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <input
                  type="radio"
                  name="template-source-kind"
                  value={option.id}
                  checked={sourceKind === option.id}
                  disabled={option.disabled}
                  onChange={() => onSourceKindChange(option.id)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
            <span className="inline-flex items-center rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-400 dark:border-gray-600">
              X post — coming soon
            </span>
          </div>
        </div>

        {sourceKind === 'MEDIUM_ARTICLE' ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <p>
              Medium extraction uses your RapidAPI Medium reader key.
              {hasMediumApiKey ? ' A key is configured.' : ' Add a key below to enable extraction.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="password"
                value={mediumApiKey}
                onChange={(e) => onMediumApiKeyChange(e.target.value)}
                placeholder="RapidAPI key"
                className="min-w-[220px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isSavingSettings}
                onClick={onSaveMediumApiKey}
              >
                {isSavingSettings ? 'Saving…' : hasMediumApiKey ? 'Update key' : 'Save key'}
              </Button>
            </div>
          </div>
        ) : null}

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Source URL</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => onSourceUrlChange(e.target.value)}
            placeholder="https://example.com/article or https://medium.com/..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </label>

        {extractError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{extractError}</p>
        ) : null}
        {lastExtractionStats ? (
          <p className="text-xs text-gray-500">
            Last run used {lastExtractionStats.rejectedFeedbackCount} rejection feedback entries.
          </p>
        ) : null}

        <Button
          type="button"
          size="sm"
          disabled={!canExtract || (sourceKind === 'MEDIUM_ARTICLE' && !hasMediumApiKey)}
          onClick={onExtract}
          className="inline-flex items-center gap-2"
        >
          {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isExtracting ? 'Extracting…' : 'Extract templates'}
        </Button>
      </PageCard>

      <PageCard className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Review candidates</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Generated proposals stay here until you approve them into the library or reject them.
          </p>
        </div>

        {candidatesLoading ? (
          <p className="text-sm text-gray-500">Loading candidates…</p>
        ) : candidates.length === 0 ? (
          <div className={emptyStateCardClassName}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No pending template candidates. Run extraction above to generate proposals.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {candidates.map((candidate) => (
              <article key={candidate.id} className={cn(gridItemCardClassName, 'space-y-3')}>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{candidate.title}</h3>
                  <p className="text-xs text-gray-500">
                    {formatOptionalLabel(candidate.contentType, candidate.platform)}
                  </p>
                </div>
                {candidate.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {candidate.description}
                  </p>
                ) : null}
                {candidate.extractionNotes ? (
                  <p className="text-xs italic text-gray-500">{candidate.extractionNotes}</p>
                ) : null}
                <pre className="max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {candidate.templateBody}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={approvingId === candidate.id}
                    onClick={() => onApprove(candidate.id)}
                  >
                    {approvingId === candidate.id ? 'Saving…' : 'Approve'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onRetry(candidate)}
                    disabled={retryingId === candidate.id}
                  >
                    {retryingId === candidate.id ? 'Retrying…' : 'Retry with feedback'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onReject(candidate)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </PageCard>
    </div>
  );
}
