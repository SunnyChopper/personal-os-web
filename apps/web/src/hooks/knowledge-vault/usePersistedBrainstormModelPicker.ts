import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  brainstormValueToApiModelField,
  type BrainstormModelPickerValue,
} from '@/lib/assistant/brainstorm-model-picker';
import { queryKeys } from '@/lib/react-query/query-keys';
import { chatbotService } from '@/services/chatbot.service';

const DEFAULT_PICKER: BrainstormModelPickerValue = {
  mode: 'auto',
  manualCatalogModelId: '',
};

export function usePersistedBrainstormModelPicker(
  storage: {
    load: () => BrainstormModelPickerValue | null;
    save: (value: BrainstormModelPickerValue) => void;
  },
  options?: { enabled?: boolean }
) {
  const catalogQuery = useQuery({
    queryKey: queryKeys.chatbot.modelCatalog(),
    queryFn: () => chatbotService.getAssistantModelCatalog(),
    enabled: options?.enabled ?? true,
  });

  const [picker, setPicker] = useState<BrainstormModelPickerValue>(
    () => storage.load() ?? DEFAULT_PICKER
  );

  useEffect(() => {
    storage.save(picker);
  }, [picker, storage]);

  useEffect(() => {
    const catalog = catalogQuery.data;
    if (!catalog?.models.length) return;
    const ids = new Set(catalog.models.map((m) => m.id));
    if (
      picker.mode === 'manual' &&
      picker.manualCatalogModelId &&
      !ids.has(picker.manualCatalogModelId)
    ) {
      setPicker({
        mode: 'manual',
        manualCatalogModelId:
          catalog.defaults.defaultReasoningModelId || catalog.models[0]?.id || '',
      });
    }
  }, [catalogQuery.data, picker.manualCatalogModelId, picker.mode]);

  const resolveApiModel = useCallback(() => brainstormValueToApiModelField(picker), [picker]);

  return {
    catalog: catalogQuery.data ?? null,
    isCatalogLoading: catalogQuery.isLoading,
    picker,
    setPicker,
    resolveApiModel,
  };
}
