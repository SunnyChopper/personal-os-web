import type { LLMProvider, ModelInfo } from './provider-types';

/** Feature-level defaults (Apr 2026); assistant chat uses GET /assistant/model-catalog when configured. */
export const PROVIDER_MODELS: Record<LLMProvider, ModelInfo[]> = {
  anthropic: [
    {
      name: 'claude-opus-4-6',
      displayName: 'Claude Opus 4.6',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'claude-sonnet-4-6',
      displayName: 'Claude Sonnet 4.6',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'claude-haiku-4-5',
      displayName: 'Claude Haiku 4.5',
      contextLength: 200000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'claude-3-5-sonnet-20241022',
      displayName: 'Claude 3.5 Sonnet',
      contextLength: 200000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'claude-3-5-haiku-20241022',
      displayName: 'Claude 3.5 Haiku',
      contextLength: 200000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  openai: [
    {
      name: 'gpt-5.4',
      displayName: 'GPT-5.4',
      contextLength: 272000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-5-mini',
      displayName: 'GPT-5 Mini',
      contextLength: 400000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-4.1',
      displayName: 'GPT-4.1',
      contextLength: 1050000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-4o',
      displayName: 'GPT-4o',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'o4-mini',
      displayName: 'o4-mini',
      contextLength: 200000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  gemini: [
    {
      name: 'gemini-3.1-pro-preview',
      displayName: 'Gemini 3.1 Pro (preview)',
      contextLength: 200000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gemini-3-flash-preview',
      displayName: 'Gemini 3 Flash (preview)',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      contextLength: 2000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gemini-2.5-flash-lite',
      displayName: 'Gemini 2.5 Flash-Lite',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  groq: [
    {
      name: 'openai/gpt-oss-120b',
      displayName: 'GPT-OSS 120B',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'openai/gpt-oss-20b',
      displayName: 'GPT-OSS 20B',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'meta-llama/llama-4-scout-17b-16e-instruct',
      displayName: 'Llama 4 Scout',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'llama-3.3-70b-versatile',
      displayName: 'Llama 3.3 70B',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'llama-3.1-8b-instant',
      displayName: 'Llama 3.1 8B Instant',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'qwen/qwen3-32b',
      displayName: 'Qwen3 32B',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  grok: [
    {
      name: 'grok-4.20-reasoning',
      displayName: 'Grok 4.20 (reasoning)',
      contextLength: 2000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'grok-4-1-fast',
      displayName: 'Grok 4.1 Fast',
      contextLength: 2000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'grok-3-mini',
      displayName: 'Grok 3 Mini',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  deepseek: [
    {
      name: 'deepseek-chat',
      displayName: 'DeepSeek V3.2 Chat',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'deepseek-reasoner',
      displayName: 'DeepSeek R1',
      contextLength: 64000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  cerebras: [
    {
      name: 'llama-3.1-8b',
      displayName: 'Llama 3.1 8B',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'llama-3.3-70b',
      displayName: 'Llama 3.3 70B',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-oss-120b',
      displayName: 'GPT-OSS 120B',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
};

export function getModelsForProvider(provider: LLMProvider): ModelInfo[] {
  return PROVIDER_MODELS[provider] || [];
}

export function getDefaultModel(provider: LLMProvider): string {
  const models = PROVIDER_MODELS[provider];
  return models.length > 0 ? models[0].name : '';
}

export function getModelInfo(provider: LLMProvider, modelName: string): ModelInfo | undefined {
  return PROVIDER_MODELS[provider]?.find((m) => m.name === modelName);
}
