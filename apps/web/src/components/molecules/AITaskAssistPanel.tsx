import { useState } from 'react';
import { Sparkles, Wand2, X, Check, AlertCircle } from 'lucide-react';
import { llmService } from '@/services/llm.service';
import { llmConfig } from '@/lib/llm';
import type { CreateTaskInput, Task } from '@/types/growth-system';
import type {
  ParseTaskOutput,
  TaskBreakdownOutput,
  PriorityAdvisorOutput,
  EffortEstimationOutput,
  TaskCategorizationOutput,
  DependencyDetectionOutput,
} from '@/types/llm';
import Button from '@/components/atoms/Button';
import { nearestTaskStoryPoints } from '@/constants/growth-system';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';

type AssistMode = 'parse' | 'categorize' | 'estimate' | 'priority' | 'breakdown' | 'dependencies';

function effortConfidenceToPercent(c: EffortEstimationOutput['confidence']): number {
  const map = { low: 45, medium: 68, high: 88 } as const;
  return map[c];
}

interface AITaskAssistPanelProps {
  mode: AssistMode;
  onClose: () => void;
  onApplyParsed?: (task: Partial<CreateTaskInput>) => void;
  onApplyCategory?: (area: string, subCategory?: string) => void;
  onApplyEffort?: (size: number) => void;
  onApplyPriority?: (priority: string) => void;
  onApplyBreakdown?: (subtasks: CreateTaskInput[]) => void;
  onApplyDependencies?: (taskIds: string[]) => void;
  currentTask?: Partial<Task>;
  allTasks?: Task[];
  title?: string;
  description?: string;
}

