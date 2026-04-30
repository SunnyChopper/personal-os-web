import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import type { GhostNodeSuggestion } from '@/types/knowledge-vault';
import Button from '@/components/atoms/Button';
import { ROUTES } from '@/routes';

export interface GhostNodeUnlockModalProps {
  ghost: GhostNodeSuggestion | null;
  onClose: () => void;
}

export function GhostNodeUnlockModal({ ghost, onClose }: GhostNodeUnlockModalProps) {
  const navigate = useNavigate();
  if (!ghost) return null;

  const goCourse = () => {
    const topic = encodeURIComponent(ghost.name);
    const diff = encodeURIComponent(ghost.suggestedDifficulty || 'intermediate');
    navigate(`${ROUTES.admin.knowledgeVaultCourses}/new?topic=${topic}&difficulty=${diff}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ghost-modal-title"
    >
      <div className="bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-start gap-2">
          <h2
            id="ghost-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {ghost.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{ghost.reason}</p>
        <p className="text-xs text-gray-500">
          Bridges:{' '}
          <span className="font-medium text-purple-700 dark:text-purple-300">
            {ghost.bridgesFrom}
          </span>{' '}
          →{' '}
          <span className="font-medium text-purple-700 dark:text-purple-300">
            {ghost.bridgesTo}
          </span>
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" onClick={goCourse}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate course to unlock
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
