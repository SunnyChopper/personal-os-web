import { useState } from 'react';
import { Sparkles, AlertCircle, TrendingUp, Wrench, HeartPulse, FlaskConical } from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import type { Habit, HabitLog } from '@/types/growth-system';
import type {
  EstablishedHabitActionType,
  EstablishedHabitAiEnvelope,
  EstablishedHabitSuggestedPatch,
} from '@/types/habit-ai';
import { AIFeatureModelRecovery } from '@/components/molecules/AIFeatureModelRecovery';
import { useAiFeatureToolError } from '@/hooks/useAiFeatureToolError';
import type { AIFeature } from '@/lib/llm/config/feature-types';
import { habitAIService } from '@/services/growth-system/habit-ai.service';
import { computeHabitReadiness } from '@/utils/habit-analytics';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';

const ACTION_META = {
  patternInsight: {
    label: 'What is working?',
    description: 'Evidence-backed patterns from your completion history.',
    icon: TrendingUp,
  },
  routineTuneUp: {
    label: 'Tune the routine',
    description: 'Small cue, friction, and target adjustments.',
    icon: Wrench,
  },
  recoveryPlan: {
    label: 'Recover smartly',
    description: 'Restart steps after misses without guilt spirals.',
    icon: HeartPulse,
  },
  sevenDayExperiment: {
    label: '7-day experiment',
    description: 'One measurable tweak with a clear check-in.',
    icon: FlaskConical,
  },
} as const;

const ACTION_FEATURE: Record<EstablishedHabitActionType, AIFeature> = {
  patternInsight: 'habitPatterns',
  routineTuneUp: 'triggerOptimization',
  recoveryPlan: 'streakRecovery',
  sevenDayExperiment: 'habitDesign',
};

interface AIHabitAssistPanelProps {
  habit: Habit;
  logs: HabitLog[];
  onApplyPatch?: (patch: EstablishedHabitSuggestedPatch) => Promise<void>;
}

export function AIHabitAssistPanel({ habit, logs, onApplyPatch }: AIHabitAssistPanelProps) {
  const [selectedAction, setSelectedAction] = useState<EstablishedHabitActionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [envelope, setEnvelope] = useState<EstablishedHabitAiEnvelope | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const activeFeature = selectedAction ? ACTION_FEATURE[selectedAction] : 'habitPatterns';
  const { error, modelNotFound, applyApiResponseError, clearErrors, setError } =
    useAiFeatureToolError(activeFeature);

  const isConfigured = llmConfig.isConfigured();
  const readiness = computeHabitReadiness(habit, logs);
  const isStarter = readiness === 'starter';

  const runAction = async (actionType: EstablishedHabitActionType) => {
    setSelectedAction(actionType);
    setIsLoading(true);
    clearErrors();
    setEnvelope(null);

    const response = await habitAIService.establishedActions({
      habitId: habit.id,
      actionType,
      useCache: true,
    });

    if (response.success && response.data) {
      setEnvelope(response.data);
    } else {
      applyApiResponseError(response, 'Failed to run AI action');
    }
    setIsLoading(false);
  };

  const handleApplyPatch = async () => {
    const patch = envelope?.result.suggestedHabitPatch;
    if (!patch || !onApplyPatch) return;
    setIsApplying(true);
    try {
      await onApplyPatch(patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply suggestions');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">AI not configured</p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Configure an AI provider in Settings to use habit coaching tools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Coaching for <span className="font-medium text-gray-900 dark:text-white">{habit.name}</span>
        {readiness === 'strongSignal' && (
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">Strong signal</span>
        )}
        {readiness === 'established' && (
          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Established</span>
        )}
        {isStarter && (
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Building history</span>
        )}
      </p>

      {isStarter && (
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3">
          Log a few more completions (5+ or ~1 week of tracking) for richer, history-backed
          coaching. You can still run actions—the server will explain what is missing.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(Object.keys(ACTION_META) as EstablishedHabitActionType[]).map((actionType) => {
          const meta = ACTION_META[actionType];
          const Icon = meta.icon;
          const isActive = selectedAction === actionType;
          return (
            <button
              key={actionType}
              type="button"
              onClick={() => runAction(actionType)}
              disabled={isLoading}
              className={`text-left p-3 rounded-lg border transition-colors touch-manipulation ${
                isActive
                  ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {meta.label}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{meta.description}</p>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center py-8">
          <AIThinkingIndicator />
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Analyzing your habit…</p>
        </div>
      )}

      {modelNotFound && selectedAction ? (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AIFeatureModelRecovery
            feature={ACTION_FEATURE[selectedAction]}
            failedModel={modelNotFound.model}
            onRetry={() => void runAction(selectedAction)}
          />
        </div>
      ) : null}

      {error && !modelNotFound ? (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {envelope && !isLoading && (
        <div className="space-y-4 border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50/80 dark:bg-gray-700/30">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {envelope.result.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {envelope.result.summary}
              </p>
            </div>
          </div>

          {envelope.result.evidence.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                Evidence
              </h5>
              <ul className="space-y-2">
                {envelope.result.evidence.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-600"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                    <span className="text-gray-600 dark:text-gray-400"> — {item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {envelope.result.recommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                Recommendations
              </h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {envelope.result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {envelope.result.experiment && (
            <div className="text-sm space-y-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p>
                <span className="font-medium">Hypothesis:</span>{' '}
                {envelope.result.experiment.hypothesis}
              </p>
              <p>
                <span className="font-medium">Change:</span> {envelope.result.experiment.change}
              </p>
              <p>
                <span className="font-medium">Success:</span>{' '}
                {envelope.result.experiment.successCriterion}
              </p>
            </div>
          )}

          {envelope.result.nextCheckIn && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                Check-in ({envelope.result.nextCheckIn.whenLabel}):
              </span>{' '}
              {envelope.result.nextCheckIn.prompt}
            </p>
          )}

          {envelope.result.suggestedHabitPatch &&
            Object.keys(envelope.result.suggestedHabitPatch).length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Suggested updates
                </h5>
                <pre className="text-xs p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto text-gray-800 dark:text-gray-200">
                  {JSON.stringify(envelope.result.suggestedHabitPatch, null, 2)}
                </pre>
                {onApplyPatch && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleApplyPatch}
                    disabled={isApplying}
                    className="w-full sm:w-auto"
                  >
                    {isApplying ? 'Applying…' : 'Apply suggested updates'}
                  </Button>
                )}
              </div>
            )}

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <AIConfidenceIndicator confidence={envelope.confidence} />
            {(envelope.provider || envelope.model) && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {envelope.provider}
                {envelope.model ? ` · ${envelope.model}` : ''}
                {envelope.cached ? ' · cached' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
