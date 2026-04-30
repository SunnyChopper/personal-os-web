import { Target, GitBranch, FolderKanban, ArrowRight, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal, EntitySummary, ProjectStatus } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';

interface GoalRelationshipsPanelProps {
  goal: Goal;
  parentGoal?: Goal | null;
  childGoals?: Goal[];
  linkedProjects?: EntitySummary[];
  onGoalClick?: (goal: Goal) => void;
  onProjectClick?: (project: EntitySummary) => void;
}

export function GoalRelationshipsPanel({
  goal: _goal,
  parentGoal,
  childGoals = [],
  linkedProjects = [],
  onGoalClick,
  onProjectClick,
}: GoalRelationshipsPanelProps) {
  const hasRelationships = parentGoal || childGoals.length > 0 || linkedProjects.length > 0;

  if (!hasRelationships) {
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
        {/* Parent Goal */}
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

        {/* Child Goals / Sub-goals */}
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
                        <StatusBadge status={childGoal.status} size="sm" />
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                          {childGoal.timeHorizon}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Projects */}
        {linkedProjects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <FolderKanban className="w-4 h-4" />
              <span>Projects ({linkedProjects.length})</span>
            </div>
            <div className="space-y-2">
              {linkedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onProjectClick?.(project)}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {project.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <AreaBadge area={project.area} />
                        <StatusBadge status={project.status as ProjectStatus} size="sm" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
