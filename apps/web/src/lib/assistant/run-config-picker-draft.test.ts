import { describe, expect, it } from 'vitest';
import {
  defaultModelsFromDraft,
  draftFromDefaultModels,
  modelPickerDraftFromRunConfig,
  runConfigFromModelPickerDraft,
  type ModelPickerDraft,
} from '@/lib/assistant/run-config-picker-draft';
import type { AssistantDefaultModelsConfig } from '@/types/api-contracts';
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

  it('draftFromDefaultModels uses manual saved ids', () => {
    const cfg: AssistantDefaultModelsConfig = {
      mode: 'manual',
      manual: { reasoningModelId: 'openai:a', responseModelId: 'openai:b' },
    };
    const draft = draftFromDefaultModels(cfg, catalog);
    expect(draft).toMatchObject({
      mode: 'manual',
      reasoningModelId: 'openai:a',
      responseModelId: 'openai:b',
      compactionMode: 'auto',
    });
  });

  it('draftFromDefaultModels uses auto optimizeFor with catalog ids for manual tab display', () => {
    const cfg: AssistantDefaultModelsConfig = {
      mode: 'auto',
      auto: { optimizeFor: 'cost' },
    };
    const draft = draftFromDefaultModels(cfg, catalog);
    expect(draft).toMatchObject({
      mode: 'auto',
      optimizeFor: 'cost',
      reasoningModelId: 'openai:a',
      responseModelId: 'openai:b',
    });
  });

  it('draftFromDefaultModels falls back to auto intelligence when cfg is null', () => {
    const draft = draftFromDefaultModels(null, catalog);
    expect(draft).toMatchObject({
      mode: 'auto',
      optimizeFor: 'intelligence',
      reasoningModelId: 'openai:a',
      responseModelId: 'openai:b',
    });
  });

  it('defaultModelsFromDraft round-trips manual mode without compaction', () => {
    const draft: ModelPickerDraft = {
      mode: 'manual',
      reasoningModelId: 'openai:a',
      responseModelId: 'openai:b',
      optimizeFor: 'intelligence',
      compactionMode: 'manual',
    };
    const cfg = defaultModelsFromDraft(draft, catalog);
    expect(cfg).toEqual({
      mode: 'manual',
      manual: { reasoningModelId: 'openai:a', responseModelId: 'openai:b' },
    });
    const again = draftFromDefaultModels(cfg, catalog);
    expect(again.mode).toBe('manual');
    expect(again.reasoningModelId).toBe('openai:a');
  });

  it('defaultModelsFromDraft round-trips auto mode without compaction', () => {
    const draft: ModelPickerDraft = {
      mode: 'auto',
      reasoningModelId: '',
      responseModelId: '',
      optimizeFor: 'balanced',
      compactionMode: 'auto',
    };
    const cfg = defaultModelsFromDraft(draft, catalog);
    expect(cfg).toEqual({
      mode: 'auto',
      auto: { optimizeFor: 'balanced' },
    });
  });
});
