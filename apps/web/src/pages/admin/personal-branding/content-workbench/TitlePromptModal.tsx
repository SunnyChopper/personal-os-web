import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { UNTITLED_DRAFT_LABEL } from './content-workbench-constants';

interface TitlePromptModalProps {
  isOpen: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSaveWithTitle: (title: string) => void;
  onKeepUntitled: () => void;
}

export default function TitlePromptModal({
  isOpen,
  isSaving = false,
  onClose,
  onSaveWithTitle,
  onKeepUntitled,
}: TitlePromptModalProps) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
    }
  }, [isOpen]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Name this draft?" size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        You are saving without a title. Enter a name or keep the default.
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Draft title"
        className={`${formFieldClassName} mt-4`}
        autoFocus
      />
      <DialogFooter className="mt-6">
        <Button type="button" size="sm" variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onKeepUntitled}
          disabled={isSaving}
        >
          Keep as {UNTITLED_DRAFT_LABEL}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => onSaveWithTitle(title.trim() || UNTITLED_DRAFT_LABEL)}
          disabled={isSaving || !title.trim()}
        >
          {isSaving ? 'Saving…' : 'Save with title'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
