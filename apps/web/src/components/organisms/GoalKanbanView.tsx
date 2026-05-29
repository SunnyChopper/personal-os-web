import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreVertical, ArrowRight, Pencil } from 'lucide-react';
import type { Goal, GoalHealth, GoalStatus, GoalProgressBreakdown } from '@/types/growth-system';
import { normalizeGoalLifecycleStatus } from '@/utils/goal-health-utils';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { HealthBadge } from '@/components/atoms/HealthBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';

interface GoalKanbanViewProps {
  goals: Goal[];
  goalsProgress: Map<string, GoalProgressBreakdown>;
  goalsLinkedCounts: Map<
    string,
    { tasks: number; metrics: number; habits: number; projects: number }
  >;
  goalsHealth: Map<
    string,
    {
      status: GoalHealth;
      daysRemaining: number | null;
      momentum: 'active' | 'dormant';
    }
  >;
  onGoalClick: (goal: Goal) => void;
  onQuickAction?: (
    goalId: string,
    action: 'add_task' | 'log_metric' | 'complete_criterion'
  ) => void;
  onGoalUpdate?: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onCreateGoal?: (status: GoalStatus) => void;
}

const KANBAN_COLUMNS: { status: GoalStatus; label: string; accentColor: string }[] = [
  {
    status: 'Planning',
    label: 'Planning',
    accentColor: 'bg-gray-400 dark:bg-gray-500',
  },
  { status: 'Active', label: 'Active', accentColor: 'bg-blue-500' },
  { status: 'Achieved', label: 'Achieved', accentColor: 'bg-purple-500' },
  { status: 'Abandoned', label: 'Abandoned', accentColor: 'bg-gray-500' },
];

