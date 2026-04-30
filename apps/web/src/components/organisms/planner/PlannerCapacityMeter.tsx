import type { PlannerCapacityState } from '@/types/planner';

const CAPACITY_LABEL: Record<PlannerCapacityState, string> = {
  healthy: 'Healthy load',
  warning: 'Near capacity',
  overloaded: 'Over capacity',
};

const CAPACITY_CLASS: Record<PlannerCapacityState, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-500',
  overloaded: 'bg-red-500',
};

export interface PlannerCapacityMeterProps {
  loadRatio: number;
  capacityState: PlannerCapacityState;
  scheduledPoints: number;
  capacityPoints: number;
  className?: string;
}

export function PlannerCapacityMeter({
  loadRatio,
  capacityState,
  scheduledPoints,
  capacityPoints,
  className = '',
}: PlannerCapacityMeterProps) {
  const pct = Math.min(100, Math.round(loadRatio * 100));
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{CAPACITY_LABEL[capacityState]}</span>
        <span>
          {scheduledPoints.toFixed(1)} / {capacityPoints.toFixed(1)} pts
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full transition-all ${CAPACITY_CLASS[capacityState]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
