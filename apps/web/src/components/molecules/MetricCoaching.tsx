import { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Sparkles, TrendingUp, AlertCircle, Target } from 'lucide-react';
import type { Metric, MetricLog } from '@/types/growth-system';
import { metricAIService } from '@/services/growth-system/metric-ai.service';
import { metricInsightsService } from '@/services/growth-system/metric-insights.service';
import { calculateProgress, getTrendData } from '@/utils/metric-analytics';

interface MetricCoachingProps {
  metric: Metric;
  logs: MetricLog[];
}

export function MetricCoaching({ metric, logs }: MetricCoachingProps) {
  const [coaching, setCoaching] = useState<{
    message: string;
    tone: string;
    tips: string[];
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCoaching = useCallback(async () => {
    // Try to get cached coaching first
    const insightsResponse = await metricInsightsService.getInsights(metric.id);
    const cachedCoaching = insightsResponse.data?.find(
      (i) => i.type === 'prediction' // Using prediction type as placeholder for coaching
    );

    if (cachedCoaching) {
      setCoaching({
        message: cachedCoaching.description,
        tone: 'guidance',
        tips: [],
        confidence: cachedCoaching.confidence,
      });
      return;
    }

    // Generate new coaching if needed
    if (logs.length >= 3) {
      setIsLoading(true);
      try {
        const result = await metricAIService.generateCoaching(metric, logs);
        if (result.success && result.data) {
          setCoaching(result.data);
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
          await metricInsightsService.cacheInsight({
            metricId: metric.id,
            type: 'prediction',
            title: 'Coaching Message',
            description: result.data.message,
            confidence: result.data.confidence,
            cachedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to load coaching:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [metric, logs]);

  useEffect(() => {
    loadCoaching();
  }, [metric.id, logs.length, loadCoaching]);

  // Fallback to calculated coaching if AI not available
  const calculatedCoaching = useMemo(() => {
    if (logs.length === 0) {
      return {
        message: 'Start logging values to track your progress!',
        tone: 'encouragement' as const,
        tips: ['Log your first value today', 'Set a reminder to log regularly'],
      };
    }

    const latestLog = logs[0];
    const progress = calculateProgress(latestLog.value, metric.targetValue, metric.direction);
    const trend = getTrendData(logs, metric);

    if (progress.percentage >= 100) {
      return {
        message: `Congratulations! You've reached your target of ${metric.targetValue}! 🎉`,
        tone: 'celebration' as const,
        tips: ['Consider setting a new target', 'Maintain this level'],
      };
    }

    if (progress.percentage >= 75 && trend && trend.isImproving) {
      return {
        message: `You're ${progress.percentage.toFixed(0)}% of the way to your target! Keep up the great work!`,
        tone: 'encouragement' as const,
        tips: ['Maintain your current pace', "You're on track to reach your goal"],
      };
    }

    if (trend && !trend.isImproving) {
      return {
        message: `Your progress has slowed. Consider reviewing your approach.`,
        tone: 'warning' as const,
        tips: ['Log values more consistently', 'Review what might be affecting progress'],
      };
    }

    return {
      message: `You're making progress! Keep logging values regularly to track your journey.`,
      tone: 'guidance' as const,
      tips: ['Log values consistently', 'Review trends weekly'],
    };
  }, [metric, logs]);

  const activeCoaching = coaching || calculatedCoaching;

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'celebration':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
      case 'encouragement':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100';
    }
  };

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'celebration':
        return Target;
      case 'encouragement':
        return TrendingUp;
      case 'warning':
        return AlertCircle;
      default:
        return MessageSquare;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ToneIcon = getToneIcon(activeCoaching.tone);

  return (
    <div className={`p-6 rounded-lg border ${getToneColor(activeCoaching.tone)}`}>
      <div className="flex items-start gap-3 mb-4">
        <ToneIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Personalized Coaching</h3>
          <p className="text-sm leading-relaxed">{activeCoaching.message}</p>
        </div>
        {coaching && <Sparkles className="w-4 h-4 opacity-50" />}
      </div>

      {activeCoaching.tips && activeCoaching.tips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <div className="text-xs font-medium mb-2">Tips:</div>
          <ul className="space-y-1 text-xs">
            {activeCoaching.tips.map((tip: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
