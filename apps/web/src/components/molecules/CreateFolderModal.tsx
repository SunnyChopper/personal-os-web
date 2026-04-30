import { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (folderPath: string) => Promise<void>;
  currentPath?: string; // Current folder path for creating nested folders
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreate,
  currentPath = '',
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    // Validate folder name (no slashes, no special characters that would break paths)
    if (folderName.includes('/') || folderName.includes('\\')) {
      setError('Folder name cannot contain slashes');
      return;
    }

    // Remove leading/trailing whitespace
    const cleanName = folderName.trim();

    // Build full path
    const folderPath = currentPath ? `${currentPath}/${cleanName}` : cleanName;

    setIsCreating(true);
    try {
      await onCreate(folderPath);
      setFolderName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Folder</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="folder-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Folder Name
            </label>
            <input
              id="folder-name"
              type="text"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError(null);
              }}
              placeholder="Enter folder name"
              className={cn(
                'w-full px-3 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700',
                'border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error && 'border-red-500 dark:border-red-500'
              )}
              autoFocus
              disabled={isCreating}
            />
            {currentPath && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Path: {currentPath}/</p>
            )}
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !folderName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
