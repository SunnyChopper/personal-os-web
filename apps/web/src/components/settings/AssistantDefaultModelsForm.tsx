import { useMemo, useState } from 'react';
import { ManualModelListbox } from '@/components/assistant/ManualModelListbox';
import {
  AssistantModelManualSortChips,
  AssistantModelModeToggle,
} from '@/components/assistant/AssistantModelPickerPrimitives';
import { sortAssistantModels, type ManualModelSortKey } from '@/lib/assistant/model-picker-utils';
import type { DefaultModelsDraft } from '@/lib/assistant/run-config-picker-draft';
import type { AssistantModelCatalogData } from '@/types/chatbot';

export type AssistantDefaultModelsFormProps = {
  catalog: AssistantModelCatalogData | null;
  isLoading: boolean;
  draft: DefaultModelsDraft;
  onDraftChange: (patch: Partial<DefaultModelsDraft>) => void;
  disabled?: boolean;
  isCustom: boolean;
  onResetToImplicitDefaults?: () => void | Promise<void>;
  resetting?: boolean;
};

export function AssistantDefaultModelsForm({
  catalog,
  isLoading,
  draft,
  onDraftChange,
  disabled,
  isCustom,
  onResetToImplicitDefaults,
  resetting = false,
}: AssistantDefaultModelsFormProps) {
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
        No models available. Configure LLM API keys for your deployment before choosing defaults.
      </p>
    );
  }

  return (
    <>
      {!isCustom && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          You are using implicit <strong>Auto</strong> defaults (Optimize: Intelligence). Save below
          to persist custom defaults for new Assistant chats.
        </p>
      )}
      <AssistantModelModeToggle
        mode={draft.mode}
        disabled={disabled}
        onChange={(m) => onDraftChange({ mode: m })}
      />
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 mb-1">
        These defaults apply when you open Assistant Chat or start a branch without a saved model
        config. Per-message overrides in an existing branch are unchanged.
      </p>

      {draft.mode === 'auto' ? (
        <>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 mt-3">
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
            Auto ranks models from your configured API keys using catalog scores (same as the chat
            model picker).
          </p>
        </>
      ) : (
        <>
          <AssistantModelManualSortChips
            sortBy={manualSortBy}
            disabled={disabled}
            onSortByChange={setManualSortBy}
          />
          <div className="space-y-2 mb-1 mt-2">
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
        </>
      )}

      {onResetToImplicitDefaults && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            disabled={disabled || resetting || !isCustom}
            onClick={() => void onResetToImplicitDefaults()}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50"
          >
            {resetting ? 'Resetting…' : 'Reset to implicit defaults'}
          </button>
          {!isCustom && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
              Nothing to reset — no saved default-models override.
            </p>
          )}
        </div>
      )}
    </>
  );
}
