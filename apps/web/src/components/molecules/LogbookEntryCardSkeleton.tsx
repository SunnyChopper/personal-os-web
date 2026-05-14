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
          className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 md:p-5 animate-pulse flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 sm:w-48" />
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-3 sm:w-2 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded-sm" />
                ))}
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
            </div>
          </div>

          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />

          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
          </div>
        </motion.div>
      ))}
    </>
  );
}
