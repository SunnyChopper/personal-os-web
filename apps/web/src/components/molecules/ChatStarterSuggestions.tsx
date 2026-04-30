import { BarChart3, CheckSquare, Sparkles, Target } from 'lucide-react';

type ChatStarterSuggestionsProps = {
  onPickPrompt: (text: string) => void;
};

export function ChatStarterSuggestions({ onPickPrompt }: ChatStarterSuggestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Sparkles className="text-blue-600 dark:text-blue-400 mb-4" size={48} />
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start a conversation</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Ask me about your tasks, goals, metrics, or habits. I can help you create items, track
        progress, and understand how everything connects.
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-2xl">
        <button
          type="button"
          onClick={() => onPickPrompt('Show me my active goals')}
          className="p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition text-left"
        >
          <Target size={20} className="text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">View Goals</p>
        </button>
        <button
          type="button"
          onClick={() => onPickPrompt('Create a new task')}
          className="p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition text-left"
        >
          <CheckSquare size={20} className="text-green-600 dark:text-green-400 mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add Task</p>
        </button>
        <button
          type="button"
          onClick={() => onPickPrompt('Show my performance metrics')}
          className="p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition text-left"
        >
          <BarChart3 size={20} className="text-purple-600 dark:text-purple-400 mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">View Metrics</p>
        </button>
      </div>
    </div>
  );
}
