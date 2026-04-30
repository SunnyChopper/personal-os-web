import { useState, useEffect, useCallback } from 'react';
import { Trophy, Calendar, Coins, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Metric, MetricMilestone, MetricLog } from '@/types/growth-system';
import { metricMilestonesService } from '@/services/growth-system/metric-milestones.service';
import { calculateStreaks } from '@/utils/metric-analytics';
import { ROUTES } from '@/routes';

interface MetricAchievementsProps {
  metric: Metric;
  logs: MetricLog[];
}

export function MetricAchievements({ metric, logs }: MetricAchievementsProps) {
  const [milestones, setMilestones] = useState<MetricMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMilestones = useCallback(async () => {
    try {
      const response = await metricMilestonesService.getMilestones(metric.id);
      if (response.success && response.data) {
        setMilestones(response.data);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setIsLoading(false);
    }
  }, [metric.id]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const streaks = calculateStreaks(logs);
  const totalPoints = milestones.reduce((sum, m) => sum + m.pointsAwarded, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              Points Earned
            </h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {totalPoints.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              From {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            to={ROUTES.admin.rewardsStore}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Store className="w-4 h-4" />
            Redeem
          </Link>
        </div>
      </div>

      {/* Current Streaks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Current Streaks
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {streaks.current}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {streaks.longest}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      {milestones.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievement Badges
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center"
              >
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                  {milestone.type === 'target_reached' && 'Target Reached'}
                  {milestone.type === 'streak' && `${milestone.value}-Day Streak`}
                  {milestone.type === 'improvement' && `${milestone.value}% Better`}
                  {milestone.type === 'consistency' && `${milestone.value} Days`}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {milestone.pointsAwarded} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No achievements yet</p>
          <p className="text-sm">Keep logging to unlock achievements!</p>
        </div>
      )}
    </div>
  );
}
