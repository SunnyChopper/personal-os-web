import { useEffect, useState } from 'react';
import { Link2Off, Target } from 'lucide-react';
import type { Goal } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import Button from '@/components/atoms/Button';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { ProjectGoalContributionWeightField } from '@/components/molecules/ProjectGoalContributionWeightField';
import {
  clampTaskDescriptionPreview,
  projectTaskShowMoreButtonClassName,
} from '@/lib/projects/project-task-row-surfaces';
import {
  projectLinkedGoalActionsClassName,
  projectLinkedGoalCardShellClassName,
  projectLinkedGoalDescriptionClassName,
  projectLinkedGoalFooterClassName,
  projectLinkedGoalMetaClassName,
  projectLinkedGoalTitleClassName,
} from '@/lib/projects/project-linked-goal-card-surfaces';

export interface ProjectLinkedGoalCardProps {
  goal: Goal;
  projectName: string;
  criteriaProgress?: number;
  isEmbedded?: boolean;
  contributionWeight?: number;
  showContributionWeight?: boolean;
  onOpen: (goal: Goal) => void;
  onContributionWeightChange?: (weight: number) => void | Promise<void>;
  onUnlink: () => void;
}

export function ProjectLinkedGoalCard({
  goal,
  projectName,
  criteriaProgress = 0,
  isEmbedded = false,
  contributionWeight = 1,
  showContributionWeight = true,
  onOpen,
  onContributionWeightChange,
  onUnlink,
}: ProjectLinkedGoalCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const clampedDescription = clampTaskDescriptionPreview(goal.description, 128);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [goal.id, goal.description]);

  const stopCardActivation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const openGoal = () => onOpen(goal);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openGoal}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openGoal();
        }
      }}
      className={projectLinkedGoalCardShellClassName(isEmbedded, true)}
      aria-label={`View goal details: ${goal.title}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-2.5">
        <PriorityIndicator priority={goal.priority} size="sm" variant="badge" />
        <Target className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
        <h3 className={projectLinkedGoalTitleClassName}>{goal.title}</h3>
        <StatusBadge status={goal.status} size="sm" />
      </div>

      {clampedDescription.previewText ? (
        <div className={projectLinkedGoalDescriptionClassName}>
          <span>
            {isDescriptionExpanded ? clampedDescription.fullText : clampedDescription.previewText}
          </span>
          {clampedDescription.isClamped ? (
            <button
              type="button"
              onClick={(event) => {
                stopCardActivation(event);
                setIsDescriptionExpanded((prev) => !prev);
              }}
              className={projectTaskShowMoreButtonClassName}
            >
              {isDescriptionExpanded ? 'Show Less' : 'Show More'}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={projectLinkedGoalFooterClassName}>
        <div className={projectLinkedGoalMetaClassName}>
          <AreaBadge area={goal.area} size="sm" />
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {goal.timeHorizon}
          </span>
          {criteriaProgress > 0 ? (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {criteriaProgress}%
            </span>
          ) : null}
        </div>

        <div
          className={projectLinkedGoalActionsClassName}
          role="group"
          aria-label="Goal link actions"
          onPointerDown={stopCardActivation}
        >
          {showContributionWeight && onContributionWeightChange ? (
            <div onPointerDown={stopCardActivation}>
              <ProjectGoalContributionWeightField
                layout="inline"
                value={contributionWeight}
                onCommit={onContributionWeightChange}
              />
            </div>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onPointerDown={stopCardActivation}
            onClick={(event) => {
              stopCardActivation(event);
              onUnlink();
            }}
            className="!p-2 hover:!bg-amber-50 hover:!text-amber-600 dark:hover:!bg-amber-900/20 dark:hover:!text-amber-400"
            aria-label={`Unlink ${goal.title} from ${projectName}`}
          >
            <Link2Off className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
