import { Children, cloneElement, isValidElement, useMemo } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Textarea } from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import PlatformRuleInfluencePanel from '@/components/molecules/personal-branding/PlatformRuleInfluencePanel';
import PlatformPreviewChrome from '@/components/molecules/personal-branding/PlatformPreviewChrome';
import type {
  PlatformRuleSetInfluenceItem,
  PlatformRuleSetPreviewResult,
  BrandPlatform,
} from '@/types/api/personal-branding.dto';

function highlightText(text: string, activeExcerpt: string | null): ReactNode {
  if (!activeExcerpt) return text;
  const index = text.indexOf(activeExcerpt);
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-amber-200/80 px-0.5 text-gray-900 dark:bg-amber-500/30 dark:text-gray-100">
        {activeExcerpt}
      </mark>
      {text.slice(index + activeExcerpt.length)}
    </>
  );
}

function highlightChildren(children: ReactNode, activeExcerpt: string | null): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return highlightText(child, activeExcerpt);
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
      return cloneElement(
        child,
        {},
        highlightChildren((child.props as { children?: ReactNode }).children, activeExcerpt)
      );
    }
    return child;
  });
}

function formatPreviewStage(stage: string): string {
  return (
    {
      queued: 'Queued',
      drafting: 'Drafting sample',
      critiquing: 'Checking requirements',
      polishing: 'Polishing preview',
      validating: 'Validating preview',
      cancelling: 'Cancelling preview',
    }[stage] ?? 'Working on preview'
  );
}

interface PlatformRuleSetPreviewPanelProps {
  sampleText: string;
  onSampleTextChange: (value: string) => void;
  preview: PlatformRuleSetPreviewResult | null;
  isLoading: boolean;
  error: string | null;
  isStale: boolean;
  influences: PlatformRuleSetInfluenceItem[];
  influenceLoading: boolean;
  influenceError: string | null;
  activeExcerpt: string | null;
  onSelectExcerpt: (excerpt: string | null) => void;
  platform?: BrandPlatform;
  jobStage?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
}

export default function PlatformRuleSetPreviewPanel({
  sampleText,
  onSampleTextChange,
  preview,
  isLoading,
  error,
  isStale,
  influences,
  influenceLoading,
  influenceError,
  activeExcerpt,
  onSelectExcerpt,
  platform = 'linkedin',
  jobStage,
  onCancel,
  onRetry,
}: PlatformRuleSetPreviewPanelProps) {
  const sampleId = 'platform-rule-set-sample-text';
  const validationIssues = preview?.validationIssues ?? [];
  const highlightedComponents = useMemo(
    () => ({
      p: ({ children, ...props }: ComponentPropsWithoutRef<'p'>) => (
        <p {...props}>{highlightChildren(children, activeExcerpt)}</p>
      ),
      li: ({ children, ...props }: ComponentPropsWithoutRef<'li'>) => (
        <li {...props}>{highlightChildren(children, activeExcerpt)}</li>
      ),
      h1: ({ children, ...props }: ComponentPropsWithoutRef<'h1'>) => (
        <h1 {...props}>{highlightChildren(children, activeExcerpt)}</h1>
      ),
      h2: ({ children, ...props }: ComponentPropsWithoutRef<'h2'>) => (
        <h2 {...props}>{highlightChildren(children, activeExcerpt)}</h2>
      ),
      h3: ({ children, ...props }: ComponentPropsWithoutRef<'h3'>) => (
        <h3 {...props}>{highlightChildren(children, activeExcerpt)}</h3>
      ),
      h4: ({ children, ...props }: ComponentPropsWithoutRef<'h4'>) => (
        <h4 {...props}>{highlightChildren(children, activeExcerpt)}</h4>
      ),
      h5: ({ children, ...props }: ComponentPropsWithoutRef<'h5'>) => (
        <h5 {...props}>{highlightChildren(children, activeExcerpt)}</h5>
      ),
      h6: ({ children, ...props }: ComponentPropsWithoutRef<'h6'>) => (
        <h6 {...props}>{highlightChildren(children, activeExcerpt)}</h6>
      ),
    }),
    [activeExcerpt]
  );

  return (
    <div
      className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Rule set preview</h3>
        {isStale && preview && !isLoading ? (
          <span className="text-xs text-amber-700 dark:text-amber-300">
            Draft changed — run test again
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor={sampleId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sample
        </label>
        <Textarea
          id={sampleId}
          aria-label="Sample text for rule test"
          value={sampleText}
          onChange={(e) => onSampleTextChange(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Paste your draft, then click Test this rule set.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
          <p>{jobStage ? `${formatPreviewStage(jobStage)}…` : 'Generating preview…'}</p>
          {onCancel ? (
            <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
          {onRetry ? (
            <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {preview && !isLoading ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-700 dark:text-gray-300">Preview</p>
          <PlatformPreviewChrome
            platform={platform}
            content={preview.body}
            characterMinimum={preview.appliedPolicy.characterMinimum}
            characterLimit={preview.appliedPolicy.characterLimit}
            readTimeMinimumMinutes={preview.appliedPolicy.readTimeMinimumMinutes}
            readTimeLimitMinutes={preview.appliedPolicy.readTimeLimitMinutes}
          >
            <MarkdownRenderer
              content={preview.body}
              className="prose-sm max-w-none dark:prose-invert"
              components={highlightedComponents}
            />
          </PlatformPreviewChrome>
          {validationIssues.length > 0 ? (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
              role="status"
              aria-label="Preview validation issues"
            >
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                Preview may still violate:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800 dark:text-amber-100">
                {validationIssues.map((issue) => (
                  <li key={issue.id}>
                    {issue.message}
                    {issue.requirementLine ? (
                      <span className="block pl-2 text-amber-700/80 dark:text-amber-200/80">
                        Requirement: “{issue.requirementLine}”
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <PlatformRuleInfluencePanel
            influences={influences}
            isLoading={influenceLoading}
            error={influenceError}
            activeExcerpt={activeExcerpt}
            onSelectExcerpt={onSelectExcerpt}
            isStale={isStale}
          />
        </div>
      ) : null}
    </div>
  );
}