export function AITaskAssistPanel({
  mode,
  onClose,
  onApplyParsed,
  onApplyCategory,
  onApplyEffort,
  onApplyPriority,
  onApplyBreakdown,
  onApplyDependencies,
  currentTask,
  allTasks = [],
  title,
  description,
}: AITaskAssistPanelProps) {
  const [naturalInput, setNaturalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parseResult, setParseResult] = useState<ParseTaskOutput | null>(null);
  const [categoryResult, setCategoryResult] = useState<TaskCategorizationOutput | null>(null);
  const [effortResult, setEffortResult] = useState<EffortEstimationOutput | null>(null);
  const [priorityResult, setPriorityResult] = useState<PriorityAdvisorOutput | null>(null);
  const [breakdownResult, setBreakdownResult] = useState<TaskBreakdownOutput | null>(null);
  const [dependencyResult, setDependencyResult] = useState<DependencyDetectionOutput | null>(null);

  const isConfigured = llmConfig.isConfigured();

  const handleParse = async () => {
    if (!naturalInput.trim()) return;
    setIsLoading(true);
    setError(null);

    const response = await llmService.parseNaturalLanguageTask(naturalInput);

    if (response.success && response.data) {
      setParseResult(response.data);
    } else {
      setError(response.error || 'Failed to parse task');
    }
    setIsLoading(false);
  };

  const handleCategorize = async () => {
    if (!title && !currentTask?.title) return;
    setIsLoading(true);
    setError(null);

    const taskTitle = title || currentTask?.title || '';
    const taskDesc = description || currentTask?.description || undefined;
    const response = await llmService.categorizeTask(taskTitle, taskDesc);

    if (response.success && response.data) {
      setCategoryResult(response.data);
    } else {
      setError(response.error || 'Failed to categorize task');
    }
    setIsLoading(false);
  };

  const handleEstimate = async () => {
    if (!currentTask?.title && !title) return;
    setIsLoading(true);
    setError(null);

    const task = currentTask || { title, description };
    const similarTasks = allTasks.filter((t) => t.status === 'Done' && t.size !== null);
    const response = await llmService.estimateEffort(task as Partial<Task>, similarTasks);

    if (response.success && response.data) {
      setEffortResult(response.data);
    } else {
      setError(response.error || 'Failed to estimate effort');
    }
    setIsLoading(false);
  };

  const handlePriority = async () => {
    if (!currentTask) return;
    setIsLoading(true);
    setError(null);

    const response = await llmService.advisePriority(currentTask as Task, allTasks);

    if (response.success && response.data) {
      setPriorityResult(response.data);
    } else {
      setError(response.error || 'Failed to get priority advice');
    }
    setIsLoading(false);
  };

  const handleBreakdown = async () => {
    if (!currentTask) return;
    setIsLoading(true);
    setError(null);

    const response = await llmService.breakdownTask(currentTask as Task);

    if (response.success && response.data) {
      setBreakdownResult(response.data);
    } else {
      setError(response.error || 'Failed to break down task');
    }
    setIsLoading(false);
  };

  const handleDetectDependencies = async () => {
    if (!currentTask?.title && !title) return;
    setIsLoading(true);
    setError(null);

    const task = currentTask || { title, description };
    const response = await llmService.detectDependencies(task as Partial<Task>, allTasks);

    if (response.success && response.data) {
      setDependencyResult(response.data);
    } else {
      setError(response.error || 'Failed to detect dependencies');
    }
    setIsLoading(false);
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'parse':
        return 'Smart Parse';
      case 'categorize':
        return 'Auto-Categorize';
      case 'estimate':
        return 'Estimate story points';
      case 'priority':
        return 'Priority Advisor';
      case 'breakdown':
        return 'Break Down Task';
      case 'dependencies':
        return 'Find Dependencies';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'parse':
        return 'Describe your task in natural language and AI will structure it for you.';
      case 'categorize':
        return 'AI will suggest the best area and subcategory for this task.';
      case 'estimate':
        return 'AI will suggest Fibonacci story points (1–21) based on similar completed tasks.';
      case 'priority':
        return 'AI will recommend a priority based on your current workload.';
      case 'breakdown':
        return 'AI will break this task into smaller, actionable subtasks.';
      case 'dependencies':
        return 'AI will identify tasks this might depend on.';
    }
  };

  const handleInvoke = () => {
    switch (mode) {
      case 'parse':
        handleParse();
        break;
      case 'categorize':
        handleCategorize();
        break;
      case 'estimate':
        handleEstimate();
        break;
      case 'priority':
        handlePriority();
        break;
      case 'breakdown':
        handleBreakdown();
        break;
      case 'dependencies':
        handleDetectDependencies();
        break;
    }
  };

  if (!isConfigured) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              AI Not Configured
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Go to Settings to configure your LLM connection.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-amber-700 dark:text-amber-300 hover:underline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-gray-900 dark:text-white">{getModeTitle()}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{getModeDescription()}</p>

      {mode === 'parse' && (
        <div className="space-y-3">
          <textarea
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            placeholder="e.g., Schedule a dentist appointment next Friday, high priority health task"
            rows={3}
            className="w-full px-3 py-2 border border-amber-300 dark:border-amber-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Button
            onClick={handleInvoke}
            disabled={isLoading || !naturalInput.trim()}
            variant="primary"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            Parse
          </Button>
        </div>
      )}

      {mode !== 'parse' &&
        !isLoading &&
        !error &&
        !categoryResult &&
        !effortResult &&
        !priorityResult &&
        !breakdownResult &&
        !dependencyResult && (
          <Button
            onClick={handleInvoke}
            variant="primary"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            Analyze
          </Button>
        )}

      {isLoading && (
        <div className="py-4">
          <AIThinkingIndicator message="Analyzing..." />
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {parseResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Parsed Task</span>
            <AIConfidenceIndicator confidence={parseResult.confidence} size="sm" />
          </div>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Title:</strong> {parseResult.task.title}
            </p>
            {parseResult.task.description && (
              <p>
                <strong>Description:</strong> {parseResult.task.description}
              </p>
            )}
            <p>
              <strong>Area:</strong> {parseResult.task.area}
            </p>
            {parseResult.task.subCategory && (
              <p>
                <strong>Category:</strong> {parseResult.task.subCategory}
              </p>
            )}
            <p>
              <strong>Priority:</strong> {parseResult.task.priority}
            </p>
            {parseResult.task.dueDate && (
              <p>
                <strong>Due:</strong> {parseResult.task.dueDate}
              </p>
            )}
            {parseResult.task.size != null && (
              <p>
                <strong>Story points:</strong> {parseResult.task.size}pts
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                onApplyParsed?.(parseResult.task);
                onClose();
              }}
              variant="primary"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Apply
            </Button>
            <Button onClick={() => setParseResult(null)} variant="secondary" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {categoryResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Suggested Category
            </span>
            <AIConfidenceIndicator confidence={categoryResult.confidence} size="sm" />
          </div>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Area:</strong> {categoryResult.area}
            </p>
            {categoryResult.subCategory && (
              <p>
                <strong>Subcategory:</strong> {categoryResult.subCategory}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 italic">{categoryResult.reasoning}</p>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                onApplyCategory?.(categoryResult.area, categoryResult.subCategory);
                onClose();
              }}
              variant="primary"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      )}

      {effortResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Story point estimate
            </span>
            <AIConfidenceIndicator
              confidence={effortConfidenceToPercent(effortResult.confidence)}
              size="sm"
            />
          </div>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Suggested:</strong> {effortResult.storyPoints}pts (Fibonacci)
            </p>
            {effortResult.complexityFactors.length > 0 && (
              <ul className="list-disc list-inside text-gray-500 dark:text-gray-400">
                {effortResult.complexityFactors.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
            {effortResult.assumptions.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span className="font-medium text-gray-600 dark:text-gray-300">Assumptions:</span>{' '}
                {effortResult.assumptions.join(' · ')}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                onApplyEffort?.(nearestTaskStoryPoints(effortResult.storyPoints));
                onClose();
              }}
              variant="primary"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      )}

      {priorityResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Priority Recommendation
            </span>
          </div>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Recommended:</strong> {priorityResult.recommendedPriority}
            </p>
            <p className="text-gray-500 dark:text-gray-400 italic">{priorityResult.reasoning}</p>
            <ul className="list-disc list-inside text-gray-500 dark:text-gray-400">
              {priorityResult.factors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                onApplyPriority?.(priorityResult.recommendedPriority);
                onClose();
              }}
              variant="primary"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      )}

      {breakdownResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Task Breakdown
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="text-gray-500 dark:text-gray-400 italic mb-2">
              {breakdownResult.reasoning}
            </p>
            {breakdownResult.subtasks.map((subtask, i) => (
              <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="font-medium">{subtask.title}</p>
                {subtask.description && (
                  <p className="text-sm text-gray-500">{subtask.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  {(() => {
                    const st = subtask as CreateTaskInput & { storyPoints?: number };
                    const sp = st.storyPoints ?? st.size;
                    return sp != null ? `${sp}pts` : 'Points TBD';
                  })()}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                onApplyBreakdown?.(breakdownResult.subtasks);
                onClose();
              }}
              variant="primary"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Create Subtasks
            </Button>
          </div>
        </div>
      )}

      {dependencyResult && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Suggested Dependencies
            </span>
          </div>
          {dependencyResult.suggestedDependencies.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No dependencies found.</p>
          ) : (
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {dependencyResult.suggestedDependencies.map((dep, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div>
                    <p className="font-medium">{dep.taskTitle}</p>
                    <p className="text-xs text-gray-500">{dep.reason}</p>
                  </div>
                  <AIConfidenceIndicator confidence={dep.confidence} size="sm" />
                </div>
              ))}
            </div>
          )}
          {dependencyResult.suggestedDependencies.length > 0 && (
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => {
                  const ids = dependencyResult.suggestedDependencies.map((d) => d.taskId);
                  onApplyDependencies?.(ids);
                  onClose();
                }}
                variant="primary"
                size="sm"
              >
                <Check className="w-4 h-4 mr-1" />
                Add Dependencies
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
