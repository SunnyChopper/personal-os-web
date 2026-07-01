import type { TaskEnergyLevel, TaskExecutionWindow } from '@/types/growth-system';
import {
  TASK_ENERGY_LEVELS,
  TASK_ENERGY_LEVEL_LABELS,
  TASK_EXECUTION_WINDOWS,
  TASK_EXECUTION_WINDOW_LABELS,
} from '@/constants/growth-system';

const idlePillClass =
  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';
const selectedEnergyClass =
  'bg-slate-200 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-slate-600';
const selectedWindowClass =
  'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 ring-1 ring-indigo-200 dark:ring-indigo-800';

export interface TaskContextVibePillsProps {
  energyLevel?: TaskEnergyLevel | null;
  executionWindow?: TaskExecutionWindow | null;
  onEnergyChange?: (value: TaskEnergyLevel | null | undefined) => void;
  onExecutionWindowChange?: (value: TaskExecutionWindow | null | undefined) => void;
  readOnly?: boolean;
  /** Inline pills without section heading (e.g. task detail header). */
  compact?: boolean;
  className?: string;
}

function PillRow<T extends string>({
  label,
  options,
  labels,
  value,
  selectedClass,
  readOnly,
  onSelect,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value?: T | null;
  selectedClass: string;
  readOnly?: boolean;
  onSelect?: (next: T | null) => void;
}) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = value === opt;
          if (readOnly) {
            if (!selected) return null;
            return (
              <span key={opt} className={`px-3 py-1.5 text-sm rounded-full ${selectedClass}`}>
                {labels[opt]}
              </span>
            );
          }
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect?.(selected ? null : opt)}
              className={`px-3 py-1.5 text-sm rounded-full transition ${
                selected ? selectedClass : idlePillClass
              }`}
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TaskContextVibePills({
  energyLevel,
  executionWindow,
  onEnergyChange,
  onExecutionWindowChange,
  readOnly = false,
  compact = false,
  className = '',
}: TaskContextVibePillsProps) {
  if (readOnly && !energyLevel && !executionWindow) {
    return null;
  }

  if (compact && readOnly) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
        {energyLevel ? (
          <span className={`px-2 py-0.5 text-xs rounded-full ${selectedEnergyClass}`}>
            {TASK_ENERGY_LEVEL_LABELS[energyLevel]}
          </span>
        ) : null}
        {executionWindow ? (
          <span className={`px-2 py-0.5 text-xs rounded-full ${selectedWindowClass}`}>
            {TASK_EXECUTION_WINDOW_LABELS[executionWindow]}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {!compact ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Context & vibe
        </p>
      ) : null}
      {(readOnly ? !!energyLevel : true) && (
        <PillRow
          label="Energy"
          options={TASK_ENERGY_LEVELS}
          labels={TASK_ENERGY_LEVEL_LABELS}
          value={energyLevel}
          selectedClass={selectedEnergyClass}
          readOnly={readOnly}
          onSelect={onEnergyChange}
        />
      )}
      {(readOnly ? !!executionWindow : true) && (
        <PillRow
          label="Best window"
          options={TASK_EXECUTION_WINDOWS}
          labels={TASK_EXECUTION_WINDOW_LABELS}
          value={executionWindow}
          selectedClass={selectedWindowClass}
          readOnly={readOnly}
          onSelect={onExecutionWindowChange}
        />
      )}
    </div>
  );
}
