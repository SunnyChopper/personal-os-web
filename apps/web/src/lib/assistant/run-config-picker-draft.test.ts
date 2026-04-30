import { describe, expect, it } from 'vitest';
import {
  modelPickerDraftFromRunConfig,
  runConfigFromModelPickerDraft,
  type ModelPickerDraft,
} from '@/lib/assistant/run-config-picker-draft';
import type { AssistantModelCatalogData, AssistantRunConfig } from '@/types/chatbot';

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

describe('run-config-picker-draft', () => {
  it('runConfigFromModelPickerDraft includes compactionMode manual', () => {
    const draft: ModelPickerDraft = {
      mode: 'manual',
      reasoningModelId: 'openai:a',
      responseModelId: 'openai:b',
      optimizeFor: 'intelligence',
      compactionMode: 'manual',
    };
    const cfg = runConfigFromModelPickerDraft(draft, catalog);
    expect(cfg).toMatchObject({
      mode: 'manual',
      compactionMode: 'manual',
      manual: { reasoningModelId: 'openai:a', responseModelId: 'openai:b' },
    });
  });

  it('runConfigFromModelPickerDraft includes compactionMode auto', () => {
    const draft: ModelPickerDraft = {
      mode: 'auto',
      reasoningModelId: '',
      responseModelId: '',
      optimizeFor: 'cost',
      compactionMode: 'auto',
    };
    const cfg = runConfigFromModelPickerDraft(draft, catalog);
    expect(cfg).toMatchObject({
      mode: 'auto',
      compactionMode: 'auto',
      auto: { optimizeFor: 'cost' },
    });
  });

  it('modelPickerDraftFromRunConfig round-trips compactionMode', () => {
    const original: AssistantRunConfig = {
      mode: 'auto',
      auto: { optimizeFor: 'balanced' },
      compactionMode: 'manual',
    };
    const draft = modelPickerDraftFromRunConfig(original, catalog);
    expect(draft.compactionMode).toBe('manual');
    const again = runConfigFromModelPickerDraft(draft, catalog);
    expect(again?.compactionMode).toBe('manual');
  });
});
