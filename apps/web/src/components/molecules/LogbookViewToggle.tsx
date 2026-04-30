import { motion } from 'framer-motion';

type ViewMode = 'list' | 'calendar';

interface LogbookViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function LogbookViewToggle({ viewMode, onViewModeChange }: LogbookViewToggleProps) {
  return (
    <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-1">
      <motion.button
        onClick={() => onViewModeChange('list')}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 min-h-[44px] rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        List
      </motion.button>
      <motion.button
        onClick={() => onViewModeChange('calendar')}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 min-h-[44px] rounded-md transition-colors ${
          viewMode === 'calendar'
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        aria-label="Calendar view"
        aria-pressed={viewMode === 'calendar'}
      >
        Calendar
      </motion.button>
    </div>
  );
}
