import type { LogbookEntry } from '@/types/growth-system';

interface LogbookEntryMetadataProps {
  entry: LogbookEntry;
}

export function LogbookEntryMetadata({ entry }: LogbookEntryMetadataProps) {
  return (
    <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
      {entry.mood && (
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mood</div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              entry.mood === 'High'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : entry.mood === 'Steady'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {entry.mood}
          </div>
        </div>
      )}
      {entry.energy !== null && (
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Energy</div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-6 rounded-sm ${
                    i < (entry.energy || 0) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {entry.energy}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
