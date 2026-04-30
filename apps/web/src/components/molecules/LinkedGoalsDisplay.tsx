import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Goal } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { ROUTES } from '@/routes';

interface LinkedGoalsDisplayProps {
  goals: Goal[];
  title?: string;
  className?: string;
}

export function LinkedGoalsDisplay({
  goals,
  title = 'Contributing to Goals',
  className = '',
}: LinkedGoalsDisplayProps) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">{title}</h4>
      </div>

      <div className="space-y-2">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`${ROUTES.admin.goals}?goalId=${goal.id}`}
              className="block p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {goal.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <AreaBadge area={goal.area} />
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {goal.timeHorizon}
                    </span>
                    <StatusBadge status={goal.status} size="sm" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
