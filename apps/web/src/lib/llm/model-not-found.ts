import type { AIFeature } from '@/lib/llm/config/feature-types';

export type ModelNotFoundDetails = {
  code: 'MODEL_NOT_FOUND';
  feature: AIFeature;
  provider?: string;
  model?: string;
};

const MODEL_NOT_FOUND_RE = /not_found_error|model:\s*([^\s"'}]+)|"type"\s*:\s*"not_found_error"/i;

export function parseModelNotFoundError(
  message: string | null | undefined,
  feature: AIFeature
): ModelNotFoundDetails | null {
  if (!message || !MODEL_NOT_FOUND_RE.test(message)) {
    return null;
  }
  const modelMatch = message.match(/model:\s*([^\s"'}]+)/i);
  const model = modelMatch?.[1]?.trim();
  return {
    code: 'MODEL_NOT_FOUND',
    feature,
    ...(model ? { model } : {}),
  };
}

export function isModelNotFoundMessage(message: string | null | undefined): boolean {
  return Boolean(message && MODEL_NOT_FOUND_RE.test(message));
}
