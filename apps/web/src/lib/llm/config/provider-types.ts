export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'grok'
  | 'deepseek'
  | 'groq'
  | 'cerebras';

export interface ProviderConfig {
  apiKey: string;
  model: string;
}

export interface ModelInfo {
  name: string;
  displayName: string;
  contextLength: number;
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
}

export const PROVIDER_ENDPOINTS: Record<LLMProvider, string> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com',
  groq: 'https://api.groq.com/openai/v1',
  grok: 'https://api.x.ai/v1',
  deepseek: 'https://api.deepseek.com',
  cerebras: 'https://api.cerebras.ai/v1',
};

export const PROVIDER_DISPLAY_NAMES: Record<LLMProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  gemini: 'Google (Gemini)',
  groq: 'Groq',
  grok: 'xAI (Grok)',
  deepseek: 'DeepSeek',
  cerebras: 'Cerebras',
};
