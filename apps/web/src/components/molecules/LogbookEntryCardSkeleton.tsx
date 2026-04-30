import { motion } from 'framer-motion';

interface LogbookEntryCardSkeletonProps {
  count?: number;
}

export function LogbookEntryCardSkeleton({ count = 1 }: LogbookEntryCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse"
        >
          {/* Header with date and mood icon */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            </div>
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Title */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />

          {/* Notes preview */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
          </div>

          {/* Energy level */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-300 dark:border-gray-600">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="flex-1 flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm flex-1" />
              ))}
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
          </div>
        </motion.div>
      ))}
    </>
  );
}
