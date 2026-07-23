import {
  loadIdeationEngineAIModelPicker,
  saveIdeationEngineAIModelPicker,
} from '@/lib/personal-branding/ideation-engine-ai-model-picker-storage';
import { usePersistedBrainstormModelPicker } from '@/hooks/knowledge-vault/usePersistedBrainstormModelPicker';

const ideationEnginePickerStorage = {
  load: loadIdeationEngineAIModelPicker,
  save: saveIdeationEngineAIModelPicker,
};

export function useIdeationEngineAIModelPicker() {
  return usePersistedBrainstormModelPicker(ideationEnginePickerStorage);
}
