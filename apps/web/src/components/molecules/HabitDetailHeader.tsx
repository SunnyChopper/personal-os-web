import { ChevronRight, Edit2, Trash2 } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import Button from '@/components/atoms/Button';
import { SUBCATEGORY_LABELS } from '@/constants/growth-system';
import {
  formatRelativeDate,
  getLastCompletedDateFromLogs,
  getNextExpectedDate,
} from '@/utils/date-formatters';

interface HabitDetailHeaderProps {
  habit: Habit;
  logs: HabitLog[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitDetailHeader({
  habit,
  logs,
  onBack,
  onEdit,
  onDelete,
}: HabitDetailHeaderProps) {
  const lastCompletedDate = getLastCompletedDateFromLogs(logs);
  const nextExpectedDate = getNextExpectedDate(habit, lastCompletedDate);
  const isTodayCompleted =
    lastCompletedDate && new Date(lastCompletedDate).toDateString() === new Date().toDateString();

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4"
        aria-label="Breadcrumb"
      >
        <button
          onClick={onBack}
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Habits
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white font-medium">{habit.name}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 break-words">
              {habit.name}
            </h1>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <AreaBadge area={habit.area} />
              {habit.subCategory && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {SUBCATEGORY_LABELS[habit.subCategory]}
                </span>
              )}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  habit.habitType === 'Build'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : habit.habitType === 'Maintain'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : habit.habitType === 'Reduce'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {habit.habitType}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{habit.frequency}</span>
            </div>

            {habit.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base break-words">
                {habit.description}
              </p>
            )}

            {/* Contextual Information */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
              {lastCompletedDate ? (
                <span>
                  Last completed:{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatRelativeDate(lastCompletedDate)}
                  </span>
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-500">Never completed</span>
              )}

              {nextExpectedDate && !isTodayCompleted && (
                <span>
                  Next expected:{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatRelativeDate(nextExpectedDate)}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto lg:max-w-[min(100%,280px)] lg:justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={onEdit}
              className="min-h-[44px] flex-1 sm:flex-none touch-manipulation"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onDelete}
              className="min-h-[44px] flex-1 sm:flex-none touch-manipulation hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-900/20 dark:hover:!text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* Habit Details Sections */}
        {habit.intent && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Intent</div>
            <p className="text-gray-900 dark:text-white">{habit.intent}</p>
          </div>
        )}

        {habit.trigger && habit.action && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Habit Loop
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <div className="text-xs text-gray-500 dark:text-gray-400">Trigger</div>
                <div className="text-sm text-gray-900 dark:text-white">{habit.trigger}</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex-1 min-w-[150px]">
                <div className="text-xs text-gray-500 dark:text-gray-400">Action</div>
                <div className="text-sm text-gray-900 dark:text-white">{habit.action}</div>
              </div>
              {habit.reward && (
                <>
                  <div className="text-gray-400">→</div>
                  <div className="flex-1 min-w-[150px]">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Reward</div>
                    <div className="text-sm text-gray-900 dark:text-white">{habit.reward}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {habit.frictionDown && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
              Make it Easier
            </div>
            <p className="text-gray-900 dark:text-white">{habit.frictionDown}</p>
          </div>
        )}
      </div>
    </div>
  );
}
