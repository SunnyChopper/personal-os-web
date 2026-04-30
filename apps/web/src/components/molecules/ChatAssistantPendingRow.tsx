import { Loader2, Sparkles } from 'lucide-react';

export type ChatAssistantPendingPhase = 'sending' | 'planning';

type ChatAssistantPendingRowProps = {
  /** One visual treatment from send through run start (avoids empty gap between phases). */
  phase: ChatAssistantPendingPhase;
};

export function ChatAssistantPendingRow({ phase }: ChatAssistantPendingRowProps) {
  const label = phase === 'sending' ? 'Sending…' : 'Planning response';
  return (
    <div className="flex gap-3 justify-start mt-2">
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
        <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 max-w-[80%] rounded-lg border border-gray-200/80 bg-white/50 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-800/30 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
    </div>
  );
}
