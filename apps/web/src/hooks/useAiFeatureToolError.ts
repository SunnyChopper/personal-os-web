import { useCallback, useState } from 'react';
import type { AIFeature } from '@/lib/llm/config/feature-types';
import { parseModelNotFoundError } from '@/lib/llm/model-not-found';
import type { ApiResponse } from '@/types/api-contracts';
import type { LLMResponse } from '@/types/llm';

export function useAiFeatureToolError(feature: AIFeature) {
  const [error, setError] = useState<string | null>(null);
  const [modelNotFound, setModelNotFound] = useState<{ feature: AIFeature; model?: string } | null>(
    null
  );

  const applyResponseError = useCallback(
    (
      response: Pick<LLMResponse<unknown>, 'success' | 'error' | 'errorCode' | 'errorModel'>,
      fallback: string
    ) => {
      if (response.success) {
        setModelNotFound(null);
        setError(null);
        return false;
      }
      if (response.errorCode === 'MODEL_NOT_FOUND') {
        setModelNotFound({
          feature,
          model: response.errorModel,
        });
        setError(null);
        return true;
      }
      setModelNotFound(null);
      setError(response.error || fallback);
      return true;
    },
    [feature]
  );

  const applyApiResponseError = useCallback(
    (response: ApiResponse<unknown>, fallback: string) => {
      if (response.success) {
        setModelNotFound(null);
        setError(null);
        return false;
      }
      const msg = response.error?.message ?? fallback;
      if (response.error?.code === 'MODEL_NOT_FOUND' || parseModelNotFoundError(msg, feature)) {
        const parsed = parseModelNotFoundError(msg, feature);
        setModelNotFound({
          feature,
          model: parsed?.model,
        });
        setError(null);
        return true;
      }
      setModelNotFound(null);
      setError(msg);
      return true;
    },
    [feature]
  );

  const clearErrors = useCallback(() => {
    setError(null);
    setModelNotFound(null);
  }, []);

  return {
    error,
    modelNotFound,
    setError,
    setModelNotFound,
    applyResponseError,
    applyApiResponseError,
    clearErrors,
  };
}
