import { Plus, TrendingUp, Target, Calendar, Sparkles } from 'lucide-react';
import type { Metric } from '@/types/growth-system';
import Button from '@/components/atoms/Button';

interface MetricEmptyStatesProps {
  type: 'no_metrics' | 'no_logs' | 'no_insights' | 'no_milestones';
  onCreateMetric?: () => void;
  onLogValue?: () => void;
  onGenerateInsights?: () => void;
  metric?: Metric;
}

export function MetricEmptyStates({
  type,
  onCreateMetric,
  onLogValue,
  onGenerateInsights,
  metric,
}: MetricEmptyStatesProps) {
  if (type === 'no_metrics') {
    return (
      <div className="text-center py-16">
        <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No metrics yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Start tracking your progress by creating your first metric. Metrics help you measure what
          matters most to your personal growth.
        </p>
        {onCreateMetric && (
          <Button variant="primary" onClick={onCreateMetric}>
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Metric
          </Button>
        )}
      </div>
    );
  }

  if (type === 'no_logs') {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No logs yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Start tracking by logging your first value for {metric?.name}
        </p>
        {onLogValue && (
          <Button variant="primary" onClick={onLogValue} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Log First Value
          </Button>
        )}
      </div>
    );
  }

  if (type === 'no_insights') {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No insights available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Generate AI-powered insights to discover patterns and get recommendations
        </p>
        {onGenerateInsights && (
          <Button variant="primary" onClick={onGenerateInsights} size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Insights
          </Button>
        )}
      </div>
    );
  }

  if (type === 'no_milestones') {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No milestones yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Keep logging values consistently to unlock achievements and earn points!
        </p>
      </div>
    );
  }

  return null;
}
