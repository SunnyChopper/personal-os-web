import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type { SkillLevelApi, SkillTreeSkill } from '@/types/knowledge-vault';

const LEVELS: SkillLevelApi[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

export interface SkillTreeSkillFormModalProps {
  mode: 'create' | 'edit';
  skill: SkillTreeSkill | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    description: string;
    category: string;
    level: SkillLevelApi;
    progressPercentage?: number;
  }) => Promise<void>;
  busy?: boolean;
}

/**
 * Modal is mounted only while open; parent should use `key` (e.g. edit skill id) so fields reset.
 */
export function SkillTreeSkillFormModal({
  mode,
  skill,
  onClose,
  onSubmit,
  busy = false,
}: SkillTreeSkillFormModalProps) {
  const [name, setName] = useState(() => (mode === 'edit' && skill ? skill.name : ''));
  const [description, setDescription] = useState(() =>
    mode === 'edit' && skill ? (skill.description ?? '') : ''
  );
  const [category, setCategory] = useState(() =>
    mode === 'edit' && skill ? (skill.category ?? '') : ''
  );
  const [level, setLevel] = useState<SkillLevelApi>(() =>
    mode === 'edit' && skill ? (skill.level as SkillLevelApi) || 'Beginner' : 'Beginner'
  );
  const [progress, setProgress] = useState(() =>
    mode === 'edit' && skill ? (skill.progressPercentage ?? 0) : 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || '',
      category: category.trim() || '',
      level,
      ...(mode === 'edit' ? { progressPercentage: progress } : {}),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-form-title"
      data-testid="skill-form-modal"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-start gap-2">
          <h2 id="skill-form-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Add skill' : 'Edit skill'}
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

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label
              htmlFor="skill-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Name
            </label>
            <input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              minLength={2}
              required
            />
          </div>
          <div>
            <label
              htmlFor="skill-desc"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="skill-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="skill-cat"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Category
            </label>
            <input
              id="skill-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              placeholder="e.g. frontend"
            />
          </div>
          <div>
            <label
              htmlFor="skill-level"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Level
            </label>
            <select
              id="skill-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as SkillLevelApi)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {mode === 'edit' && (
            <div>
              <label
                htmlFor="skill-progress"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Progress: {Math.round(progress)}%
              </label>
              <input
                id="skill-progress"
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={busy || name.trim().length < 2}>
              {busy ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
