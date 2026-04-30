import { CheckSquare, BarChart3, Repeat, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GoalActivity } from '@/types/growth-system';

interface GoalActivityTimelineProps {
  activities: GoalActivity[];
  maxItems?: number;
  showEmpty?: boolean;
}

export function GoalActivityTimeline({
  activities,
  maxItems,
  showEmpty = true,
}: GoalActivityTimelineProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  // Group activities by date
  const groupedByDate = displayActivities.reduce(
    (acc, activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    },
    {} as Record<string, GoalActivity[]>
  );

  const getActivityIcon = (type: GoalActivity['type']) => {
    switch (type) {
      case 'criterion_completed':
        return <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'task_completed':
        return <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'metric_logged':
        return <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'habit_completed':
        return <Repeat className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'status_changed':
        return <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'note_added':
        return <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'progress_milestone':
        return <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (activities.length === 0 && showEmpty) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No activity yet. Start working on this goal to see your progress!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>

      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, dateActivities], dateIndex) => (
          <div key={date}>
            {/* Date Header */}
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{date}</div>

            {/* Activities for this date */}
            <div className="space-y-2 relative">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />

              {dateActivities.map((activity, activityIndex) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dateIndex * 0.1 + activityIndex * 0.05 }}
                  className="relative pl-8 pb-3"
                >
                  {/* Icon */}
                  <div className="absolute left-0 top-0 bg-white dark:bg-gray-800 p-1 rounded-full border-2 border-gray-200 dark:border-gray-700">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {getRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {maxItems && activities.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View all {activities.length} activities
          </button>
        </div>
      )}
    </div>
  );
}
