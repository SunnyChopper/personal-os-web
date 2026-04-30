import { Briefcase, Waves } from 'lucide-react';
import { useMode } from '@/contexts/Mode';

export default function LeisureModeToggle() {
  const { isLeisureMode, toggleMode } = useMode();

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLeisureMode ? 'Leisure Mode' : 'Work Mode'}
        </span>
      </div>
      <button
        onClick={toggleMode}
        className="w-full relative h-10 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        aria-label={`Switch to ${isLeisureMode ? 'Work' : 'Leisure'} Mode`}
      >
        <div
          className={`absolute top-1 left-1 h-8 w-[calc(50%-0.25rem)] rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
            isLeisureMode
              ? 'translate-x-[calc(100%+0.5rem)] bg-green-500 dark:bg-green-600'
              : 'translate-x-0 bg-blue-500 dark:bg-blue-600'
          }`}
        >
          {isLeisureMode ? (
            <Waves size={18} className="text-white" />
          ) : (
            <Briefcase size={18} className="text-white" />
          )}
        </div>
        <div className="flex justify-between px-3 h-full items-center">
          <span
            className={`text-xs font-medium transition-colors ${
              !isLeisureMode ? 'text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Work
          </span>
          <span
            className={`text-xs font-medium transition-colors ${
              isLeisureMode ? 'text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Leisure
          </span>
        </div>
      </button>
    </div>
  );
}
