import { FolderKanban, Save, Trash2, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type { ProjectLabIdea } from '@/types/api/project-labs.dto';
import { cn } from '@/lib/utils';

interface ProjectLabIdeaCardProps {
  idea: ProjectLabIdea;
  isSaving?: boolean;
  onSave: () => void;
  onDismiss: () => void;
  onConvert: () => void;
  onDelete: () => void;
}

export default function ProjectLabIdeaCard({
  idea,
  isSaving = false,
  onSave,
  onDismiss,
  onConvert,
  onDelete,
}: ProjectLabIdeaCardProps) {
  const isConverted = idea.status === 'CONVERTED';
  const isDismissed = idea.status === 'DISMISSED';
  const canAct = idea.status === 'GENERATED' || idea.status === 'SAVED';

  return (
    <article
      className={cn(
        'rounded-xl border p-4 space-y-3 bg-white dark:bg-gray-900',
        'border-gray-200 dark:border-gray-700'
      )}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{idea.title}</h3>
        {idea.pitch ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{idea.pitch}</p>
        ) : null}
      </div>

      {idea.problemStatement ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Problem</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{idea.problemStatement}</p>
        </div>
      ) : null}

      {idea.rationale ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Why build it</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{idea.rationale}</p>
        </div>
      ) : null}

      {idea.brandAngle ? (
        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/50 px-3 py-2">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Brand angle</p>
          <p className="text-sm text-violet-900 dark:text-violet-100 mt-0.5">{idea.brandAngle}</p>
        </div>
      ) : null}

      {idea.suggestedSteps.length > 0 ? (
        <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-0.5">
          {idea.suggestedSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {idea.estimatedEffort ? <span>Effort: {idea.estimatedEffort}</span> : null}
        {idea.difficulty ? <span>Difficulty: {idea.difficulty}</span> : null}
        {idea.tags.length > 0 ? <span>Tags: {idea.tags.join(', ')}</span> : null}
      </div>

      {isConverted && idea.convertedProjectId ? (
        <p className="text-xs text-green-700 dark:text-green-400">
          Converted to project {idea.convertedProjectId}
        </p>
      ) : null}

      {canAct ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {idea.status === 'GENERATED' ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isSaving}
              onClick={onSave}
              className="inline-flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onConvert}
            className="inline-flex items-center gap-1"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Convert to project
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onDismiss}
            className="inline-flex items-center gap-1 text-red-700 dark:text-red-400"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="inline-flex items-center gap-1 text-gray-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      ) : isDismissed ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-gray-500"
        >
          Delete
        </Button>
      ) : null}
    </article>
  );
}
