import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (path: string, content?: string) => Promise<void>;
}

export default function CreateFileModal({ isOpen, onClose, onCreate }: CreateFileModalProps) {
  const [fileName, setFileName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateFileName = (name: string): string | null => {
    if (!name.trim()) {
      return 'File name is required';
    }
    if (!name.endsWith('.md') && !name.endsWith('.markdown')) {
      return 'File must have .md or .markdown extension';
    }
    if (name.includes('/') || name.includes('\\')) {
      return 'File name cannot contain path separators';
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(name.replace(/\.(md|markdown)$/, ''))) {
      return 'File name contains invalid characters';
    }
    return null;
  };

  const validateFolderPath = (path: string): string | null => {
    if (!path.trim()) return null; // Empty is valid (root)
    if (path.startsWith('/') || path.endsWith('/')) {
      return 'Path should not start or end with /';
    }
    if (!/^[a-zA-Z0-9._/-]+$/.test(path)) {
      return 'Path contains invalid characters';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fileNameError = validateFileName(fileName);
    if (fileNameError) {
      setError(fileNameError);
      return;
    }

    const folderError = validateFolderPath(folderPath);
    if (folderError) {
      setError(folderError);
      return;
    }

    const fullPath = folderPath.trim()
      ? `${folderPath.trim()}/${fileName.trim()}`
      : fileName.trim();

    setIsCreating(true);
    try {
      await onCreate(fullPath);
      // Reset form
      setFileName('');
      setFolderPath('');
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create file');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setFileName('');
    setFolderPath('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New File
          </h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="folder-path"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Folder Path (optional)
            </label>
            <input
              id="folder-path"
              type="text"
              value={folderPath}
              onChange={(e) => {
                setFolderPath(e.target.value);
                setError(null);
              }}
              placeholder="e.g., docs/guides"
              disabled={isCreating}
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                'bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-white',
                'border-gray-300 dark:border-gray-600',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
                'transition'
              )}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to create in root directory
            </p>
          </div>

          <div>
            <label
              htmlFor="file-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              File Name <span className="text-red-500">*</span>
            </label>
            <input
              id="file-name"
              type="text"
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., getting-started.md"
              disabled={isCreating}
              required
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                'bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-white',
                'border-gray-300 dark:border-gray-600',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
                'transition'
              )}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must end with .md or .markdown
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isCreating || !fileName.trim()}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition',
              isCreating || !fileName.trim()
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
            )}
          >
            {isCreating ? 'Creating...' : 'Create File'}
          </button>
        </div>
      </div>
    </div>
  );
}
