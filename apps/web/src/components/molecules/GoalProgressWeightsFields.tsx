import type { GoalProgressConfig } from '@/types/growth-system';
interface GoalProgressWeightsFieldsProps {
  value: GoalProgressConfig;
  onChange: (config: GoalProgressConfig) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export function GoalProgressWeightsFields({
  value,
  onChange,
  showAdvanced,
  onToggleAdvanced,
}: GoalProgressWeightsFieldsProps) {
  const weightSum =
    value.criteriaWeight + value.tasksWeight + value.metricsWeight + value.habitsWeight;
  const sumWarning = weightSum !== 100;

  const updateField = (field: keyof GoalProgressConfig, raw: string) => {
    const parsed = raw === '' ? 0 : Number(raw);
    if (Number.isNaN(parsed)) return;
    onChange({
      ...value,
      [field]: field === 'manualOverride' ? (raw === '' ? null : parsed) : parsed,
    });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        {showAdvanced ? 'Hide' : 'Show'} progress weight settings
      </button>
      {showAdvanced && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Default: Criteria 35%, Tasks 35%, Metrics 10%, Habits 20%. Metrics and criteria drive
            achievement; habits add a consistency layer.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['criteriaWeight', 'Criteria'],
                ['tasksWeight', 'Tasks'],
                ['metricsWeight', 'Metrics'],
                ['habitsWeight', 'Habits'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs">
                <span className="text-gray-700 dark:text-gray-300">{label} %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={value[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                />
              </label>
            ))}
          </div>
          <label className="block text-xs">
            <span className="text-gray-700 dark:text-gray-300">Manual override % (optional)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={value.manualOverride ?? ''}
              onChange={(e) => updateField('manualOverride', e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
            />
          </label>
          {sumWarning && (
            <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
              Weights sum to {weightSum}% (recommended: 100%). Progress still normalizes by total
              weight.
            </p>
          )}
          {weightSum <= 0 && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              At least one weight must be greater than zero.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
