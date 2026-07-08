import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Select } from '@/components/atoms/Select';
import { projectLabsService } from '@/services/knowledge-vault/project-labs.service';
import type { ProjectLabIdea } from '@/types/api/project-labs.dto';
import type { Area } from '@/types/growth-system';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;

interface ConvertToProjectIdeaDialogProps {
  isOpen: boolean;
  idea: ProjectLabIdea | null;
  onClose: () => void;
  onConverted: () => void | Promise<void>;
}

export default function ConvertToProjectIdeaDialog({
  isOpen,
  idea,
  onClose,
  onConverted,
}: ConvertToProjectIdeaDialogProps) {
  const [area, setArea] = useState<Area>('Operations');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('P3');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!idea) return;
    setSubmitting(true);
    setError(null);
    try {
      await projectLabsService.convertToProject(idea.id, { area, priority, goalIds: [] });
      await onConverted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert idea');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Convert to project" size="md">
      <div className="space-y-4 p-1">
        {idea ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create a Growth System project from{' '}
            <span className="font-medium text-gray-900 dark:text-white">{idea.title}</span>.
          </p>
        ) : null}

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Area</span>
          <Select
            value={area}
            onChange={(e) => setArea(e.target.value as Area)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Priority</span>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </label>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting || !idea}
            onClick={() => void handleSubmit()}
          >
            {submitting ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
