import { useEffect, useRef } from 'react';
import { formatAssistantRunErrorForDisplay } from '@/lib/chat/assistant-error-display';
import type { WsRunErrorPayload } from '@/types/chatbot';

type ShowToast = (options: {
  type: 'error';
  title: string;
  message: string;
  duration?: number;
}) => string;

export function useAssistantStreamingToasts(
  showToast: ShowToast,
  dismissToast: (id: string) => void,
  streamingError: WsRunErrorPayload | null,
  isAwaitingRunStart: boolean,
  isStreaming: boolean
) {
  const assistantErrorToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!streamingError) {
      return;
    }
    const toastId = showToast({
      type: 'error',
      title: 'Assistant error',
      message: formatAssistantRunErrorForDisplay(streamingError),
      duration: 30_000,
    });
    assistantErrorToastIdRef.current = toastId;
  }, [showToast, streamingError]);

  useEffect(() => {
    if (!(isAwaitingRunStart || isStreaming)) {
      return;
    }
    if (!assistantErrorToastIdRef.current) {
      return;
    }
    dismissToast(assistantErrorToastIdRef.current);
    assistantErrorToastIdRef.current = null;
  }, [dismissToast, isAwaitingRunStart, isStreaming]);
}
