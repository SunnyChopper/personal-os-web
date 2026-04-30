import { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Zap,
  Activity,
  Target,
  Lightbulb,
} from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import type { Metric, MetricLog, MetricInsight } from '@/types/growth-system';
import { metricInsightsService } from '@/services/growth-system/metric-insights.service';
import { metricAIService } from '@/services/growth-system/metric-ai.service';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';

type InsightType = 'pattern' | 'anomaly' | 'correlation' | 'prediction' | 'milestone';

interface MetricInsightsPanelProps {
  metric: Metric;
  logs: MetricLog[];
  onClose: () => void;
  onApplyTarget?: (target: number) => void;
}

export function MetricInsightsPanel({
  metric,
  logs,
  onClose,
  onApplyTarget: _onApplyTarget,
}: MetricInsightsPanelProps) {
  const [insights, setInsights] = useState<MetricInsight[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<InsightType | 'all'>('all');
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const isConfigured = llmConfig.isConfigured();

  useEffect(() => {
    loadCachedInsights();
    checkRefreshNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric.id]);

  const loadCachedInsights = async () => {
    try {
      const response = await metricInsightsService.getInsights(metric.id);
      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (err) {
      console.error('Failed to load insights:', err);
    }
  };

  const checkRefreshNeeded = async () => {
    try {
      const needs = await metricInsightsService.needsRefresh(metric.id);
      setNeedsRefresh(needs);
    } catch (err) {
      console.error('Failed to check refresh status:', err);
    }
  };

  const refreshInsights = async () => {
    if (!isConfigured) {
      setError('AI not configured. Please configure in Settings.');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      // Invalidate old insights
      await metricInsightsService.invalidateInsights(metric.id);

      // Generate new insights for each type
      const newInsights: Array<Omit<MetricInsight, 'id' | 'cachedAt' | 'expiresAt'>> = [];

      // Pattern recognition
      const patternsResult = await metricAIService.analyzePatterns(metric, logs);
      if (patternsResult.success && patternsResult.data) {
        patternsResult.data.patterns.forEach((pattern) => {
          newInsights.push({
            metricId: metric.id,
            type: 'pattern',
            title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern Detected`,
            description: pattern.description,
            confidence: patternsResult.data!.confidence,
          });
        });
      }

      // Anomaly detection
      const anomaliesResult = await metricAIService.detectAnomalies(metric, logs);
      if (anomaliesResult.success && anomaliesResult.data && anomaliesResult.data.isAnomaly) {
        newInsights.push({
          metricId: metric.id,
          type: 'anomaly',
          title: `Anomaly Detected: ${anomaliesResult.data.anomalyType || 'Unusual Value'}`,
          description: anomaliesResult.data.possibleCauses.join('. '),
          confidence: anomaliesResult.data.confidence,
        });
      }

      // Predictions
      if (metric.targetValue) {
        const predictionResult = await metricAIService.predictTrajectory(metric, logs);
        if (predictionResult.success && predictionResult.data) {
          newInsights.push({
            metricId: metric.id,
            type: 'prediction',
            title: 'Trajectory Prediction',
            description: `Projected to reach ${predictionResult.data.projectedValue.toFixed(1)} in 30 days`,
            confidence: predictionResult.data.confidence,
          });
        }
      }

      // Cache new insights
      if (newInsights.length > 0) {
        const cacheResult = await metricInsightsService.cacheInsights(newInsights);
        if (cacheResult.success && cacheResult.data) {
          setInsights(cacheResult.data);
          setNeedsRefresh(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh insights');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredInsights =
    selectedType === 'all' ? insights : insights.filter((i) => i.type === selectedType);

  const getTypeIcon = (type: InsightType) => {
    switch (type) {
      case 'pattern':
        return <TrendingUp className="w-4 h-4" />;
      case 'anomaly':
        return <Zap className="w-4 h-4" />;
      case 'correlation':
        return <Activity className="w-4 h-4" />;
      case 'prediction':
        return <Target className="w-4 h-4" />;
      case 'milestone':
        return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: InsightType) => {
    switch (type) {
      case 'pattern':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'anomaly':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'correlation':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'prediction':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'milestone':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    }
  };

  if (!isConfigured) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl p-6 overflow-y-auto z-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                AI Not Configured
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Configure an AI provider in Settings to use AI insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl p-6 overflow-y-auto z-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Metric:{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">{metric.name}</span>
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={refreshInsights}
            disabled={isRefreshing}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : needsRefresh ? 'Refresh Insights' : 'Refresh Now'}
          </Button>
        </div>

        {needsRefresh && !isRefreshing && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            Insights may be outdated. Click refresh to get the latest analysis.
          </div>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 text-xs rounded-full transition ${
            selectedType === 'all'
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {(['pattern', 'anomaly', 'correlation', 'prediction', 'milestone'] as InsightType[]).map(
          (type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 text-xs rounded-full transition flex items-center gap-1 ${
                selectedType === type
                  ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {getTypeIcon(type)}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          )
        )}
      </div>

      {isRefreshing && (
        <div className="flex flex-col items-center justify-center py-12">
          <AIThinkingIndicator />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Analyzing metric data...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {!isRefreshing && filteredInsights.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No insights available</p>
          <p className="text-sm">Click "Refresh Insights" to generate AI analysis</p>
        </div>
      )}

      {!isRefreshing && filteredInsights.length > 0 && (
        <div className="space-y-3">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(insight.type as InsightType)}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {insight.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(insight.type as InsightType)}`}
                  >
                    {insight.type}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{insight.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <AIConfidenceIndicator confidence={insight.confidence} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Cached: {new Date(insight.cachedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
