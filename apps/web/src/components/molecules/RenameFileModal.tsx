import { useState, useEffect } from 'react';
import Dialog from '@/components/molecules/Dialog';
import { FormField } from '@/components/molecules/FormField';
import { FormInput } from '@/components/atoms/FormInput';
import Button from '@/components/atoms/Button';
import { Card, CardBody } from '@/components/atoms/Card';

interface RenameFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newPath: string) => Promise<void>;
  currentPath: string;
  currentName: string;
  isRenaming?: boolean;
  mode?: 'rename' | 'saveAs';
  primaryLabel?: string;
}

export default function RenameFileModal({
  isOpen,
  onClose,
  onRename,
  currentPath,
  currentName,
  isRenaming = false,
  mode = 'rename',
  primaryLabel,
}: RenameFileModalProps) {
  const [newFileName, setNewFileName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const pathParts = currentPath.split('/');
      const fileName = pathParts.pop() || currentName;
      const folder = pathParts.join('/');
      setNewFileName(fileName);
      setFolderPath(folder);
      setError(null);
    }
  }, [isOpen, currentPath, currentName]);

  const validateFileName = (name: string): string | null => {
    if (!name.trim()) return 'File name is required';
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
    if (!path.trim()) return null;
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

    const fileNameError = validateFileName(newFileName);
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
      ? `${folderPath.trim()}/${newFileName.trim()}`
      : newFileName.trim();

    if (mode !== 'saveAs' && fullPath === currentPath) {
      setError('New path must be different from current path');
      return;
    }

    try {
      await onRename(fullPath);
      setNewFileName('');
      setFolderPath('');
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename file');
    }
  };

  const handleClose = () => {
    if (isRenaming) return;
    setNewFileName('');
    setFolderPath('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'saveAs' ? 'Save File As' : 'Rename File'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset
          disabled={isRenaming}
          className="min-w-0 space-y-4 border-0 p-0 m-0 disabled:opacity-60"
        >
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/30">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : null}

          <FormField
            label="Folder Path (optional)"
            htmlFor="folder-path"
            hint="Leave empty to move to root directory"
          >
            <FormInput
              id="folder-path"
              type="text"
              value={folderPath}
              onChange={(e) => {
                setFolderPath(e.target.value);
                setError(null);
              }}
              placeholder="e.g., docs/guides"
              className="w-full"
            />
          </FormField>

          <FormField
            label="File Name"
            htmlFor="file-name"
            required
            hint="Must end with .md or .markdown"
          >
            <FormInput
              id="file-name"
              type="text"
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., getting-started.md"
              required
              className="w-full"
            />
          </FormField>

          <Card>
            <CardBody className="py-2">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Current path:</p>
              <p className="truncate font-mono text-sm text-gray-700 dark:text-gray-300">
                {currentPath}
              </p>
            </CardBody>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isRenaming}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isRenaming || !newFileName.trim()} size="sm">
              {isRenaming
                ? mode === 'saveAs'
                  ? 'Saving…'
                  : 'Renaming…'
                : (primaryLabel ?? (mode === 'saveAs' ? 'Save with this name' : 'Rename File'))}
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
