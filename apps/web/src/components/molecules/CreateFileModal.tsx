import { useState } from 'react';
import Dialog from '@/components/molecules/Dialog';
import { FormField } from '@/components/molecules/FormField';
import { FormInput } from '@/components/atoms/FormInput';
import Button from '@/components/atoms/Button';

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
    <Dialog isOpen={isOpen} onClose={handleClose} title="Create New File" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset
          disabled={isCreating}
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
            hint="Leave empty to create in root directory"
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
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., getting-started.md"
              required
              className="w-full"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isCreating}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !fileName.trim()} size="sm">
              {isCreating ? 'Creating…' : 'Create File'}
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
