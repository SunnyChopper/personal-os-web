import { useState, useRef, useEffect } from 'react';
import { FilePlus, Upload, FolderPlus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewFileDropdownProps {
  onNewFile: () => void;
  onNewUpload: () => void;
  onNewFolder: () => void;
}

export default function NewFileDropdown({
  onNewFile,
  onNewUpload,
  onNewFolder,
}: NewFileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition',
          'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          'hover:bg-blue-100 dark:hover:bg-blue-900/50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
        )}
        title="Create new file, upload, or folder"
        aria-label="New file options"
        aria-expanded={isOpen}
      >
        <FilePlus size={16} />
        <span className="hidden sm:inline">New</span>
        <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
          <button
            onClick={() => handleOptionClick(onNewUpload)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload size={16} className="text-blue-500" />
            <span>New Upload</span>
          </button>
          <button
            onClick={() => handleOptionClick(onNewFile)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FilePlus size={16} className="text-blue-500" />
            <span>New File</span>
          </button>
          <button
            onClick={() => handleOptionClick(onNewFolder)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FolderPlus size={16} className="text-blue-500" />
            <span>New Folder</span>
          </button>
        </div>
      )}
    </div>
  );
}
