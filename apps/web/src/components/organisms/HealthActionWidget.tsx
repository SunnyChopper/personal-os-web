import {
  Activity,
  AlertCircle,
  Apple,
  Droplets,
  Heart,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useHealthAction } from '@/hooks/useHealthAction';
import type { HealthActionCategory } from '@/types/fitness';

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

function getCategoryIcon(category: HealthActionCategory) {
  switch (category) {
    case 'workout':
      return <Activity className="w-6 h-6" />;
    case 'nutrition':
      return <Apple className="w-6 h-6" />;
    case 'hydration':
      return <Droplets className="w-6 h-6" />;
    case 'habit':
      return <Target className="w-6 h-6" />;
    case 'recovery':
    case 'rest':
      return <Heart className="w-6 h-6" />;
  }
}

function getCategoryColor(category: HealthActionCategory) {
  switch (category) {
    case 'workout':
      return 'text-blue-600 dark:text-blue-400';
    case 'nutrition':
      return 'text-orange-600 dark:text-orange-400';
    case 'hydration':
      return 'text-cyan-600 dark:text-cyan-400';
    case 'habit':
      return 'text-purple-600 dark:text-purple-400';
    case 'recovery':
    case 'rest':
      return 'text-green-600 dark:text-green-400';
  }
}

export function HealthActionWidget() {
  const {
    action,
    generatedAt,
    status,
    alternativeCount,
    isLoading,
    isError,
    regenerate,
    isRegenerating,
  } = useHealthAction();

  const isRecoveryWarning = action?.detectorType === 'lowRecoveryRest';
  const generatedLabel = formatGeneratedAt(generatedAt);
  const isRefreshing = isLoading || isRegenerating;

  const handleRefresh = async () => {
    await regenerate({ force: true });
  };

  const handleCta = (link: string) => {
    if (link.startsWith('/')) {
      window.location.href = link;
    }
  };

  return (
    <div
      className={
        isRecoveryWarning
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/25 dark:to-orange-900/20 p-6 rounded-lg border border-amber-300 dark:border-amber-700'
          : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-lg border border-emerald-200 dark:border-emerald-800'
      }
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {isRecoveryWarning ? (
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          ) : (
            <Heart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRecoveryWarning ? 'Recovery warning' : 'One Health Thing'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition disabled:opacity-50"
          title="Refresh health action"
          aria-label="Refresh health action"
        >
          <RefreshCw
            className={`w-5 h-5 ${
              isRecoveryWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            } ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {(generatedLabel || status === 'stale') && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {status === 'stale' && <span>Stale · </span>}
          {status === 'pending' && <span>Not generated yet · </span>}
          {generatedLabel && <span>Updated {generatedLabel}</span>}
          {alternativeCount > 0 && action && (
            <span>
              {generatedLabel || status !== 'pending' ? ' · ' : ''}
              {alternativeCount} other signal{alternativeCount === 1 ? '' : 's'} skipped
            </span>
          )}
        </p>
      )}
      {!generatedLabel && status !== 'stale' && status !== 'pending' && <div className="mb-4" />}

      {isError ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400 mb-1">Unable to load health action</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
            Backend connection unavailable
          </p>
          <Button variant="secondary" size="sm" onClick={() => void handleRefresh()}>
            Retry
          </Button>
        </div>
      ) : isRefreshing && !action ? (
        <div className="animate-pulse space-y-3" aria-busy="true">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-[70%]" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[85%]" />
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 mt-2" />
        </div>
      ) : status === 'pending' && !action ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-emerald-400 dark:text-emerald-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Your daily health nudge is generated each morning. Refresh to pick your one thing now.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void handleRefresh()}>
            Plan my health action
          </Button>
        </div>
      ) : action ? (
        <div
          className={
            isRecoveryWarning
              ? 'rounded-lg border border-amber-300/90 dark:border-amber-700/90 bg-white/70 dark:bg-gray-900/50 p-4'
              : 'rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 bg-white/60 dark:bg-gray-900/40 p-4'
          }
        >
          {isRecoveryWarning ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-2">
              Suboptimal recovery — consider easing intensity or moving demanding tasks
            </p>
          ) : null}
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 mt-0.5 ${getCategoryColor(action.category)}`}>
              {getCategoryIcon(action.category)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{action.description}</p>
              {action.recommendation && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                  {action.recommendation}
                </p>
              )}
              {action.action && (
                <Button variant="primary" size="sm" onClick={() => handleCta(action.action!.link)}>
                  {action.action.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-emerald-400 dark:text-emerald-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-400">
            All clear on health signals today. Keep up the momentum.
          </p>
        </div>
      )}
    </div>
  );
}
