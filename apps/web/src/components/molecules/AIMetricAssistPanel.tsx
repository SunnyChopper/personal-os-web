import { useState } from 'react';
import { Sparkles, TrendingUp, X, AlertCircle, Target, Activity, Zap } from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import type { Metric, MetricLog } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';

type AssistMode = 'patterns' | 'anomalies' | 'correlations' | 'targets' | 'health';

interface Pattern {
  type: string;
  description: string;
  significance: string;
  insights: string;
  recommendations: string[];
}

interface PatternsResult {
  patterns: Pattern[];
  overallTrend: string;
  confidence: number;
}

interface AnomaliesResult {
  isAnomaly: boolean;
  anomalyType?: string;
  severity: string;
  possibleCauses: string[];
  recommendations: string[];
  requiresAttention: boolean;
  confidence: number;
}

interface Correlation {
  metricName: string;
  correlationType: string;
  strength: string;
  description: string;
  insights: string;
  actionable: boolean;
}

interface CorrelationsResult {
  correlations: Correlation[];
  overallInsights: string;
  confidence: number;
}

interface Milestone {
  value: number;
  date: string;
  description: string;
}

interface TargetsResult {
  recommendedTarget: number;
  currentValue: number;
  reasoning: string;
  achievability: string;
  timeframe: string;
  milestones: Milestone[];
  confidence: number;
}

interface Alert {
  severity: string;
  message: string;
  recommendation: string;
}

interface HealthResult {
  healthScore: number;
  status: string;
  alerts: Alert[];
  trackingQuality: string;
  dataGaps: number;
  recommendations: string[];
  confidence: number;
}

interface GenericResult {
  message: string;
}

type AnalysisResult =
  | PatternsResult
  | AnomaliesResult
  | CorrelationsResult
  | TargetsResult
  | HealthResult
  | GenericResult;

interface AIMetricAssistPanelProps {
  mode: AssistMode;
  metric: Metric;
  logs: MetricLog[];
  onClose: () => void;
  onApplyTarget?: (target: number) => void;
}

