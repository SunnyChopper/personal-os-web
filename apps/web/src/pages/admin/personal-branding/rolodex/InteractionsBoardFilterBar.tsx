import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { CreatorConnection, RelationshipPriority } from '@/types/api/personal-branding.dto';
import { selectableChipClassName } from '../personal-branding-ui';
import { cn } from '@/lib/utils';
import {
  EMPTY_INTERACTIONS_BOARD_FILTERS,
  hasActiveInteractionsBoardFilters,
  isDueThisWeek,
  isStaleRecon,
  matchesInteractionsBoardFilters,
  resolveRelationshipPriority,
  ROLODEX_PRIORITY_BOARD_ORDER,
  ROLODEX_PRIORITY_OPTIONS,
  type InteractionsBoardFilters,
  type InteractionsBoardSortMode,
} from './rolodex-platform';

interface InteractionsBoardFilterBarProps {
  connections: CreatorConnection[];
  filters: InteractionsBoardFilters;
  onFiltersChange: (filters: InteractionsBoardFilters) => void;
  sortMode: InteractionsBoardSortMode;
  onSortModeChange: (mode: InteractionsBoardSortMode) => void;
}

const PRIORITY_LABELS = new Map(
  ROLODEX_PRIORITY_OPTIONS.map((option) => [option.value, option.label])
);

const SPECIAL_FILTERS = [
  { id: 'dueThisWeek' as const, label: 'Due this week' },
  { id: 'neverInteracted' as const, label: 'Never interacted' },
  { id: 'staleRecon' as const, label: 'Stale recon' },
];

const SORT_OPTIONS: { value: InteractionsBoardSortMode; label: string }[] = [
  { value: 'followUp', label: 'Follow-up' },
  { value: 'lastRecon', label: 'Last recon' },
];

export default function InteractionsBoardFilterBar({
  connections,
  filters,
  onFiltersChange,
  sortMode,
  onSortModeChange,
}: InteractionsBoardFilterBarProps) {
  const priorityOptions = useMemo(
    () =>
      ROLODEX_PRIORITY_BOARD_ORDER.map((value) => ({
        value,
        label: PRIORITY_LABELS.get(value) ?? value,
      })),
    []
  );

  const counts = useMemo(() => {
    const priorityCounts = Object.fromEntries(
      ROLODEX_PRIORITY_BOARD_ORDER.map((priority) => [priority, 0])
    ) as Record<RelationshipPriority, number>;
    let dueThisWeek = 0;
    let neverInteracted = 0;
    let staleRecon = 0;

    for (const connection of connections) {
      const priority = resolveRelationshipPriority(connection);
      if (priority) {
        priorityCounts[priority] += 1;
      }
      if (isDueThisWeek(connection.nextFollowUpAt)) {
        dueThisWeek += 1;
      }
      if (!connection.lastInteractedAt) {
        neverInteracted += 1;
      }
      if (isStaleRecon(connection.lastReconPostedAt)) {
        staleRecon += 1;
      }
    }

    return { priorityCounts, dueThisWeek, neverInteracted, staleRecon };
  }, [connections]);

  const togglePriority = (priority: RelationshipPriority) => {
    const selected = filters.priorities.includes(priority);
    const priorities = selected
      ? filters.priorities.filter((value) => value !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities });
  };

  const toggleSpecial = (key: 'dueThisWeek' | 'neverInteracted' | 'staleRecon') => {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  };

  const clearFilters = () => {
    onFiltersChange(EMPTY_INTERACTIONS_BOARD_FILTERS);
  };

  const filteredCount = useMemo(
    () =>
      connections.filter((connection) => matchesInteractionsBoardFilters(connection, filters))
        .length,
    [connections, filters]
  );

  const hasActiveFilters = hasActiveInteractionsBoardFilters(filters);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Filter
        </span>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <X className="size-3" aria-hidden />
            Clear
          </button>
        ) : null}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {hasActiveFilters
            ? `${filteredCount} of ${connections.length} connections`
            : `${connections.length} connections`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Interactions board filters">
        {priorityOptions.map(({ value, label }) => {
          const selected = filters.priorities.includes(value);
          const count = counts.priorityCounts[value];
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => togglePriority(value)}
              className={cn(selectableChipClassName(selected), 'px-3 py-1.5 text-xs')}
            >
              {label}
              <span className="ml-1 tabular-nums text-gray-500 dark:text-gray-400">({count})</span>
            </button>
          );
        })}

        <span
          className="mx-1 hidden h-6 w-px self-center bg-gray-200 dark:bg-gray-700 sm:inline"
          aria-hidden
        />

        {SPECIAL_FILTERS.map(({ id, label }) => {
          const selected = filters[id];
          const count =
            id === 'dueThisWeek'
              ? counts.dueThisWeek
              : id === 'neverInteracted'
                ? counts.neverInteracted
                : counts.staleRecon;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleSpecial(id)}
              className={cn(selectableChipClassName(selected), 'px-3 py-1.5 text-xs')}
            >
              {label}
              <span className="ml-1 tabular-nums text-gray-500 dark:text-gray-400">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Sort
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Interactions board sort">
          {SORT_OPTIONS.map(({ value, label }) => {
            const selected = sortMode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => onSortModeChange(value)}
                className={cn(selectableChipClassName(selected), 'px-3 py-1.5 text-xs')}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
