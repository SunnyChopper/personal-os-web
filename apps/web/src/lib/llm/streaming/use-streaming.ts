import { useState, useRef, useCallback } from 'react';
import { StreamHandler } from './stream-handler';

export interface UseStreamingLLMResult<T> {
  stream: (executor: (handler: StreamHandler<T>) => Promise<void>) => Promise<void>;
  isStreaming: boolean;
  partialResult: Partial<T> | null;
  result: T | null;
  error: Error | null;
  abort: () => void;
  reset: () => void;
}

export function useStreamingLLM<T = string>(): UseStreamingLLMResult<T> {
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialResult, setPartialResult] = useState<Partial<T> | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const handlerRef = useRef<StreamHandler<T> | null>(null);

  const stream = useCallback(async (executor: (handler: StreamHandler<T>) => Promise<void>) => {
    setIsStreaming(true);
    setPartialResult(null);
    setResult(null);
    setError(null);

    const handler = new StreamHandler<T>();
    handlerRef.current = handler;

    handler
      .onToken(() => {})
      .onComplete((finalResult) => {
        setResult(finalResult);
        setIsStreaming(false);
      })
      .onError((err) => {
        setError(err);
        setIsStreaming(false);
      });

    try {
      await executor(handler);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      handler.emitError(error);
    }
  }, []);

  const abort = useCallback(() => {
    if (handlerRef.current) {
      handlerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsStreaming(false);
    setPartialResult(null);
    setResult(null);
    setError(null);
    handlerRef.current = null;
  }, []);

  return {
    stream,
    isStreaming,
    partialResult,
    result,
    error,
    abort,
    reset,
  };
}
