import type { ManualModelSortKey } from '@/lib/assistant/model-picker-utils';

type Mode = 'manual' | 'auto';

export function AssistantModelModeToggle(props: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}) {
  const { mode, onChange, disabled } = props;
  return (
    <>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Mode
      </p>
      <div className="flex gap-2 mb-3">
        {(['manual', 'auto'] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m)}
            className={`flex-1 px-2 py-2 sm:py-1.5 rounded-md text-xs font-medium capitalize min-h-[44px] sm:min-h-0 ${
              mode === m
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </>
  );
}

const SORT_OPTIONS: Array<[ManualModelSortKey, string]> = [
  ['default', 'Default'],
  ['speed', 'Speed'],
  ['cost', 'Cost'],
  ['intelligence', 'Intel'],
  ['balanced', 'Balanced'],
  ['value', 'Value'],
];

export function AssistantModelManualSortChips(props: {
  sortBy: ManualModelSortKey;
  onSortByChange: (key: ManualModelSortKey) => void;
  disabled?: boolean;
}) {
  const { sortBy, onSortByChange, disabled } = props;
  return (
    <>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        Sort list by
      </p>
      <div className="flex flex-wrap gap-1 mb-3">
        {SORT_OPTIONS.map(([key, lbl]) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onSortByChange(key)}
            className={`px-2 py-1.5 rounded text-[11px] font-medium min-h-[40px] sm:min-h-0 ${
              sortBy === key
                ? 'bg-slate-600 text-white dark:bg-slate-500'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </>
  );
}
