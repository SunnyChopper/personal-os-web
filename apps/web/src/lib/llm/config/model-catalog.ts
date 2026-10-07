import type { LLMProvider, ModelInfo } from './provider-types';

/** Feature-level defaults (Aug 2026); assistant chat uses GET /assistant/model-catalog when configured. */
export const PROVIDER_MODELS: Record<LLMProvider, ModelInfo[]> = {
  anthropic: [
    {
      name: 'claude-fable-5',
      displayName: 'Claude Fable 5',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'claude-opus-5',
      displayName: 'Claude Opus 5',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'claude-sonnet-5',
      displayName: 'Claude Sonnet 5',
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
  ],
  openai: [
    {
      name: 'gpt-5.6-sol',
      displayName: 'GPT-5.6 Sol',
      contextLength: 1050000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-5.6-terra',
      displayName: 'GPT-5.6 Terra',
      contextLength: 1050000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-5.6-luna',
      displayName: 'GPT-5.6 Luna',
      contextLength: 1050000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-5.4',
      displayName: 'GPT-5.4',
      contextLength: 272000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-5.4-mini',
      displayName: 'GPT-5.4 Mini',
      contextLength: 400000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-5.4-nano',
      displayName: 'GPT-5.4 Nano',
      contextLength: 400000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'gpt-5.3-codex',
      displayName: 'GPT-5.3 Codex',
      contextLength: 400000,
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
      name: 'gemini-3.1-flash-lite-preview',
      displayName: 'Gemini 3.1 Flash-Lite (preview)',
      contextLength: 1000000,
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
      name: 'groq/compound',
      displayName: 'Groq Compound',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'openai/gpt-oss-120b',
      displayName: 'GPT-OSS 120B',
      contextLength: 131072,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'openai/gpt-oss-20b',
      displayName: 'GPT-OSS 20B',
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
  ],
  grok: [
    {
      name: 'grok-4.5',
      displayName: 'Grok 4.5',
      contextLength: 500000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'grok-4.3',
      displayName: 'Grok 4.3',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'grok-4.20-0309-reasoning',
      displayName: 'Grok 4.20 (reasoning)',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  deepseek: [
    {
      name: 'deepseek-v4-flash',
      displayName: 'DeepSeek V4 Flash',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
    {
      name: 'deepseek-v4-pro',
      displayName: 'DeepSeek V4 Pro',
      contextLength: 1000000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
  ],
  cerebras: [
    {
      name: 'gpt-5.3-codex-spark',
      displayName: 'GPT-5.3 Codex Spark',
      contextLength: 128000,
      supportsStreaming: true,
      supportsStructuredOutput: true,
    },
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
