import { getFeatureConfig } from '@/lib/llm/config/feature-config-store';
import type { AIFeature } from '@/lib/llm/config/feature-types';
import { parseModelNotFoundError } from '@/lib/llm/model-not-found';
import type { ApiResponse } from '@/types/api-contracts';

export async function withFeatureLlm<T extends Record<string, unknown>>(
  feature: AIFeature,
  body: T
): Promise<T & { provider: string; model: string }> {
  const cfg = await getFeatureConfig(feature);
  return { ...body, provider: cfg.provider, model: cfg.model };
}

export function apiFailure<T>(
  feature: AIFeature,
  message: string,
  fallbackCode: string
): ApiResponse<T> {
  const parsed = parseModelNotFoundError(message, feature);
  return {
    success: false,
    data: undefined,
    error: {
      message: message || 'Request failed',
      code: parsed ? 'MODEL_NOT_FOUND' : fallbackCode,
    },
  };
}

export function isApiModelNotFound(response: ApiResponse<unknown>): boolean {
  return response.error?.code === 'MODEL_NOT_FOUND';
}
