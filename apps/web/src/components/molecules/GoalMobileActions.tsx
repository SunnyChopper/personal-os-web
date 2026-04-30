import { useState } from 'react';
import { Plus, X, CheckSquare, BarChart3, Repeat, Target } from 'lucide-react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import type { Goal } from '@/types/growth-system';

interface GoalMobileActionsProps {
  goal: Goal;
  onAddTask?: () => void;
  onLogMetric?: () => void;
  onCompleteHabit?: () => void;
  onCompleteCriterion?: () => void;
}

export function GoalMobileActions({
  goal,
  onAddTask,
  onLogMetric,
  onCompleteHabit,
  onCompleteCriterion,
}: GoalMobileActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: 'add_task',
      label: 'Add Task',
      icon: CheckSquare,
      color: 'bg-blue-500',
      action: onAddTask,
    },
    {
      id: 'log_metric',
      label: 'Log Metric',
      icon: BarChart3,
      color: 'bg-green-500',
      action: onLogMetric,
    },
    {
      id: 'complete_habit',
      label: 'Complete Habit',
      icon: Repeat,
      color: 'bg-amber-500',
      action: onCompleteHabit,
    },
    {
      id: 'complete_criterion',
      label: 'Complete Criterion',
      icon: Target,
      color: 'bg-purple-500',
      action: onCompleteCriterion,
    },
  ].filter((a) => a.action);

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe up to expand
    if (info.offset.y < -50 && !isExpanded) {
      setIsExpanded(true);
    }
    // Swipe down to collapse
    else if (info.offset.y > 50 && isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDrag}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform md:hidden ${
          isExpanded ? 'bg-gray-600' : 'bg-blue-600'
        }`}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Action Sheet */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
            />

            {/* Action Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-40 p-6 pb-8 md:hidden"
            >
              {/* Drag Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Goal Info */}
              <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Quick Actions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {goal.title}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        action.action?.();
                        setIsExpanded(false);
                      }}
                      className={`${action.color} p-4 rounded-xl text-white flex flex-col items-center gap-2 hover:opacity-90 transition-opacity active:scale-95`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
