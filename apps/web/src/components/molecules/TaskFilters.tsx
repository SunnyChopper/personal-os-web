import { X } from 'lucide-react';
import type { Area, Priority, TaskStatus } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { AREAS, PRIORITIES, TASK_STATUSES, TASK_STATUS_LABELS } from '@/constants/growth-system';

interface TaskFiltersProps {
  selectedArea?: Area;
  selectedStatus?: TaskStatus;
  selectedPriority?: Priority;
  onAreaChange: (area?: Area) => void;
  onStatusChange: (status?: TaskStatus) => void;
  onPriorityChange: (priority?: Priority) => void;
  onClearAll: () => void;
}

export function TaskFilters({
  selectedArea,
  selectedStatus,
  selectedPriority,
  onAreaChange,
  onStatusChange,
  onPriorityChange,
  onClearAll,
}: TaskFiltersProps) {
  const hasFilters = selectedArea || selectedStatus || selectedPriority;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={onClearAll}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Area
          </label>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <button
                key={area}
                onClick={() => onAreaChange(selectedArea === area ? undefined : area)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedArea === area
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {TASK_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(selectedStatus === status ? undefined : status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {TASK_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                onClick={() =>
                  onPriorityChange(selectedPriority === priority ? undefined : priority)
                }
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedPriority === priority
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
