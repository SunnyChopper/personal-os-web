import { useMemo, useState } from 'react';
import type { AssistantModelCatalogData } from '@/types/chatbot';
import { ManualModelListbox } from '@/components/assistant/ManualModelListbox';
import { sortAssistantModels, type ManualModelSortKey } from '@/lib/assistant/model-picker-utils';
import {
  AssistantModelManualSortChips,
  AssistantModelModeToggle,
} from '@/components/assistant/AssistantModelPickerPrimitives';
import type { BrainstormModelPickerValue } from '@/lib/assistant/brainstorm-model-picker';

type BrainstormModelPickerProps = {
  catalog: AssistantModelCatalogData | null;
  isLoading: boolean;
  value: BrainstormModelPickerValue;
  onChange: (next: BrainstormModelPickerValue) => void;
  disabled?: boolean;
  /** Override the hint shown when mode is ``auto``. */
  autoModeDescription?: string;
};

export function BrainstormModelPicker({
  catalog,
  isLoading,
  value,
  onChange,
  disabled,
  autoModeDescription,
}: BrainstormModelPickerProps) {
  const [manualSortBy, setManualSortBy] = useState<ManualModelSortKey>('default');

  const sortedModels = useMemo(
    () => (catalog ? sortAssistantModels(catalog.models, manualSortBy) : []),
    [catalog, manualSortBy]
  );

  if (isLoading || !catalog) {
    return (
      <div className="w-full min-w-0 text-left">
        <p className="text-sm text-gray-600 dark:text-gray-400 py-2">Loading models…</p>
      </div>
    );
  }

  if (catalog.models.length === 0) {
    return (
      <div className="w-full min-w-0 text-left">
        <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
          No models available. Configure LLM API keys for your deployment.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 text-left">
      <AssistantModelModeToggle
        mode={value.mode}
        disabled={disabled}
        onChange={(mode) => {
          if (mode === 'auto') {
            onChange({ mode: 'auto', manualCatalogModelId: value.manualCatalogModelId });
          } else {
            const fallback =
              catalog.defaults.defaultReasoningModelId || catalog.models[0]?.id || '';
            onChange({
              mode: 'manual',
              manualCatalogModelId: value.manualCatalogModelId || fallback,
            });
          }
        }}
      />
      {value.mode === 'auto' ? (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          {autoModeDescription ??
            'Uses the deployment default brainstorm model (OpenAI gpt-5.4-mini unless overridden server-side). Same catalog rankings as chat when you switch to manual.'}
        </p>
      ) : (
        <>
          <AssistantModelManualSortChips
            sortBy={manualSortBy}
            disabled={disabled}
            onSortByChange={setManualSortBy}
          />
          <ManualModelListbox
            label="Model"
            models={sortedModels}
            value={value.manualCatalogModelId}
            disabled={disabled}
            onChange={(id) => onChange({ mode: 'manual', manualCatalogModelId: id })}
          />
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
            Full catalog details match the assistant chat picker (scores, benchmarks, capabilities).
          </p>
        </>
      )}
    </div>
  );
}
