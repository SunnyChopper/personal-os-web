import type { ILLMAdapter } from '@/types/llm';
import { APILLMAdapter } from './api-llm-adapter';

export class LLMConfig {
  private static instance: LLMConfig;
  private apiAdapter: APILLMAdapter;

  private constructor() {
    this.apiAdapter = new APILLMAdapter();
  }

  static getInstance(): LLMConfig {
    if (!LLMConfig.instance) {
      LLMConfig.instance = new LLMConfig();
    }
    return LLMConfig.instance;
  }

  getAdapter(): ILLMAdapter {
    return this.apiAdapter;
  }

  isConfigured(): boolean {
    // Backend always handles API keys via Secrets Manager
    return true;
  }
}

export const llmConfig = LLMConfig.getInstance();
export const getLLMAdapter = (): ILLMAdapter => llmConfig.getAdapter();
