import { useEffect, useId, useState } from 'react';

export const CONTRIBUTION_WEIGHT_GOAL_SLICE_HINT =
  "Relative share of this project within the goal's Projects progress slice (when that slice is enabled on the goal).";

export type ProjectGoalContributionWeightFieldLayout = 'stacked' | 'inline';

interface ProjectGoalContributionWeightFieldProps {
  value: number;
  onCommit: (weight: number) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  layout?: ProjectGoalContributionWeightFieldLayout;
}

export function ProjectGoalContributionWeightField({
  value,
  onCommit,
  disabled = false,
  label = 'Contribution weight',
  layout = 'stacked',
}: ProjectGoalContributionWeightFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const hintId = useId();

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = async () => {
    const parsed = Number(draft);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 1000) {
      setDraft(String(value));
      return;
    }
    if (parsed === value) return;
    setSaving(true);
    try {
      await onCommit(parsed);
    } finally {
      setSaving(false);
    }
  };

  const input = (
    <input
      type="number"
      min={0.1}
      max={1000}
      step={0.1}
      value={draft}
      disabled={disabled || saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className={
        layout === 'inline'
          ? 'w-14 rounded border border-gray-300 bg-white px-1.5 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
          : 'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
      }
      aria-label={layout === 'inline' ? 'Weight' : label}
      aria-describedby={hintId}
      title={CONTRIBUTION_WEIGHT_GOAL_SLICE_HINT}
    />
  );

  if (layout === 'inline') {
    return (
      <label
        className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
        title={CONTRIBUTION_WEIGHT_GOAL_SLICE_HINT}
      >
        <span className="whitespace-nowrap">Weight</span>
        {input}
        <span id={hintId} className="sr-only">
          {CONTRIBUTION_WEIGHT_GOAL_SLICE_HINT}
        </span>
      </label>
    );
  }

  return (
    <label className="flex min-w-[7rem] flex-col gap-1 text-xs">
      <span
        className="text-gray-600 dark:text-gray-400"
        title={CONTRIBUTION_WEIGHT_GOAL_SLICE_HINT}
      >
        {label}
      </span>
      {input}
      <span id={hintId} className="sr-only">
        {CONTRIBUTION_WEIGHT_GOAL_SLICE_HINT}
      </span>
    </label>
  );
}
