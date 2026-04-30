import { Edit2 } from 'lucide-react';
import { formatRelativeChatTimestamp } from '@/lib/chat/format-relative-time';
import type { ChatMessage } from '@/types/chatbot';

type ChatUserMessageToolbarProps = {
  message: ChatMessage;
  showRetryAction: boolean;
  onEdit: () => void;
  onRetryClick: () => void;
};

export function ChatUserMessageToolbar({
  message,
  showRetryAction,
  onEdit,
  onRetryClick,
}: ChatUserMessageToolbarProps) {
  return (
    <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
      <div className="flex items-center justify-between gap-3">
        <span>{formatRelativeChatTimestamp(message.createdAt)}</span>
        <div className="hidden md:flex items-center gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            <Edit2 size={12} />
            <span>Edit</span>
          </button>
          {showRetryAction && (
            <button
              type="button"
              onClick={onRetryClick}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
