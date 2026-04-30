import { useState, useEffect } from 'react';
import { Clock, X, FileText } from 'lucide-react';
import { useNavigate, generatePath } from 'react-router-dom';
import { getRecentFiles, removeRecentFile, type RecentFile } from '@/hooks/useRecentFiles';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';

interface RecentFilesListProps {
  maxItems?: number;
  onFileSelect?: (path: string) => void;
  className?: string;
}

export default function RecentFilesList({
  maxItems = 10,
  onFileSelect,
  className,
}: RecentFilesListProps) {
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    const loadRecentFiles = () => {
      const files = getRecentFiles().slice(0, maxItems);
      setRecentFiles(files);
    };

    loadRecentFiles();

    // Listen for storage changes (from other tabs)
    const handleStorageChange = () => {
      loadRecentFiles();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also poll for changes (since same-tab changes don't trigger storage event)
    const interval = setInterval(loadRecentFiles, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [maxItems]);

  const handleFileClick = (filePath: string) => {
    const encodedPath = encodeURIComponent(filePath);
    navigate(
      generatePath(ROUTES.admin.markdownViewerFile, {
        filePath: encodedPath,
      })
    );
    onFileSelect?.(filePath);
  };

  const handleRemove = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    removeRecentFile(filePath);
    setRecentFiles((prev) => prev.filter((f) => f.path !== filePath));
  };

  if (recentFiles.length === 0) {
    return null;
  }

  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700', className)}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-gray-500 dark:text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Recent Files
          </h3>
        </div>
        <div className="space-y-1">
          {recentFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => handleFileClick(file.path)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
            >
              <FileText size={12} className="flex-shrink-0 text-gray-400" />
              <span className="flex-1 truncate text-xs text-gray-600 dark:text-gray-400">
                {file.name}
              </span>
              <button
                onClick={(e) => handleRemove(e, file.path)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                aria-label="Remove from recent"
              >
                <X size={10} className="text-gray-400" />
              </button>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
