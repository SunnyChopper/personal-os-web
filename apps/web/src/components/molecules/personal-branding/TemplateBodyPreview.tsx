import { useEffect, useMemo, useState } from 'react';
import { parseTemplateBodyStructure } from '@/lib/personal-branding/parse-template-body-structure';
import { cn } from '@/lib/utils';

export type TemplateBodyPreviewView = 'structure' | 'raw';

export interface TemplateBodyPreviewProps {
  body: string;
  className?: string;
  maxHeightClass?: string;
}

function viewToggleClassName(active: boolean): string {
  return cn(
    'rounded px-2 py-0.5 text-xs font-medium transition-colors',
    active
      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
  );
}

export default function TemplateBodyPreview({
  body,
  className,
  maxHeightClass = 'max-h-40',
}: TemplateBodyPreviewProps) {
  const structure = useMemo(() => parseTemplateBodyStructure(body), [body]);
  const [view, setView] = useState<TemplateBodyPreviewView>(() =>
    structure ? 'structure' : 'raw'
  );

  useEffect(() => {
    setView(structure ? 'structure' : 'raw');
  }, [body, structure]);

  const activeView = structure ? view : 'raw';

  return (
    <div className={cn('space-y-2', className)}>
      {structure ? (
        <div
          className="inline-flex rounded-md border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800"
          role="group"
          aria-label="Template body view"
        >
          <button
            type="button"
            className={viewToggleClassName(activeView === 'structure')}
            aria-pressed={activeView === 'structure'}
            onClick={() => setView('structure')}
          >
            Structure
          </button>
          <button
            type="button"
            className={viewToggleClassName(activeView === 'raw')}
            aria-pressed={activeView === 'raw'}
            onClick={() => setView('raw')}
          >
            Raw
          </button>
        </div>
      ) : null}

      {activeView === 'structure' && structure ? (
        <div
          className={cn(
            maxHeightClass,
            'space-y-2 overflow-auto rounded bg-gray-50 p-2 dark:bg-gray-900'
          )}
        >
          {structure.segments.map((segment, index) => (
            <div
              key={`${segment.label}-${index}`}
              className="rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-950/60"
            >
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {segment.label}
              </p>
              {segment.body ? (
                <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">
                  {segment.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <pre
          className={cn(
            maxHeightClass,
            'overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300'
          )}
        >
          {body}
        </pre>
      )}
    </div>
  );
}
