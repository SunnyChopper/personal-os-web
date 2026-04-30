import { useState, useEffect, useCallback } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import type { Metric, Goal, MetricLog } from '@/types/growth-system';
import { goalsService } from '@/services/growth-system/goals.service';
import { useGoals } from '@/hooks/useGrowthSystem';
import { calculateProgress } from '@/utils/metric-analytics';

interface GoalMetricLinkProps {
  metric: Metric;
  logs: MetricLog[];
  onLinkChange?: () => void;
}

export function GoalMetricLink({ metric, logs, onLinkChange }: GoalMetricLinkProps) {
  const { goals: allGoals } = useGoals();
  const [linkedGoals, setLinkedGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGoals = useCallback(() => {
    try {
      // Filter goals from cached data by checking if metric's goalIds includes the goal ID
      const linked = allGoals.filter((goal) => metric.goalIds?.includes(goal.id) ?? false);
      setLinkedGoals(linked);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [metric.id, metric.goalIds, allGoals]);

  useEffect(() => {
    if (allGoals.length > 0) {
      loadGoals();
    } else {
      setIsLoading(false);
    }
  }, [loadGoals, allGoals]);

  const handleLinkGoal = async (goalId: string) => {
    try {
      await goalsService.linkMetric(goalId, metric.id);
      await loadGoals();
      onLinkChange?.();
    } catch (error) {
      console.error('Failed to link goal:', error);
    }
  };

  const handleUnlinkGoal = async (goalId: string) => {
    try {
      await goalsService.unlinkMetric(goalId, metric.id);
      await loadGoals();
      onLinkChange?.();
    } catch (error) {
      console.error('Failed to unlink goal:', error);
    }
  };

  const latestLog = logs.length > 0 ? logs[0] : null;
  const progress = latestLog
    ? calculateProgress(latestLog.value, metric.targetValue, metric.direction)
    : null;

  if (isLoading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Loading goals...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Linked Goals */}
      {linkedGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Linked Goals
          </h4>
          <div className="space-y-2">
            {linkedGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">{goal.title}</h5>
                    {progress && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        This metric contributes {progress.percentage.toFixed(0)}% progress
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnlinkGoal(goal.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link New Goal */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Link to Goal</h4>
        <div className="space-y-2">
          {allGoals
            .filter((g) => !linkedGoals.some((lg) => lg.id === g.id))
            .slice(0, 5)
            .map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleLinkGoal(goal.id)}
                className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {goal.title}
                  </span>
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
