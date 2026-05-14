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
        return <Smile className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />;
      case 'Steady':
        return <Meh className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />;
      case 'Low':
        return <Frown className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />;
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

  const formattedDate = parseDateInput(entry.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
      className={`group rounded-lg border-2 p-4 md:p-5 hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col gap-3 ${getMoodColor(entry.mood)}`}
      style={{ minHeight: '44px' }}
    >
      {/* Metadata row: compact date + mood / energy */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{formattedDate}</span>
          {entry.mood ? getMoodIcon(entry.mood) : null}
        </div>

        {entry.energy !== null && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              Energy
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`w-1.5 h-3 sm:w-2 sm:h-4 rounded-sm ${
                    i < (entry.energy || 0) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
              {entry.energy}/10
            </span>
          </div>
        )}
      </div>

      {entry.title ? (
        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {entry.title}
        </h3>
      ) : null}

      {entry.notes ? (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{entry.notes}</p>
      ) : null}
    </motion.div>
  );
}
