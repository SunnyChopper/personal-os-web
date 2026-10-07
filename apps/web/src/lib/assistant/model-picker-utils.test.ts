import { describe, expect, it } from 'vitest';
import { isRoutingOrientedCatalogEntry } from '@/lib/assistant/model-picker-utils';
import type { AssistantModelCatalogEntry } from '@/types/chatbot';

function entry(bestFor: string[]): AssistantModelCatalogEntry {
  return {
    id: 'test',
    provider: 'openai',
    apiModelId: 'test',
    label: 'Test',
    supportsReasoningStream: true,
    speedScore: 5,
    costScore: 5,
    qualityScore: 5,
    bestFor,
  };
}

describe('isRoutingOrientedCatalogEntry', () => {
  it('flags routing/highVolume without tool-capable tags', () => {
    expect(isRoutingOrientedCatalogEntry(entry(['routing', 'highVolume']))).toBe(true);
  });

  it('does not flag toolHeavy models', () => {
    expect(isRoutingOrientedCatalogEntry(entry(['fastCoding', 'toolHeavy']))).toBe(false);
  });
});
