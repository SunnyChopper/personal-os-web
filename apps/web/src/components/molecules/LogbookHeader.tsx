import { Plus, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/atoms/Button';

interface LogbookHeaderProps {
  onNewEntry: () => void;
}

export function LogbookHeader({ onNewEntry }: LogbookHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
          <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span>Daily Logbook</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          Reflect on your journey
        </p>
      </div>
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button variant="primary" onClick={onNewEntry} className="w-full sm:w-auto min-h-[44px]">
          <Plus className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">New Entry</span>
          <span className="sm:hidden">New</span>
        </Button>
      </motion.div>
    </div>
  );
}
