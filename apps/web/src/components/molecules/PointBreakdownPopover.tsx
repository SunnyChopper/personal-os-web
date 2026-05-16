import type { TaskPointBreakdown } from '@/types/growth-system';
import { ChevronDown, Info } from 'lucide-react';

const MANUAL_POINT_REASONING = 'Manually set by user';

interface PointBreakdownPopoverProps {
  pointValue: number;
  breakdown?: TaskPointBreakdown | null;
  /** Additional classes on the trigger row */
  className?: string;
}

/** Expandable breakdown for wallet reward points (stored `pointBreakdown` from API). */
export function PointBreakdownPopover({
  pointValue,
  breakdown,
  className = '',
}: PointBreakdownPopoverProps) {
  if (!breakdown || breakdown.reasoning.trim() === '') {
    return null;
  }

  const isManual = breakdown.reasoning.trim() === MANUAL_POINT_REASONING;
  const showNumericLines =
    !isManual &&
    (breakdown.basePoints > 0 || breakdown.priorityMultiplier > 0 || breakdown.areaMultiplier > 0);

  return (
    <details
      className={`group rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 select-none [&::-webkit-details-marker]:hidden">
        <Info
          className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <span>
          Why {pointValue} {pointValue === 1 ? 'point' : 'points'}?
        </span>
        <ChevronDown
          className="ml-auto h-3.5 w-3.5 transition group-open:rotate-180 opacity-70"
          aria-hidden
        />
      </summary>
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-600 px-2 pb-2 pt-1 text-xs text-gray-700 dark:text-gray-300">
        {!isManual && showNumericLines && (
          <ul className="space-y-0.5 font-mono text-[11px] leading-relaxed tabular-nums">
            <li>
              Base points: {breakdown.basePoints} (effective {breakdown.storyPoints} SP × 20)
            </li>
            <li>Priority ×{breakdown.priorityMultiplier}</li>
            <li>Area ×{breakdown.areaMultiplier}</li>
            <li>Size / complexity ×{breakdown.sizeBonus}</li>
            <li className="pt-1 font-semibold">Total: {breakdown.total}</li>
          </ul>
        )}
        <p className="text-gray-600 dark:text-gray-400 italic leading-snug">
          {breakdown.reasoning}
        </p>
      </div>
    </details>
  );
}
