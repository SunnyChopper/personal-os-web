import { useMemo, useState } from 'react';
import { ManualModelListbox } from '@/components/assistant/ManualModelListbox';
import {
  AssistantModelManualSortChips,
  AssistantModelModeToggle,
} from '@/components/assistant/AssistantModelPickerPrimitives';
import { sortAssistantModels, type ManualModelSortKey } from '@/lib/assistant/model-picker-utils';
import type { ModelPickerDraft } from '@/lib/assistant/run-config-picker-draft';
import type { AssistantModelCatalogData } from '@/types/chatbot';

type LastResolvedModelsDisplay = {
  reasoningLabel: string;
  responseLabel: string;
  modelMode: string;
};

export type AssistantRunConfigPickerFormProps = {
  catalog: AssistantModelCatalogData | null;
  isLoading: boolean;
  draft: ModelPickerDraft;
  onDraftChange: (patch: Partial<ModelPickerDraft>) => void;
  /** When set (e.g. chat page), show “last reply” model line under Auto optimize chips. */
  lastResolved?: LastResolvedModelsDisplay | null;
  disabled?: boolean;
  /** Hint under manual listboxes (chat vs proactive wording). */
  manualHelpText?: string;
  /** When Auto and `lastResolved` is absent, show this note (e.g. chat: “after next reply”). */
  autoLastReplyPlaceholder?: string | null;
};

export function AssistantRunConfigPickerForm({
  catalog,
  isLoading,
  draft,
  onDraftChange,
  lastResolved,
  disabled,
  manualHelpText = 'Manual choices apply after you tap Save — your next message uses the saved models.',
  autoLastReplyPlaceholder = null,
}: AssistantRunConfigPickerFormProps) {
  const [manualSortBy, setManualSortBy] = useState<ManualModelSortKey>('default');

  const sortedPickerModels = useMemo(
    () => (catalog ? sortAssistantModels(catalog.models, manualSortBy) : []),
    [catalog, manualSortBy]
  );

  if (isLoading || !catalog) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Loading models…</p>;
  }
  if (catalog.models.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        No models available. Configure LLM API keys for your deployment.
      </p>
    );
  }

  return (
    <>
      <AssistantModelModeToggle
        mode={draft.mode}
        disabled={disabled}
        onChange={(m) => onDraftChange({ mode: m })}
      />
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 mt-3">
        Context compaction
      </p>
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDraftChange({ compactionMode: 'auto' })}
            className={`px-2 py-2 sm:py-1.5 rounded-md text-xs text-left min-h-[44px] sm:min-h-0 flex-1 sm:flex-none ${
              (draft.compactionMode ?? 'auto') !== 'manual'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }`}
          >
            Auto compact
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDraftChange({ compactionMode: 'manual' })}
            className={`px-2 py-2 sm:py-1.5 rounded-md text-xs text-left min-h-[44px] sm:min-h-0 flex-1 sm:flex-none ${
              (draft.compactionMode ?? 'auto') === 'manual'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }`}
          >
            Manual compact
          </button>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          <strong>Auto</strong> lets the server summarize older turns when you are near the model
          limit. <strong>Manual</strong> never does that silently—you run &quot;Compact thread&quot;
          in chat (or start a new thread) when the meter says it is required.
        </p>
      </div>
      {draft.mode === 'auto' ? (
        <>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Optimize for
          </p>
          <div className="flex flex-col gap-1.5 mb-2">
            {(
              [
                ['speed', 'Speed'],
                ['intelligence', 'Intelligence'],
                ['cost', 'Cost / economy'],
                ['balanced', 'Balanced'],
                ['value', 'Value (quality per $)'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onDraftChange({ optimizeFor: key })}
                className={`px-2 py-2 sm:py-1.5 rounded-md text-xs text-left min-h-[44px] sm:min-h-0 ${
                  draft.optimizeFor === key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
            Auto ranks models from your configured API keys using catalog scores. Cost bars mean
            cheapness (higher = lower $). Balanced uses 0.4×intel + 0.3×speed + 0.3×cost. The LLM
            router (if enabled server-side) can also weigh capability tags like vision or realtime
            web.
          </p>
          {lastResolved ? (
            <>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Last reply (this chat)
              </p>
              <div className="text-xs text-gray-800 dark:text-gray-200 space-y-1 mb-1">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Reasoning: </span>
                  {lastResolved.reasoningLabel}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Response: </span>
                  {lastResolved.responseLabel}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  Mode: {lastResolved.modelMode || '—'}
                </div>
              </div>
            </>
          ) : autoLastReplyPlaceholder ? (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0">
              {autoLastReplyPlaceholder}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <AssistantModelManualSortChips
            sortBy={manualSortBy}
            disabled={disabled}
            onSortByChange={setManualSortBy}
          />
          <div className="space-y-2 mb-1">
            <ManualModelListbox
              label="Reasoning / planning"
              models={sortedPickerModels}
              value={draft.reasoningModelId}
              disabled={disabled}
              onChange={(id) => onDraftChange({ reasoningModelId: id })}
            />
            <ManualModelListbox
              label="Response"
              models={sortedPickerModels}
              value={draft.responseModelId}
              disabled={disabled}
              onChange={(id) => onDraftChange({ responseModelId: id })}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">{manualHelpText}</p>
        </>
      )}
    </>
  );
}
