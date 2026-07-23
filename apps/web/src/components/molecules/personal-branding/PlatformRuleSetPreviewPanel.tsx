import type { PlatformRuleSetPreviewResult } from '@/types/api/personal-branding.dto';

interface PlatformRuleSetPreviewPanelProps {
  preview: PlatformRuleSetPreviewResult | null;
  isLoading: boolean;
  error: string | null;
  isStale: boolean;
}

export default function PlatformRuleSetPreviewPanel({
  preview,
  isLoading,
  error,
  isStale,
}: PlatformRuleSetPreviewPanelProps) {
  if (!preview && !isLoading && !error) {
    return null;
  }

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

      {isLoading ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Generating preview…</p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {preview && !isLoading ? (
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">Sample</p>
            <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
              {preview.sampleText}
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">Preview</p>
            <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{preview.body}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
