import { describe, expect, it } from 'vitest';
import { extractAssistantRunConfigForLeaf } from '@/lib/assistant/thread-run-config';
import type { ChatMessage } from '@/types/chatbot';

const manualCfg = {
  mode: 'manual' as const,
  manual: { reasoningModelId: 'r1', responseModelId: 'p1' },
};

describe('extractAssistantRunConfigForLeaf', () => {
  it('reads config from parent user message when leaf is assistant', () => {
    const nodes: ChatMessage[] = [
      {
        id: 'u1',
        threadId: 't',
        role: 'user',
        content: 'hi',
        createdAt: '',
        metadata: { assistantModelConfig: manualCfg },
      },
      {
        id: 'a1',
        threadId: 't',
        role: 'assistant',
        content: 'yo',
        createdAt: '',
        parentId: 'u1',
      },
    ];
    expect(extractAssistantRunConfigForLeaf('a1', nodes)).toEqual(manualCfg);
  });

  it('reads config from user leaf', () => {
    const nodes: ChatMessage[] = [
      {
        id: 'u1',
        threadId: 't',
        role: 'user',
        content: 'hi',
        createdAt: '',
        metadata: { assistantModelConfig: manualCfg },
      },
    ];
    expect(extractAssistantRunConfigForLeaf('u1', nodes)).toEqual(manualCfg);
  });

  it('returns null when metadata missing', () => {
    const nodes: ChatMessage[] = [
      {
        id: 'u1',
        threadId: 't',
        role: 'user',
        content: 'hi',
        createdAt: '',
      },
      {
        id: 'a1',
        threadId: 't',
        role: 'assistant',
        content: 'yo',
        createdAt: '',
        parentId: 'u1',
      },
    ];
    expect(extractAssistantRunConfigForLeaf('a1', nodes)).toBeNull();
  });
});