export function GoalKanbanView({
  goals,
  goalsProgress,
  goalsLinkedCounts,
  goalsHealth,
  onGoalClick,
  onGoalUpdate,
  onCreateGoal,
}: GoalKanbanViewProps) {
  const [draggedGoal, setDraggedGoal] = useState<Goal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<GoalStatus | null>(null);
  const [openMenuStatus, setOpenMenuStatus] = useState<GoalStatus | null>(null);
  const menuRefs = useRef<Map<GoalStatus, HTMLDivElement>>(new Map());

  const getGoalsByStatus = (status: GoalStatus) => {
    return goals.filter((goal) => normalizeGoalLifecycleStatus(goal.status) === status);
  };

  const getTotalProgress = (status: GoalStatus) => {
    const statusGoals = getGoalsByStatus(status);
    if (statusGoals.length === 0) return 0;
    const totalProgress = statusGoals.reduce((sum, goal) => {
      const progress = goalsProgress.get(goal.id);
      return sum + (progress?.overall || 0);
    }, 0);
    return Math.round(totalProgress / statusGoals.length);
  };

  const handleDragStart = (e: React.DragEvent, goal: Goal) => {
    setDraggedGoal(goal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: GoalStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: GoalStatus) => {
    e.preventDefault();
    if (draggedGoal && draggedGoal.status !== newStatus && onGoalUpdate) {
      await onGoalUpdate(draggedGoal.id, { status: newStatus });
    }
    setDraggedGoal(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedGoal(null);
    setDragOverColumn(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuStatus) {
        const menuElement = menuRefs.current.get(openMenuStatus);
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuStatus(null);
        }
      }
    };

    if (openMenuStatus) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuStatus]);

  const toggleMenu = (status: GoalStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuStatus(openMenuStatus === status ? null : status);
  };

  const handleMoveAllGoals = async (fromStatus: GoalStatus, toStatus: GoalStatus) => {
    if (!onGoalUpdate) return;
    const goalsToMove = getGoalsByStatus(fromStatus);
    for (const goal of goalsToMove) {
      if (goal.status !== toStatus) {
        await onGoalUpdate(goal.id, { status: toStatus });
      }
    }
    setOpenMenuStatus(null);
  };

  return (
    <div className="h-[calc(100vh-200px)] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-6 py-6 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 h-full min-w-max">
        {KANBAN_COLUMNS.map((column) => {
          const statusGoals = getGoalsByStatus(column.status);
          const totalProgress = getTotalProgress(column.status);
          const isDragOver = dragOverColumn === column.status;

          return (
            <div
              key={column.status}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
              role="region"
              aria-label={`${column.status} goals column`}
            >
              {/* Column Header */}
              <div className="shrink-0 rounded-t-xl bg-gray-100/90 px-3 pb-2 pt-3 dark:bg-gray-800/70">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${column.accentColor}`}
                      aria-hidden
                    />
                    <h3 className="text-sm font-semibold leading-tight text-gray-800 dark:text-gray-100">
                      {column.label}
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {onCreateGoal && (
                      <button
                        type="button"
                        onClick={() => onCreateGoal(column.status)}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                        title="Add goal"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(column.status, e)}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                        title="Column options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuStatus === column.status && (
                        <div
                          ref={(el) => {
                            if (el) menuRefs.current.set(column.status, el);
                          }}
                          className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Move all goals to another status */}
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Move All Goals
                          </div>
                          {KANBAN_COLUMNS.filter((s) => s.status !== column.status).map(
                            (targetColumn) => (
                              <button
                                key={targetColumn.status}
                                onClick={() =>
                                  handleMoveAllGoals(column.status, targetColumn.status)
                                }
                                disabled={statusGoals.length === 0}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ArrowRight className="w-4 h-4" />
                                <span>To {targetColumn.label}</span>
                              </button>
                            )
                          )}

                          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                          {/* Column info */}
                          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                            {statusGoals.length} {statusGoals.length === 1 ? 'goal' : 'goals'}
                            {statusGoals.length > 0 && ` • ${totalProgress}% avg progress`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 min-h-[1.125rem] pl-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {statusGoals.length} {statusGoals.length === 1 ? 'goal' : 'goals'}
                  </span>
                  {statusGoals.length > 0 && (
                    <>
                      <span> · </span>
                      <span>{totalProgress}% avg</span>
                    </>
                  )}
                </div>
              </div>

              {/* Column Content */}
              <div
                className={`flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg p-3 space-y-2.5 overflow-y-auto shadow-sm transition-colors ${
                  isDragOver
                    ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                {statusGoals.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      {isDragOver ? (
                        <span className="font-medium">Drop here</span>
                      ) : (
                        <>
                          <p>No goals</p>
                          {onCreateGoal && (
                            <button
                              onClick={() => onCreateGoal(column.status)}
                              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                            >
                              + Add a goal
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  statusGoals.map((goal) => {
                    const progress = goalsProgress.get(goal.id);
                    const linkedCounts = goalsLinkedCounts.get(goal.id);
                    const health = goalsHealth.get(goal.id);

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, goal)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
                          draggedGoal?.id === goal.id ? 'opacity-40 rotate-2 scale-95' : ''
                        }`}
                        onClick={() => onGoalClick(goal)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <PriorityIndicator priority={goal.priority} size="sm" />
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug">
                              {goal.title}
                            </h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onGoalClick(goal);
                            }}
                            className="flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                            title="Edit goal"
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>

                        {goal.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                            {goal.description}
                          </p>
                        )}

                        {/* Progress Ring */}
                        {progress && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Progress</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {progress.overall}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${progress.overall}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <AreaBadge area={goal.area} size="sm" />
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-medium">
                            {goal.timeHorizon}
                          </span>
                          {linkedCounts && (
                            <>
                              {linkedCounts.tasks > 0 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                  {linkedCounts.tasks} tasks
                                </span>
                              )}
                              {linkedCounts.metrics > 0 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                  {linkedCounts.metrics} metrics
                                </span>
                              )}
                            </>
                          )}
                          {goal.status === 'Active' && (goal.health ?? health?.status) && (
                            <HealthBadge health={goal.health ?? health!.status} />
                          )}
                          {health && health.daysRemaining !== null && (
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                health.daysRemaining < 7
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : health.daysRemaining < 30
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}
                            >
                              {health.daysRemaining}d left
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
