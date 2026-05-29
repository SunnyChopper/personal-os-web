import { useState } from 'react';
import {
  Target,
  GitBranch,
  FolderKanban,
  ArrowRight,
  ArrowDown,
  Link2,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal, EntitySummary, ProjectStatus, GoalDependency } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';

interface GoalRelationshipsPanelProps {
  goal: Goal;
  parentGoal?: Goal | null;
  childGoals?: Goal[];
  linkedProjects?: EntitySummary[];
  schedulePredecessors?: GoalDependency[];
  scheduleSuccessors?: GoalDependency[];
  allGoals?: Goal[];
  onGoalClick?: (goal: Goal) => void;
  onProjectClick?: (project: EntitySummary) => void;
  onAddScheduleDependency?: (predecessorGoalId: string) => Promise<void>;
  onRemoveScheduleDependency?: (predecessorGoalId: string, asSuccessor: boolean) => Promise<void>;
}

export function GoalRelationshipsPanel({
  goal,
  parentGoal,
  childGoals = [],
  linkedProjects = [],
  schedulePredecessors = [],
  scheduleSuccessors = [],
  allGoals = [],
  onGoalClick,
  onProjectClick,
  onAddScheduleDependency,
  onRemoveScheduleDependency,
}: GoalRelationshipsPanelProps) {
  const [predecessorPick, setPredecessorPick] = useState('');
  const [scheduleBusy, setScheduleBusy] = useState(false);

  const hasRelationships =
    parentGoal ||
    childGoals.length > 0 ||
    linkedProjects.length > 0 ||
    schedulePredecessors.length > 0 ||
    scheduleSuccessors.length > 0;

  const candidatePredecessors = allGoals.filter(
    (g) =>
      g.id !== goal.id &&
      !schedulePredecessors.some((d) => d.predecessorGoalId === g.id) &&
      g.targetDate
  );

  const goalTitle = (id: string) => allGoals.find((g) => g.id === id)?.title ?? id;

  const handleAddPredecessor = async () => {
    if (!predecessorPick || !onAddScheduleDependency) return;
    setScheduleBusy(true);
    try {
      await onAddScheduleDependency(predecessorPick);
      setPredecessorPick('');
    } finally {
      setScheduleBusy(false);
    }
  };

  if (!hasRelationships && !onAddScheduleDependency) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Relationships
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
          No relationships defined. Link this goal to parent goals or projects.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <GitBranch className="w-5 h-5" />
        Relationships
      </h3>

      <div className="space-y-6">
        {(onAddScheduleDependency ||
          schedulePredecessors.length > 0 ||
          scheduleSuccessors.length > 0) && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Link2 className="w-4 h-4" />
              <span>Schedule dependencies (Gantt)</span>
            </div>
            {schedulePredecessors.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Blocked by</p>
                <ul className="space-y-2">
                  {schedulePredecessors.map((dep) => (
                    <li
                      key={dep.predecessorGoalId}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm"
                    >
                      <button
                        type="button"
                        className="text-left hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => {
                          const g = allGoals.find((x) => x.id === dep.predecessorGoalId);
                          if (g) onGoalClick?.(g);
                        }}
                      >
                        {goalTitle(dep.predecessorGoalId)}
                        <span className="text-xs text-gray-500 ml-2">lag {dep.lagDays}d</span>
                      </button>
                      {onRemoveScheduleDependency && (
                        <button
                          type="button"
                          aria-label="Remove dependency"
                          disabled={scheduleBusy}
                          onClick={() => onRemoveScheduleDependency(dep.predecessorGoalId, true)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {scheduleSuccessors.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Blocks</p>
                <ul className="space-y-2">
                  {scheduleSuccessors.map((dep) => (
                    <li
                      key={dep.successorGoalId}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm"
                    >
                      <button
                        type="button"
                        className="text-left hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => {
                          const g = allGoals.find((x) => x.id === dep.successorGoalId);
                          if (g) onGoalClick?.(g);
                        }}
                      >
                        {goalTitle(dep.successorGoalId)}
                      </button>
                      {onRemoveScheduleDependency && (
                        <button
                          type="button"
                          aria-label="Remove dependency"
                          disabled={scheduleBusy}
                          onClick={() => onRemoveScheduleDependency(dep.predecessorGoalId, false)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {onAddScheduleDependency && (
              <div className="flex gap-2 mt-2">
                <select
                  value={predecessorPick}
                  onChange={(e) => setPredecessorPick(e.target.value)}
                  className="flex-1 text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">Add predecessor…</option>
                  {candidatePredecessors.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!predecessorPick || scheduleBusy}
                  onClick={handleAddPredecessor}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}

        {parentGoal && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Parent Goal</span>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onGoalClick?.(parentGoal)}
              className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {parentGoal.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <AreaBadge area={parentGoal.area} />
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {parentGoal.timeHorizon}
                    </span>
                  </div>
                </div>
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </motion.div>
          </div>
        )}

        {childGoals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <ArrowDown className="w-4 h-4" />
              <span>Sub-goals ({childGoals.length})</span>
            </div>
            <div className="space-y-2">
              {childGoals.map((childGoal, index) => (
                <motion.div
                  key={childGoal.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onGoalClick?.(childGoal)}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {childGoal.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <AreaBadge area={childGoal.area} />
                        <StatusBadge status={childGoal.status} size="sm" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {linkedProjects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <FolderKanban className="w-4 h-4" />
              <span>Linked Projects ({linkedProjects.length})</span>
            </div>
            <div className="space-y-2">
              {linkedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onProjectClick?.(project)}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {project.title}
                  </h4>
                  {project.status && (
                    <StatusBadge status={project.status as ProjectStatus} size="sm" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
