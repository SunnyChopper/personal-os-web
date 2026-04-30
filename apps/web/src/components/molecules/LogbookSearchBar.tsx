import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogbookSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LogbookSearchBar({
  value,
  onChange,
  placeholder = 'Search entries...',
}: LogbookSearchBarProps) {
  return (
    <motion.div
      className="flex-1 relative"
      whileFocus={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
      />
    </motion.div>
  );
}
