import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Globe, Loader2, Send, StopCircle } from 'lucide-react';
import type { AssistantWsConnectionState } from '@/lib/websocket/assistant-ws-client';

/** Max textarea height (px); beyond this, content scrolls inside the field. */
const COMPOSER_TEXTAREA_MAX_HEIGHT_PX = 200;

export type ChatComposerHandle = {
  /** Programmatically set the input value (e.g. from starter suggestions). */
  setValue: (value: string) => void;
  /** Clear the input after a successful send. */
  clear: () => void;
};

type ChatComposerProps = {
  /** Called when the user submits; receives the trimmed message value. */
  onSend: (value: string) => void;
  isInputDisabled: boolean;
  isLocalDraft: boolean;
  connectionState: AssistantWsConnectionState;
  showReconnectingBanner: boolean;
  showDisconnectedBanner: boolean;
  onReconnect: () => void;
  isStreaming: boolean;
  activeRunId: string | null;
  onCancelRun: (runId: string) => void;
  /** When set, shows an always-visible web search strip above the field (assistant chat). */
  webSearchEnabled?: boolean;
  onWebSearchToggle?: () => void;
};

export const ChatComposer = memo(
  forwardRef<ChatComposerHandle, ChatComposerProps>(function ChatComposer(
    {
      onSend,
      isInputDisabled,
      isLocalDraft,
      connectionState,
      showReconnectingBanner,
      showDisconnectedBanner,
      onReconnect,
      isStreaming,
      activeRunId,
      onCancelRun,
      webSearchEnabled = false,
      onWebSearchToggle,
    },
    ref
  ) {
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        setValue: (value) => setInputValue(value),
        clear: () => setInputValue(''),
      }),
      []
    );

    const syncTextareaHeight = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const next = Math.min(el.scrollHeight, COMPOSER_TEXTAREA_MAX_HEIGHT_PX);
      el.style.height = `${next}px`;
    }, []);

    useLayoutEffect(() => {
      syncTextareaHeight();
    }, [inputValue, syncTextareaHeight]);

    const handleSend = useCallback(() => {
      const trimmed = inputValue.trim();
      if (!trimmed || isInputDisabled || isStreaming) return;
      onSend(trimmed);
    }, [inputValue, isInputDisabled, isStreaming, onSend]);

    return (
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
        {showReconnectingBanner && (
          <div className="mb-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            <span>Reconnecting to server...</span>
          </div>
        )}
        {!isLocalDraft && connectionState === 'failed' && (
          <div className="mb-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-800 dark:text-red-200 flex items-center justify-between gap-3">
            <span>Connection lost. Unable to reach the server.</span>
            <button
              type="button"
              onClick={onReconnect}
              className="text-sm underline underline-offset-2 hover:text-red-900 dark:hover:text-red-100"
            >
              Reconnect
            </button>
          </div>
        )}
        {showDisconnectedBanner && (
          <div className="mb-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
            Disconnected from assistant service.
          </div>
        )}
        <div className="flex items-end gap-1.5 sm:gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isStreaming) return;
                handleSend();
              }
            }}
            rows={1}
            placeholder="Ask about your tasks, goals, metrics..."
            aria-label="Message"
            style={{ maxHeight: COMPOSER_TEXTAREA_MAX_HEIGHT_PX }}
            className="flex-1 min-h-[44px] min-w-0 px-3 py-2.5 sm:min-h-[48px] sm:px-4 sm:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-y-auto text-[15px] sm:text-base leading-normal"
            disabled={isInputDisabled}
          />
          {onWebSearchToggle ? (
            <button
              type="button"
              role="switch"
              aria-checked={webSearchEnabled}
              onClick={onWebSearchToggle}
              title={
                webSearchEnabled
                  ? 'Web search on for your next message — click to turn off (assistant still chooses whether to call it)'
                  : 'Turn on web search for your next message — adds the web_search tool; assistant decides if it is needed'
              }
              className={`shrink-0 flex h-11 w-[3.25rem] sm:h-12 sm:w-14 flex-col items-center justify-center gap-0 rounded-lg border px-1 text-[10px] font-bold leading-none transition ${
                webSearchEnabled
                  ? 'border-sky-500 bg-sky-600 text-white dark:border-sky-400 dark:bg-sky-600'
                  : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Globe size={16} className="shrink-0 opacity-90" aria-hidden />
              <span className="mt-px">{webSearchEnabled ? 'On' : 'Off'}</span>
            </button>
          ) : null}
          {isStreaming ? (
            <button
              type="button"
              disabled={!activeRunId}
              onClick={() => activeRunId && onCancelRun(activeRunId)}
              aria-label="Stop generating"
              title={activeRunId ? 'Stop generating' : 'Stop unavailable'}
              className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-lg transition"
            >
              <StopCircle size={20} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isInputDisabled}
              aria-label="Send message"
              className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition"
            >
              <Send size={20} aria-hidden />
            </button>
          )}
        </div>
      </div>
    );
  })
);

ChatComposer.displayName = 'ChatComposer';
