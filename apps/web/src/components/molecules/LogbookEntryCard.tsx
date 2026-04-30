import { Calendar, Smile, Meh, Frown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LogbookEntry, LogbookMood } from '@/types/growth-system';
import { parseDateInput } from '@/utils/date-formatters';

interface LogbookEntryCardProps {
  entry: LogbookEntry;
  onClick: (entry: LogbookEntry) => void;
}

export function LogbookEntryCard({ entry, onClick }: LogbookEntryCardProps) {
  const getMoodIcon = (mood: LogbookMood | null) => {
    switch (mood) {
      case 'High':
        return <Smile className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'Steady':
        return <Meh className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'Low':
        return <Frown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getMoodColor = (mood: LogbookMood | null) => {
    switch (mood) {
      case 'High':
        return 'bg-green-100 dark:bg-green-900/30 border-green-500';
      case 'Steady':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500';
      case 'Low':
        return 'bg-red-100 dark:bg-red-900/30 border-red-500';
      default:
        return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <motion.div
      layoutId={`logbook-entry-${entry.id}`}
      onClick={() => onClick(entry)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group rounded-lg border-2 p-4 md:p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer ${getMoodColor(entry.mood)}`}
      style={{ minHeight: '44px' }}
    >
      {/* Mobile: Vertical card layout */}
      {/* Desktop: Horizontal list layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
        {/* Left side: Date and mood */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">
              {parseDateInput(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {entry.mood && (
              <div className="flex items-center gap-2 flex-shrink-0">{getMoodIcon(entry.mood)}</div>
            )}
          </div>
        </div>

        {/* Middle: Title and notes (desktop) */}
        <div className="flex-1 min-w-0 lg:flex lg:flex-col lg:gap-1">
          {entry.title && (
            <h3 className="text-lg lg:text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate lg:mb-0">
              {entry.title}
            </h3>
          )}
          {entry.notes && (
            <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 line-clamp-1 lg:line-clamp-1 hidden lg:block">
              {entry.notes}
            </p>
          )}
        </div>

        {/* Right side: Energy (desktop) or full content (mobile) */}
        <div className="flex items-center gap-2 lg:flex-shrink-0">
          {entry.energy !== null && (
            <>
              <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 hidden lg:inline">
                Energy:
              </span>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`w-2 h-4 lg:h-5 rounded-sm ${
                      i < (entry.energy || 0) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white">
                {entry.energy}/10
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mobile: Show notes below */}
      {entry.notes && (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mt-3 lg:hidden">
          {entry.notes}
        </p>
      )}
    </motion.div>
  );
}
