import { Check, X, Archive, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GoalStatus, Priority } from '@/types/growth-system';
import Button from '@/components/atoms/Button';

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusChange?: (status: GoalStatus) => void;
  onPriorityChange?: (priority: Priority) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onClearSelection?: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onStatusChange,
  onPriorityChange,
  onArchive,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          {/* Selection Count */}
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedCount} selected
            </span>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Change Status Dropdown */}
            {onStatusChange && (
              <div className="relative group">
                <button className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Status
                </button>
                <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[150px] z-10">
                  {(
                    [
                      'Planning',
                      'Active',
                      'On Track',
                      'At Risk',
                      'Achieved',
                      'Abandoned',
                    ] as GoalStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      onClick={() => onStatusChange(status)}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Change Priority Dropdown */}
            {onPriorityChange && (
              <div className="relative group">
                <button className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Priority
                </button>
                <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[100px] z-10">
                  {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => onPriorityChange(priority)}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Archive Button */}
            {onArchive && (
              <Button variant="secondary" size="sm" onClick={onArchive}>
                <Archive className="w-4 h-4 mr-1" />
                Archive
              </Button>
            )}

            {/* Delete Button */}
            {onDelete && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDelete}
                className="hover:!bg-red-50 hover:!text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
