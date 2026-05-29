import { useMemo, useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useDashboardInsights } from '@/hooks/useDashboardInsights';
import type { DashboardInsight, DashboardInsightType } from '@/types/growth-system';

function formatGeneratedAt(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

export function AIInsightsWidget() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const {
    insights,
    summary,
    generatedAt,
    focusAreas,
    status,
    isLoading,
    isError,
    regenerate,
    isRegenerating,
  } = useDashboardInsights();

  const visibleInsights = useMemo(
    () => insights.filter((i) => !dismissedIds.includes(i.id)).slice(0, 4),
    [insights, dismissedIds]
  );

  const generatedLabel = formatGeneratedAt(generatedAt);
  const isRefreshing = isLoading || isRegenerating;

  const handleDismiss = (insightId: string) => {
    setDismissedIds((prev) => [...prev, insightId]);
  };

  const handleRefresh = async () => {
    setDismissedIds([]);
    await regenerate({ force: true });
  };

  const getIcon = (type: DashboardInsightType) => {
    switch (type) {
      case 'opportunity':
        return <Zap className="w-5 h-5" />;
      case 'warning':
      case 'bottleneck':
        return <AlertTriangle className="w-5 h-5" />;
      case 'achievement':
        return <Target className="w-5 h-5" />;
      case 'recommendation':
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getColor = (type: DashboardInsightType) => {
    switch (type) {
      case 'opportunity':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
      case 'warning':
      case 'bottleneck':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      case 'achievement':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
      case 'recommendation':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300';
    }
  };

  const renderInsightBody = (insight: DashboardInsight) => (
    <>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{insight.title}</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{insight.description}</p>
      {insight.recommendation && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
          {insight.recommendation}
        </p>
      )}
      {insight.action && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (insight.action?.link.startsWith('/')) {
              window.location.href = insight.action.link;
            }
          }}
          className="mt-2"
        >
          {insight.action.label}
        </Button>
      )}
    </>
  );

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h2>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition disabled:opacity-50"
          title="Refresh insights"
          aria-label="Refresh insights"
        >
          <RefreshCw
            className={`w-5 h-5 text-amber-600 dark:text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
      {(generatedLabel || focusAreas.length > 0) && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {focusAreas.length > 0 && (
            <span>
              Focus: {focusAreas.slice(0, 2).join(', ')}
              {status === 'stale' && ' · stale'}
              {status === 'pending' && ' · generating…'}
            </span>
          )}
          {generatedLabel && (
            <span className={focusAreas.length > 0 ? ' · ' : ''}>Updated {generatedLabel}</span>
          )}
        </p>
      )}
      {!generatedLabel && !focusAreas.length && <div className="mb-4" />}

      {summary && visibleInsights.length > 0 && (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{summary}</p>
      )}

      {isError ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400 mb-1">Unable to load insights</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
            Backend connection unavailable
          </p>
          <Button variant="secondary" size="sm" onClick={() => void handleRefresh()}>
            Retry
          </Button>
        </div>
      ) : isRefreshing && visibleInsights.length === 0 ? (
        <div className="space-y-3 animate-pulse" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-amber-200/80 dark:border-amber-800/80 bg-white/55 dark:bg-gray-900/35 p-4 flex items-start gap-3 pr-6"
            >
              <div
                className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700"
                aria-hidden
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[72%]" aria-hidden />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" aria-hidden />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-[86%]" aria-hidden />
              </div>
            </div>
          ))}
        </div>
      ) : status === 'pending' && visibleInsights.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-amber-400 dark:text-amber-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Insights are generated daily. Refresh to analyze now.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void handleRefresh()}>
            Refresh Insights
          </Button>
        </div>
      ) : visibleInsights.length > 0 ? (
        <div className="space-y-3">
          {visibleInsights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-lg border p-4 ${getColor(insight.type)} relative group`}
            >
              <button
                type="button"
                onClick={() => handleDismiss(insight.id)}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition"
                aria-label="Dismiss insight"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>
                <div className="flex-1 min-w-0">{renderInsightBody(insight)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-amber-400 dark:text-amber-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400">
            All caught up! No new insights at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
