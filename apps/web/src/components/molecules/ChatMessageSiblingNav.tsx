import { ArrowLeft, ArrowRight } from 'lucide-react';

type ChatMessageSiblingNavProps = {
  messageId: string;
  siblings: string[];
  currentIndex: number;
  onSelectSibling: (messageId: string, direction: 'prev' | 'next') => void;
};

export function ChatMessageSiblingNav({
  messageId,
  siblings,
  currentIndex,
  onSelectSibling,
}: ChatMessageSiblingNavProps) {
  if (siblings.length <= 1 || currentIndex < 0) {
    return null;
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectSibling(messageId, 'prev')}
          disabled={currentIndex <= 0}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={12} />
        </button>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {currentIndex + 1} / {siblings.length}
        </span>
        <button
          type="button"
          onClick={() => onSelectSibling(messageId, 'next')}
          disabled={currentIndex >= siblings.length - 1}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
