import { Check, Edit2, Loader2, MessageCircle, Plus, Trash2, X } from 'lucide-react';
import { formatRelativeChatTimestamp } from '@/lib/chat/format-relative-time';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import type { ChatThread } from '@/types/chatbot';

function titleStartsWithEmoji(title: string): boolean {
  return /^[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(title.trimStart());
}

export type ChatThreadListProps = {
  onCreateThread: () => void;
  isThreadsLoading: boolean;
  isThreadsError: boolean;
  threadsError: unknown;
  onRefetchThreads: () => void;
  displayThreads: ChatThread[];
  resolvedThreadId: string | null;
  editingThreadId: string | null;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
  onStartEdit: (threadId: string, title: string) => void;
  onCancelEdit: () => void;
  onConfirmRename: (threadId: string) => void;
  isUpdating: boolean;
  onDeleteThread: (id: string) => void;
  onSelectThread: (threadId: string) => void;
};

export function ChatThreadList({
  onCreateThread,
  isThreadsLoading,
  isThreadsError,
  threadsError,
  onRefetchThreads,
  displayThreads,
  resolvedThreadId,
  editingThreadId,
  editingTitle,
  onEditingTitleChange,
  onStartEdit,
  onCancelEdit,
  onConfirmRename,
  isUpdating,
  onDeleteThread,
  onSelectThread,
}: ChatThreadListProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-2 py-2 sm:px-3 sm:py-2.5">
        <button
          type="button"
          onClick={onCreateThread}
          className="flex w-full touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:gap-2 sm:py-2.5"
        >
          <Plus size={17} className="shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden />
          <span>New</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 max-lg:px-3 max-lg:pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] max-lg:pl-[max(0.375rem,env(safe-area-inset-left,0px))] max-lg:pr-[max(0.5rem,env(safe-area-inset-right,0px))] lg:px-2 lg:py-1.5">
        {isThreadsLoading && (
          <div className="flex items-center gap-2 px-2 py-4 text-sm text-gray-500 dark:text-gray-400 sm:px-2.5 sm:py-5">
            <Loader2 size={16} className="shrink-0 animate-spin" />
            <span>Loading chats...</span>
          </div>
        )}
        {isThreadsError && (
          <div className="mx-0.5 space-y-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 sm:px-3 sm:py-2.5">
            <div>{extractErrorMessage(threadsError, 'Failed to load chats')}</div>
            <button
              type="button"
              onClick={() => onRefetchThreads()}
              className="text-xs underline underline-offset-2 hover:text-red-800 dark:hover:text-red-100"
            >
              Retry
            </button>
          </div>
        )}
        {!isThreadsLoading && !isThreadsError && displayThreads.length === 0 && (
          <div className="px-2 py-5 text-sm text-gray-500 dark:text-gray-400 sm:px-2.5 sm:py-6">
            No chats yet. Create one to get started.
          </div>
        )}
        {!isThreadsLoading &&
          !isThreadsError &&
          displayThreads.map((thread) => {
            const isActive = resolvedThreadId === thread.id;
            const isLocalThread = isLocalAssistantThreadId(thread.id);
            const hasLeadingEmoji = titleStartsWithEmoji(thread.title);
            const actionBtnMobile =
              'inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-md text-gray-600 transition active:scale-[0.97] hover:bg-gray-200/90 dark:text-gray-300 dark:hover:bg-gray-600/90';
            const actionBtnMobileDanger =
              'inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-md text-red-600 transition active:scale-[0.97] hover:bg-red-100/90 dark:text-red-400 dark:hover:bg-red-900/35';
            const actionBtnDesktop =
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-600 transition hover:bg-gray-200/80 dark:text-gray-300 dark:hover:bg-gray-600/80';
            const actionBtnDesktopDanger =
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-red-600 transition hover:bg-red-100/80 dark:text-red-400 dark:hover:bg-red-900/35';

            return (
              <div
                key={thread.id}
                className={`group mb-0.5 cursor-pointer rounded-md transition touch-manipulation last:mb-0 ${
                  isActive
                    ? 'border border-blue-200 bg-blue-50 active:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:active:bg-blue-900/45'
                    : 'border border-transparent hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600'
                }`}
                onClick={() => onSelectThread(thread.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectThread(thread.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {editingThreadId === thread.id ? (
                  <div
                    className="flex items-center gap-1 px-1.5 py-1.5 sm:gap-1.5 sm:px-2 sm:py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => onEditingTitleChange(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') onConfirmRename(thread.id);
                        if (e.key === 'Escape') onCancelEdit();
                      }}
                      disabled={isUpdating}
                      className="min-w-0 flex-1 rounded border border-blue-400 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-blue-500 dark:bg-gray-700"
                      autoFocus
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onConfirmRename(thread.id)}
                      disabled={isUpdating}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-green-600 hover:bg-green-100 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/30 lg:h-7 lg:w-7"
                      aria-label="Confirm rename"
                    >
                      {isUpdating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={onCancelEdit}
                      disabled={isUpdating}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-600 lg:h-7 lg:w-7"
                      aria-label="Cancel rename"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-start gap-1.5 px-1.5 py-1.5 sm:gap-2 sm:px-2 sm:py-2">
                    {!hasLeadingEmoji && (
                      <MessageCircle
                        size={13}
                        className="mt-0.5 shrink-0 text-gray-400 sm:h-[14px] sm:w-[14px]"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-0">
                      <div className="min-w-0 pr-0 lg:pr-10">
                        <span className="block truncate text-[13px] font-medium leading-snug text-gray-900 dark:text-gray-100 sm:text-sm">
                          {thread.title}
                        </span>
                      </div>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-xs tabular-nums leading-snug text-gray-500 dark:text-gray-400 max-lg:font-medium lg:text-[11px] lg:font-normal">
                          {formatRelativeChatTimestamp(thread.updatedAt || thread.createdAt)}
                        </p>
                        {thread.automationOriginated ? (
                          <span
                            className="inline-flex shrink-0 items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-violet-100 text-violet-900 dark:bg-violet-900/45 dark:text-violet-100 sm:px-1.5 sm:text-[10px]"
                            title="Created by a scheduled automation"
                          >
                            Auto
                          </span>
                        ) : null}
                      </div>
                      {/* Mobile / tablet: actions on their own row — full title width, no hover required */}
                      <div
                        className="mt-1 flex justify-end gap-0.5 lg:hidden"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {!isLocalThread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartEdit(thread.id, thread.title);
                            }}
                            className={actionBtnMobile}
                            aria-label="Rename chat"
                          >
                            <Edit2 size={15} className="shrink-0" aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className={actionBtnMobileDanger}
                          aria-label="Delete chat"
                        >
                          <Trash2 size={15} className="shrink-0" aria-hidden />
                        </button>
                      </div>
                    </div>
                    {/* Desktop: float over the row so inactive state does not reserve a wide column */}
                    <div
                      className="pointer-events-none absolute right-1.5 top-1.5 z-10 hidden items-center gap-0 rounded-md border border-gray-200/90 bg-white/95 px-0.5 py-0.5 opacity-0 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-opacity duration-150 dark:border-gray-600 dark:bg-gray-900/95 dark:ring-white/10 lg:flex lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:group-focus-within:pointer-events-auto lg:group-focus-within:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {!isLocalThread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartEdit(thread.id, thread.title);
                          }}
                          className={actionBtnDesktop}
                          aria-label="Rename chat"
                        >
                          <Edit2 size={13} className="shrink-0" aria-hidden />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        className={actionBtnDesktopDanger}
                        aria-label="Delete chat"
                      >
                        <Trash2 size={13} className="shrink-0" aria-hidden />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
