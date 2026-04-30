import { motion } from 'framer-motion';

interface HabitCardSkeletonProps {
  count?: number;
}

export function HabitCardSkeleton({ count = 1 }: HabitCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
            <div className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1" />
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          </div>

          {/* Button */}
          <div className="mt-3 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
        </motion.div>
      ))}
    </>
  );
}
