import { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Calendar, Coins, Store, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Metric, MetricMilestone, MetricLog } from '@/types/growth-system';
import { metricMilestonesService } from '@/services/growth-system/metric-milestones.service';
import { calculateProgress, calculateStreaks } from '@/utils/metric-analytics';
import { ROUTES } from '@/routes';

interface MetricMilestoneSystemProps {
  metric: Metric;
  logs: MetricLog[];
  onMilestoneDetected?: (milestone: MetricMilestone) => void;
}

export function MetricMilestoneSystem({
  metric,
  logs,
  onMilestoneDetected,
}: MetricMilestoneSystemProps) {
  const [milestones, setMilestones] = useState<MetricMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
    detectNewMilestones();
  }, [metric.id, logs.length]);

  const loadMilestones = async () => {
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
  };

  const detectNewMilestones = async () => {
    try {
      const response = await metricMilestonesService.detectMilestones(metric, logs);
      if (response.success && response.data && response.data.length > 0) {
        setMilestones((prev) => [...response.data!, ...prev]);
        response.data.forEach((milestone) => {
          onMilestoneDetected?.(milestone);
        });
      }
    } catch (error) {
      console.error('Failed to detect milestones:', error);
    }
  };

  const getMilestoneIcon = (type: MetricMilestone['type']) => {
    switch (type) {
      case 'target_reached':
        return <Target className="w-5 h-5" />;
      case 'streak':
        return <Calendar className="w-5 h-5" />;
      case 'improvement':
        return <TrendingUp className="w-5 h-5" />;
      case 'consistency':
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getMilestoneLabel = (milestone: MetricMilestone) => {
    switch (milestone.type) {
      case 'target_reached':
        return `Target Reached: ${milestone.value}`;
      case 'streak':
        return `${milestone.value}-Day Logging Streak`;
      case 'improvement':
        return `${milestone.value}% Improvement`;
      case 'consistency':
        return `${milestone.value} Days of Consistent Logging`;
    }
  };

  // Calculate progress toward next milestones
  const streaks = calculateStreaks(logs);
  const latestLog = logs.length > 0 ? logs[0] : null;
  const progress = latestLog
    ? calculateProgress(latestLog.value, metric.targetValue, metric.direction)
    : null;

  const nextMilestones = [];
  if (metric.targetValue && progress && progress.percentage < 100) {
    nextMilestones.push({
      type: 'target_reached',
      label: 'Reach Target',
      progress: progress.percentage,
      value: metric.targetValue,
    });
  }

  const nextStreakMilestones = [7, 30, 100].filter((days) => {
    const hasMilestone = milestones.some(
      (m) => m.type === 'streak' && Math.abs(m.value - days) < 1
    );
    return !hasMilestone && streaks.current < days;
  });

  if (nextStreakMilestones.length > 0) {
    const nextStreak = nextStreakMilestones[0];
    nextMilestones.push({
      type: 'streak',
      label: `${nextStreak}-Day Streak`,
      progress: (streaks.current / nextStreak) * 100,
      value: nextStreak,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achieved Milestones */}
      {milestones.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achieved Milestones ({milestones.length})
          </h3>
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                      {getMilestoneIcon(milestone.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {getMilestoneLabel(milestone)}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Achieved on {new Date(milestone.achievedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{milestone.pointsAwarded}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">points</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Milestones */}
      {nextMilestones.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Milestones
          </h3>
          <div className="space-y-3">
            {nextMilestones.map((next, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{next.label}</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {next.progress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, next.progress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Store Link */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Redeem Your Points
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You've earned points from milestones. Visit the Rewards Store to redeem them!
            </p>
          </div>
          <Link
            to={ROUTES.admin.rewardsStore}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Store className="w-4 h-4" />
            Rewards Store
          </Link>
        </div>
      </div>

      {milestones.length === 0 && nextMilestones.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No milestones yet</p>
          <p className="text-sm">Keep logging values to unlock achievements and earn points!</p>
        </div>
      )}
    </div>
  );
}
