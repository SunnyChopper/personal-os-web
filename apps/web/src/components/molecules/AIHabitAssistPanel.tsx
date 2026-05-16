import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  FlaskConical,
  RefreshCw,
  Settings2,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import type {
  EstablishedHabitActionType,
  EstablishedHabitAiEnvelope,
} from '@/lib/llm/schemas/habit-established-ai-schemas';
import {
  habitAIService,
  suggestedPatchToUpdateInput,
} from '@/services/growth-system/habit-ai.service';
import type { UpdateHabitInput } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';
import { aiHabitAssistPanelTitle } from '@/components/molecules/ai-habit-assist-modes';

const MODE_ICONS: Record<EstablishedHabitActionType, LucideIcon> = {
  patternInsight: TrendingUp,
  routineTuneUp: Settings2,
  recoveryPlan: RefreshCw,
  sevenDayExperiment: FlaskConical,
};

interface AIHabitAssistPanelProps {
  mode: EstablishedHabitActionType;
  habitId: string;
  habitName: string;
  readinessHint?: 'starter' | 'established' | 'strongSignal';
  onClose: () => void;
  onApplySuggestedPatch?: (patch: UpdateHabitInput) => Promise<void>;
}

export function AIHabitAssistPanel({
  mode,
  habitId,
  habitName,
  readinessHint,
  onClose,
  onApplySuggestedPatch,
}: AIHabitAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<EstablishedHabitAiEnvelope | null>(null);

  const isConfigured = llmConfig.isConfigured();
  const panelTitle = aiHabitAssistPanelTitle(mode);
  const Icon = MODE_ICONS[mode];

  const applyablePatch = useMemo(() => {
    const patch = envelope?.result.suggestedHabitPatch;
    if (!patch) return null;
    const update = suggestedPatchToUpdateInput(patch);
    return Object.keys(update).length > 0 ? update : null;
  }, [envelope]);

  useEffect(() => {
    setEnvelope(null);
    setError(null);
  }, [mode, habitId]);

  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    const response = await habitAIService.runEstablishedAction({
      habitId,
      actionType: mode,
    });
    setIsLoading(false);

    if (response.success && response.data) {
      setEnvelope(response.data);
      return;
    }

    setError(response.error?.message || 'AI coaching request failed');
  };

  const handleApplyPatch = async () => {
    if (!applyablePatch || !onApplySuggestedPatch) return;
    setIsApplying(true);
    setError(null);
    try {
      await onApplySuggestedPatch(applyablePatch);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply suggested update');
    } finally {
      setIsApplying(false);
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
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
    <div className="fixed inset-y-0 right-0 w-96 max-w-[100vw] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl p-6 overflow-y-auto z-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {panelTitle}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Habit: <span className="font-medium text-gray-900 dark:text-gray-100">{habitName}</span>
        </p>
        {readinessHint === 'starter' && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-100">
            This habit is still building history on this device (fewer than five logged completions
            or newer than a week). Coaching stays conservative until logs accumulate—run anyway for
            grounded starter guidance from the server.
          </div>
        )}
      </div>

      {!envelope && (
        <Button onClick={handleRun} disabled={isLoading} className="w-full mb-6">
          {isLoading ? 'Running…' : 'Run coaching'}
        </Button>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <AIThinkingIndicator />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Analyzing habit history…</p>
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {envelope && (
        <div className="space-y-5 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 capitalize">
              {envelope.result.readiness}
            </span>
            {envelope.cached ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                Cached
              </span>
            ) : null}
            {envelope.provider ? (
              <span className="text-gray-500 dark:text-gray-400">{envelope.provider}</span>
            ) : null}
            {envelope.model ? (
              <span className="text-gray-500 dark:text-gray-400 truncate">{envelope.model}</span>
            ) : null}
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {envelope.result.title}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {envelope.result.summary}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Evidence
            </p>
            <ul className="space-y-2">
              {envelope.result.evidence.map((row, i) => (
                <li
                  key={`${row.label}-${i}`}
                  className="text-sm rounded-lg bg-gray-50 dark:bg-gray-700/80 p-3"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{row.label}</span>
                  <span className="text-gray-600 dark:text-gray-300"> — {row.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Recommendations
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {envelope.result.recommendations.map((r, i) => (
                <li key={`${r}-${i}`}>{r}</li>
              ))}
            </ul>
          </div>

          <AIConfidenceIndicator confidence={envelope.confidence} />

          {envelope.result.experiment ? (
            <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-900/15 p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Proposed experiment
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="font-medium">Hypothesis:</span>{' '}
                {envelope.result.experiment.hypothesis}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="font-medium">Change:</span> {envelope.result.experiment.change}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="font-medium">Metric:</span> {envelope.result.experiment.metric}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="font-medium">Success criterion:</span>{' '}
                {envelope.result.experiment.successCriterion}
              </p>
            </div>
          ) : null}

          {envelope.result.nextCheckIn ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Next check-in
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {envelope.result.nextCheckIn.whenLabel}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {envelope.result.nextCheckIn.prompt}
              </p>
            </div>
          ) : null}

          {applyablePatch ? (
            <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Suggested habit update
              </p>
              <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/40 rounded p-3 overflow-x-auto text-gray-800 dark:text-gray-200">
                {JSON.stringify(applyablePatch, null, 2)}
              </pre>
              <Button
                type="button"
                onClick={handleApplyPatch}
                disabled={isApplying || !onApplySuggestedPatch}
                className="w-full"
              >
                {isApplying ? 'Applying…' : 'Apply suggested update'}
              </Button>
              {!onApplySuggestedPatch ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Saving updates from this panel requires the page to supply an apply handler.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setEnvelope(null)}
            >
              Run again
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
