import { useEffect, useId, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import {
  ADVANCED_EXECUTION_LOG_FILTER_KEYS,
  hasAdvancedExecutionLogFilters,
  hasAnyExecutionLogFilter,
  isCoachReliabilityFilterActive,
  PRIMARY_EXECUTION_LOG_FILTER_KEYS,
  type ExecutionLogFilterFields,
} from '@/lib/observability/execution-log-filters';
import {
  executionLogFilterLabelClassName,
  executionLogFiltersAdvancedGridClassName,
  executionLogFiltersPanelClassName,
  executionLogFiltersPrimaryGridClassName,
} from '@/lib/observability/execution-log-surfaces';
import { cn } from '@/lib/utils';

export type ExecutionLogFiltersProps = {
  filters: ExecutionLogFilterFields;
  onFilterChange: (key: keyof ExecutionLogFilterFields, value: string) => void;
  onClearFilters: () => void;
  onApplyCoachReliabilityPreset?: () => void;
};

function FilterField({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: keyof ExecutionLogFilterFields;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = `exec-filter-${fieldKey}`;

  return (
    <label htmlFor={inputId} className={executionLogFilterLabelClassName}>
      {fieldKey}
      <FormInput
        id={inputId}
        className="font-mono text-sm min-w-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}

export default function ExecutionLogFilters({
  filters,
  onFilterChange,
  onClearFilters,
  onApplyCoachReliabilityPreset,
}: ExecutionLogFiltersProps) {
  const advancedPanelId = useId();
  const [advancedOpen, setAdvancedOpen] = useState(() => hasAdvancedExecutionLogFilters(filters));

  useEffect(() => {
    if (hasAdvancedExecutionLogFilters(filters)) {
      setAdvancedOpen(true);
    }
  }, [filters]);

  const showClear = hasAnyExecutionLogFilter(filters);

  return (
    <div className={executionLogFiltersPanelClassName}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Filters
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onApplyCoachReliabilityPreset ? (
            <Button
              type="button"
              size="sm"
              variant={isCoachReliabilityFilterActive(filters) ? 'primary' : 'secondary'}
              onClick={onApplyCoachReliabilityPreset}
            >
              Coach reliability
            </Button>
          ) : null}
          {showClear ? (
            <Button type="button" size="sm" variant="secondary" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      <div className={executionLogFiltersPrimaryGridClassName}>
        {PRIMARY_EXECUTION_LOG_FILTER_KEYS.map((key) => (
          <FilterField
            key={key}
            fieldKey={key}
            value={filters[key]}
            onChange={(value) => onFilterChange(key, value)}
          />
        ))}
      </div>

      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm font-medium text-gray-700',
            'hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50'
          )}
          aria-expanded={advancedOpen}
          aria-controls={advancedPanelId}
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          {advancedOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          )}
          Advanced IDs
          {!advancedOpen && hasAdvancedExecutionLogFilters(filters) ? (
            <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              Active
            </span>
          ) : null}
        </button>

        {advancedOpen ? (
          <div
            id={advancedPanelId}
            className={cn(executionLogFiltersAdvancedGridClassName, 'mt-2')}
          >
            {ADVANCED_EXECUTION_LOG_FILTER_KEYS.map((key) => (
              <FilterField
                key={key}
                fieldKey={key}
                value={filters[key]}
                onChange={(value) => onFilterChange(key, value)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
