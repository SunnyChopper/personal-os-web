import type { AssistantModelCatalogEntry } from '@/types/chatbot';
import type { ManualModelSortKey } from '@/lib/assistant/model-picker-utils';

type Mode = 'manual' | 'auto';

export function ModelTraitMicroBars({
  speedScore,
  costScore,
  qualityScore,
}: Pick<AssistantModelCatalogEntry, 'speedScore' | 'costScore' | 'qualityScore'>) {
  const bar = (v: number, abbrev: string, title: string) => (
    <span
      title={`${title}: ${v}/10`}
      className="inline-flex items-center gap-0.5 text-[9px] text-gray-500 dark:text-gray-400 tabular-nums"
    >
      <span className="w-2 shrink-0">{abbrev}</span>
      <span className="w-7 h-1 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden inline-block align-middle">
        <span
          className="block h-full bg-emerald-600/85 dark:bg-emerald-500/80 rounded-sm"
          style={{ width: `${(v / 10) * 100}%` }}
        />
      </span>
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
      {bar(speedScore, 'S', 'Speed')}
      {bar(costScore, 'C', 'Cost efficiency (higher = cheaper to run)')}
      {bar(qualityScore, 'I', 'Intelligence')}
    </div>
  );
}

export function AssistantModelModeToggle(props: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
  variant?: 'default' | 'settings' | 'quiet';
}) {
  const { mode, onChange, disabled, variant = 'default' } = props;
  const isSettings = variant === 'settings';
  const isQuiet = variant === 'quiet';
  return (
    <>
      <p
        className={`font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 ${
          isSettings ? 'text-xs' : 'text-xs'
        }`}
      >
        Mode
      </p>
      <div
        className={`flex gap-2 ${
          isSettings
            ? 'mb-4 p-1 rounded-lg bg-gray-100 dark:bg-gray-900/60'
            : isQuiet
              ? 'mb-2'
              : 'mb-3'
        }`}
      >
        {(['manual', 'auto'] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m)}
            className={`flex-1 font-medium capitalize min-h-[44px] sm:min-h-0 ${
              isSettings
                ? `px-3 py-2.5 rounded-md text-sm ${
                    mode === m
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                : isQuiet
                  ? `px-2 py-2 sm:py-1.5 rounded-md text-xs border ${
                      mode === m
                        ? 'border-primary/30 bg-primary/10 text-primary dark:bg-primary/15'
                        : 'border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`
                  : `px-2 py-2 sm:py-1.5 rounded-md text-xs ${
                      mode === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`
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
  variant?: 'default' | 'muted';
}) {
  const { sortBy, onSortByChange, disabled, variant = 'default' } = props;
  const isMuted = variant === 'muted';
  return (
    <>
      <p
        className={`uppercase tracking-wide ${
          isMuted
            ? 'text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1'
            : 'text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5'
        }`}
      >
        Sort list by
      </p>
      <div className={`flex flex-wrap ${isMuted ? 'gap-0.5 mb-2' : 'gap-1 mb-3'}`}>
        {SORT_OPTIONS.map(([key, lbl]) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onSortByChange(key)}
            className={`rounded font-medium min-h-[40px] sm:min-h-0 ${
              isMuted
                ? `px-1.5 py-1 text-[10px] ${
                    sortBy === key
                      ? 'bg-slate-500/90 text-white dark:bg-slate-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`
                : `px-2 py-1.5 text-[11px] ${
                    sortBy === key
                      ? 'bg-slate-600 text-white dark:bg-slate-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </>
  );
}