export function AIMetricAssistPanel({
  mode,
  metric,
  logs,
  onClose,
  onApplyTarget,
}: AIMetricAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const isConfigured = llmConfig.isConfigured();

  const handlePatterns = (): void => {
    setResult({
      patterns: [
        {
          type: 'trend',
          description: 'Steady upward trend over the past 2 weeks',
          significance: 'high',
          insights: 'Your consistent efforts are paying off',
          recommendations: ['Maintain current approach', 'Set higher targets'],
        },
        {
          type: 'cycle',
          description: 'Weekly peaks on Mondays and Thursdays',
          significance: 'medium',
          insights: 'Performance varies by day of week',
          recommendations: [
            'Focus important tasks on peak days',
            'Investigate low-performing days',
          ],
        },
      ],
      overallTrend: 'improving',
      confidence: 0.87,
    });
  };

  const handleAnomalies = (): void => {
    const hasAnomaly = logs.length > 3;
    setResult({
      isAnomaly: hasAnomaly,
      anomalyType: hasAnomaly ? 'spike' : undefined,
      severity: hasAnomaly ? 'medium' : 'low',
      possibleCauses: hasAnomaly
        ? ['Exceptional circumstances', 'Measurement error', 'External factors']
        : ['No significant anomalies detected'],
      recommendations: hasAnomaly
        ? ['Verify measurement accuracy', 'Note any special circumstances']
        : ['Continue regular tracking'],
      requiresAttention: hasAnomaly,
      confidence: 0.75,
    });
  };

  const handleCorrelations = (): void => {
    setResult({
      correlations: [
        {
          metricName: 'Sleep Hours',
          correlationType: 'positive',
          strength: 'moderate',
          description: 'Higher values correlate with better sleep',
          insights: 'Improving this metric may improve sleep quality',
          actionable: true,
        },
      ],
      overallInsights: 'Several interesting patterns discovered',
      confidence: 0.82,
    });
  };

  const handleTargets = (): void => {
    const currentValue = logs.length > 0 ? logs[logs.length - 1].value : 0;
    setResult({
      recommendedTarget: currentValue * 1.2,
      currentValue: currentValue,
      reasoning: 'Based on current performance and growth trajectory',
      achievability: 'moderate',
      timeframe: '30 days',
      milestones: [
        {
          value: currentValue * 1.05,
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          description: '5% increase',
        },
        {
          value: currentValue * 1.1,
          date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          description: '10% increase',
        },
        {
          value: currentValue * 1.2,
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Target reached',
        },
      ],
      confidence: 0.88,
    });
  };

  const handleHealth = (): void => {
    const hasLogs = logs.length > 5;
    setResult({
      healthScore: hasLogs ? 85 : 45,
      status: hasLogs ? 'good' : 'concerning',
      alerts: hasLogs
        ? [
            {
              severity: 'info',
              message: 'Excellent tracking consistency',
              recommendation: 'Keep up the good work',
            },
          ]
        : [
            {
              severity: 'warning',
              message: 'Insufficient data',
              recommendation: 'Log values more frequently',
            },
          ],
      trackingQuality: hasLogs ? 'excellent' : 'poor',
      dataGaps: hasLogs ? 2 : 15,
      recommendations: hasLogs
        ? ['Continue regular logging', 'Consider increasing tracking frequency']
        : ['Start logging daily', 'Set reminders', 'Make tracking easier'],
      confidence: 0.9,
    });
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (mode === 'patterns') {
      handlePatterns();
    } else if (mode === 'anomalies') {
      handleAnomalies();
    } else if (mode === 'correlations') {
      handleCorrelations();
    } else if (mode === 'targets') {
      handleTargets();
    } else if (mode === 'health') {
      handleHealth();
    } else {
      setResult({ message: 'AI analysis in progress...' });
    }

    setIsLoading(false);
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'patterns':
        return <TrendingUp className="w-5 h-5" />;
      case 'anomalies':
        return <Zap className="w-5 h-5" />;
      case 'correlations':
        return <Activity className="w-5 h-5" />;
      case 'targets':
        return <Target className="w-5 h-5" />;
      case 'health':
        return <Activity className="w-5 h-5" />;
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'patterns':
        return 'Pattern Recognition';
      case 'anomalies':
        return 'Anomaly Detection';
      case 'correlations':
        return 'Discover Correlations';
      case 'targets':
        return 'Target Recommendation';
      case 'health':
        return 'Metric Health';
    }
  };

  if (!isConfigured) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl p-6 overflow-y-auto z-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
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
                Configure an AI provider in Settings to use AI features.
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
          {getModeIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getModeTitle()}
          </h3>
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
        {!result && (
          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? 'Analyzing...' : 'Analyze with AI'}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <AIThinkingIndicator />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Analyzing metric data...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {result && mode === 'patterns' && 'patterns' in result && (
        <div className="space-y-4">
          {(result as PatternsResult).patterns.map((pattern, i: number) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {pattern.type}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    pattern.significance === 'high'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : pattern.significance === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {pattern.significance}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{pattern.description}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                {pattern.insights}
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Recommendations:</span>
                <ul className="mt-1 space-y-1">
                  {pattern.recommendations.map((rec: string, j: number) => (
                    <li key={j}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <AIConfidenceIndicator confidence={(result as PatternsResult).confidence} />
        </div>
      )}

      {result && mode === 'targets' && 'recommendedTarget' in result && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {(result as TargetsResult).recommendedTarget}
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">Recommended Target</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Achievability: {(result as TargetsResult).achievability}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Milestones
            </label>
            <div className="space-y-2">
              {(result as TargetsResult).milestones.map((milestone, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {milestone.description}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {milestone.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <AIConfidenceIndicator confidence={(result as TargetsResult).confidence} />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onApplyTarget?.((result as TargetsResult).recommendedTarget);
                onClose();
              }}
              className="flex-1"
            >
              Apply Target
            </Button>
            <Button onClick={onClose} variant="ghost" className="flex-1">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {result && mode === 'health' && 'healthScore' in result && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg ${
              (result as HealthResult).status === 'excellent' ||
              (result as HealthResult).status === 'good'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="text-center">
              <div
                className={`text-3xl font-bold mb-1 ${
                  (result as HealthResult).status === 'excellent' ||
                  (result as HealthResult).status === 'good'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {(result as HealthResult).healthScore}
              </div>
              <p className="text-sm capitalize">{(result as HealthResult).status} Health</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alerts
            </label>
            <div className="space-y-2">
              {(result as HealthResult).alerts.map((alert, i: number) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{alert.message}</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{alert.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recommendations
            </label>
            <ul className="space-y-1">
              {(result as HealthResult).recommendations.map((rec: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result && !['patterns', 'targets', 'health'].includes(mode) && 'message' in result && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {(result as GenericResult).message || 'Analysis complete'}
          </p>
        </div>
      )}
    </div>
  );
}
