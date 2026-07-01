import { useRef } from 'react';
import { cn } from '@/lib/utils';
import type { CareerResumeTemplate } from '@/types/api/career.types';

type Props = {
  templates: CareerResumeTemplate[];
  selectedId: string;
  onSelect: (templateId: string) => void;
  onImport: (file: File) => void;
  importBusy?: boolean;
  importWarnings?: string[];
};

export function ResumeTemplateGallery({
  templates,
  selectedId,
  onSelect,
  onImport,
  importBusy,
  importWarnings,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Resume template
        </span>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".docx,.html,.htm,.zip"
            className="hidden"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) onImport(f);
              ev.target.value = '';
            }}
          />
          <button
            type="button"
            className="text-sm px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            disabled={importBusy}
            onClick={() => fileRef.current?.click()}
          >
            {importBusy ? 'Importing…' : 'Import template'}
          </button>
        </div>
      </div>
      {importWarnings?.length ? (
        <ul className="text-xs text-amber-700 dark:text-amber-300 list-disc pl-4 space-y-0.5">
          {importWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {templates.map((t) => {
          const selected = t.templateId === selectedId;
          return (
            <button
              key={t.templateId}
              type="button"
              onClick={() => onSelect(t.templateId)}
              className={cn(
                'text-left rounded-lg border p-2 transition-colors',
                selected
                  ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              )}
            >
              <div
                className="h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded mb-2 overflow-hidden"
                dangerouslySetInnerHTML={t.thumbnailSvg ? { __html: t.thumbnailSvg } : undefined}
              >
                {!t.thumbnailSvg ? <span className="text-xs text-gray-400">No preview</span> : null}
              </div>
              <div className="text-sm font-medium truncate">{t.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wide px-1 rounded',
                    t.isBuiltIn
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      : 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200'
                  )}
                >
                  {t.isBuiltIn ? 'Built-in' : 'Custom'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
