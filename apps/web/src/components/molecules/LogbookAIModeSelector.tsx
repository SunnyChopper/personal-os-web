import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

type AIMode = 'prompts' | 'digest' | 'patterns' | 'sentiment' | 'review' | 'connections';

interface LogbookAIModeSelectorProps {
  isExpanded: boolean;
  currentMode: AIMode;
  onToggle: () => void;
  onModeChange: (mode: AIMode) => void;
}

const AI_MODES: { value: AIMode; label: string }[] = [
  { value: 'prompts', label: 'Reflection Prompts' },
  { value: 'digest', label: 'Daily Digest' },
  { value: 'patterns', label: 'Pattern Insights' },
  { value: 'sentiment', label: 'Sentiment Analysis' },
  { value: 'review', label: 'Weekly Review' },
  { value: 'connections', label: 'Connection Suggestions' },
];

export function LogbookAIModeSelector({
  isExpanded,
  currentMode,
  onToggle,
  onModeChange,
}: LogbookAIModeSelectorProps) {
  return (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
      >
        <Sparkles size={18} />
        <span>AI Logbook Tools</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {AI_MODES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onModeChange(value)}
                className={`px-3 py-1.5 text-sm rounded-full transition ${
                  currentMode === value
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
