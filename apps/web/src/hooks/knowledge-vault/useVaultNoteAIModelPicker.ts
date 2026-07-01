import {
  loadVaultNoteAIModelPicker,
  saveVaultNoteAIModelPicker,
} from '@/lib/knowledge-vault/vault-note-ai-model-picker-storage';
import { usePersistedBrainstormModelPicker } from '@/hooks/knowledge-vault/usePersistedBrainstormModelPicker';

const vaultNotePickerStorage = {
  load: loadVaultNoteAIModelPicker,
  save: saveVaultNoteAIModelPicker,
};

export function useVaultNoteAIModelPicker() {
  return usePersistedBrainstormModelPicker(vaultNotePickerStorage);
}
