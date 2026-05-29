import { describe, expect, it } from 'vitest';
import { draftFromDefaultModels } from '@/lib/assistant/run-config-picker-draft';
import type { AssistantDefaultModelsConfig } from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';

const catalog: AssistantModelCatalogData = {
  providersConfigured: { openai: true },
  models: [
    {
      id: 'openai:a',
      provider: 'openai',
      apiModelId: 'a',
      label: 'A',
      supportsReasoningStream: true,
      speedScore: 1,
      costScore: 1,
      qualityScore: 1,
    },
    {
      id: 'openai:b',
      provider: 'openai',
      apiModelId: 'b',
      label: 'B',
      supportsReasoningStream: false,
      speedScore: 1,
      costScore: 1,
      qualityScore: 1,
    },
  ],
  defaults: { defaultReasoningModelId: 'openai:a', defaultResponseModelId: 'openai:b' },
};

describe('useAssistantChatPage default-models seeding contract', () => {
  it('seeds new chats from saved defaultModels instead of localStorage legacy keys', () => {
    const savedDefaultModels: AssistantDefaultModelsConfig = {
      mode: 'manual',
      manual: { reasoningModelId: 'openai:b', responseModelId: 'openai:a' },
    };
    const draft = draftFromDefaultModels(savedDefaultModels, catalog);

    expect(draft.mode).toBe('manual');
    expect(draft.reasoningModelId).toBe('openai:b');
    expect(draft.responseModelId).toBe('openai:a');

    const legacyLocalStorageKey = 'assistant-model-picker:test-user';
    expect(localStorage.getItem(legacyLocalStorageKey)).toBeNull();
  });
});
