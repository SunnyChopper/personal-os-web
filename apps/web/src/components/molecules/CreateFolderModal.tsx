import { useState, useEffect } from 'react';
import Dialog from '@/components/molecules/Dialog';
import { FormField } from '@/components/molecules/FormField';
import { FormInput } from '@/components/atoms/FormInput';
import Button from '@/components/atoms/Button';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (folderPath: string) => Promise<void>;
  currentPath?: string;
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

    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    if (folderName.includes('/') || folderName.includes('\\')) {
      setError('Folder name cannot contain slashes');
      return;
    }

    const cleanName = folderName.trim();
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => !isCreating && onClose()}
      title="Create Folder"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset
          disabled={isCreating}
          className="min-w-0 space-y-4 border-0 p-0 m-0 disabled:opacity-60"
        >
          <FormField
            label="Folder Name"
            htmlFor="folder-name"
            required
            error={error}
            hint={currentPath ? `Path: ${currentPath}/` : undefined}
          >
            <FormInput
              id="folder-name"
              type="text"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError(null);
              }}
              placeholder="Enter folder name"
              autoFocus
              className="w-full"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isCreating}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !folderName.trim()} size="sm">
              {isCreating ? 'Creating…' : 'Create Folder'}
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
