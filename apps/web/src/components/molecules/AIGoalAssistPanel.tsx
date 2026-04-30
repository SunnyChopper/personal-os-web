import { useState } from 'react';
import {
  Sparkles,
  Wand2,
  X,
  Check,
  AlertCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  Heart,
  GitBranch,
  MessageCircle,
} from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import type { Goal, GoalProgressBreakdown, Task } from '@/types/growth-system';
import type { ApiError } from '@/types/api-contracts';
import type {
  ProgressCoachingOutput,
  GoalHealthScoreOutput,
  GoalDecompositionOutput,
  ConflictDetectionOutput,
} from '@/lib/llm/schemas/goal-ai-schemas';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';
import { goalAIService } from '@/services/growth-system/goal-ai.service';

type AssistMode =
  | 'refine'
  | 'criteria'
  | 'metrics'
  | 'cascade'
  | 'forecast'
  | 'conflicts'
  | 'progress'
  | 'coaching'
  | 'health'
  | 'decompose';

interface RefineResult {
  refinedTitle: string;
  refinedDescription: string;
  reasoning: string;
  confidence: number;
  suggestedAdjustments: string[];
}

interface CriteriaResult {
  criteria: Array<{
    criterion: string;
    measurable: boolean;
    suggestedMetric?: string;
  }>;
  reasoning: string;
  confidence: number;
}

interface MetricsResult {
  metrics: Array<{
    name: string;
    description: string;
    unit: string;
    targetValue: number;
    frequency: string;
    reasoning: string;
  }>;
  overallRationale: string;
  confidence: number;
}

interface ForecastResult {
  probability: number;
  expectedDate: string;
  confidenceLevel: string;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  reasoning: string;
}

interface GenericResult {
  message: string;
}

type AnalysisResult =
  | ProgressCoachingOutput
  | GoalHealthScoreOutput
  | GoalDecompositionOutput
  | ConflictDetectionOutput
  | RefineResult
  | CriteriaResult
  | MetricsResult
  | ForecastResult
  | GenericResult;

interface AIGoalAssistPanelProps {
  mode: AssistMode;
  goal: Goal;
  progress?: GoalProgressBreakdown;
  linkedTasks?: Task[];
  allGoals?: Goal[];
  onClose: () => void;
  onApplyRefinement?: (title: string, description: string) => void;
  onApplyCriteria?: (criteria: string[]) => void;
  onApplySubGoals?: (subGoals: GoalDecompositionOutput['subGoals']) => void;
  onApplyTasks?: (tasks: GoalDecompositionOutput['suggestedTasks']) => void;
}

export function AIGoalAssistPanel({
  mode,
  goal,
  progress,
  linkedTasks = [],
  allGoals = [],
  onClose,
  onApplyRefinement,
  onApplyCriteria,
  onApplySubGoals,
  onApplyTasks,
}: AIGoalAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const isConfigured = llmConfig.isConfigured();

  const getErrorMessage = (error: ApiError | undefined, defaultMessage: string): string => {
    if (!error) return defaultMessage;
    return typeof error === 'string' ? error : error.message || defaultMessage;
  };

  const handleCoaching = async (): Promise<void> => {
    if (!progress) return;
    const response = await goalAIService.getProgressCoaching(goal, progress, linkedTasks);
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(getErrorMessage(response.error, 'Failed to get coaching'));
    }
  };

  const handleHealth = async (): Promise<void> => {
    if (!progress) return;
    const response = await goalAIService.calculateHealthScore(goal, allGoals, progress);
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(getErrorMessage(response.error, 'Failed to calculate health score'));
    }
  };

  const handleDecompose = async (): Promise<void> => {
    const response = await goalAIService.decomposeGoal(goal);
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(getErrorMessage(response.error, 'Failed to decompose goal'));
    }
  };

  const handleConflicts = async (): Promise<void> => {
    const response = await goalAIService.detectConflicts(allGoals);
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(getErrorMessage(response.error, 'Failed to detect conflicts'));
    }
  };

  const handleAIMode = async (): Promise<void> => {
    if (mode === 'coaching') {
      await handleCoaching();
    } else if (mode === 'health') {
      await handleHealth();
    } else if (mode === 'decompose') {
      await handleDecompose();
    } else if (mode === 'conflicts') {
      await handleConflicts();
    }
  };

  const handleRefine = (): void => {
    setResult({
      refinedTitle: `${goal.title} (Enhanced)`,
      refinedDescription: `This is a refined version of your goal with more specific metrics and actionable steps.`,
      reasoning: 'Made the goal more specific and measurable',
      confidence: 0.85,
      suggestedAdjustments: [
        'Add specific numbers',
        'Define success criteria',
        'Set intermediate milestones',
      ],
    });
  };

  const handleCriteria = (): void => {
    setResult({
      criteria: [
        {
          criterion: 'Complete 80% of related tasks',
          measurable: true,
          suggestedMetric: 'Task completion rate',
        },
        {
          criterion: 'Achieve target metric values',
          measurable: true,
          suggestedMetric: 'Metric tracking',
        },
        { criterion: 'Maintain consistent progress', measurable: false },
      ],
      reasoning: 'These criteria cover all aspects of the goal',
      confidence: 0.9,
    });
  };

  const handleMetrics = (): void => {
    setResult({
      metrics: [
        {
          name: 'Weekly Progress',
          description: 'Track weekly progress',
          unit: 'percentage',
          targetValue: 100,
          frequency: 'weekly',
          reasoning: 'Essential for tracking',
        },
        {
          name: 'Daily Consistency',
          description: 'Daily habit tracking',
          unit: 'count',
          targetValue: 7,
          frequency: 'daily',
          reasoning: 'Builds momentum',
        },
      ],
      overallRationale: 'These metrics provide comprehensive tracking',
      confidence: 0.88,
    });
  };

  const handleForecast = (): void => {
    setResult({
      probability: 75,
      expectedDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      confidenceLevel: 'high',
      factors: {
        positive: ['Strong initial progress', 'Clear success criteria', 'Regular tracking'],
        negative: ['Limited time available', 'Multiple competing goals'],
      },
      recommendations: [
        'Focus on high-impact tasks',
        'Schedule dedicated time',
        'Track metrics daily',
      ],
      reasoning: 'Based on current progress and historical patterns',
    });
  };

  const handleLegacyMode = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (mode === 'refine') {
      handleRefine();
    } else if (mode === 'criteria') {
      handleCriteria();
    } else if (mode === 'metrics') {
      handleMetrics();
    } else if (mode === 'forecast') {
      handleForecast();
    } else {
      setResult({ message: 'AI analysis in progress...' });
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const aiModes: AssistMode[] = ['coaching', 'health', 'decompose', 'conflicts'];
      if (aiModes.includes(mode)) {
        await handleAIMode();
      } else {
        await handleLegacyMode();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'refine':
        return <Wand2 className="w-5 h-5" />;
      case 'criteria':
        return <Check className="w-5 h-5" />;
      case 'metrics':
        return <Target className="w-5 h-5" />;
      case 'forecast':
        return <TrendingUp className="w-5 h-5" />;
      case 'conflicts':
        return <AlertTriangle className="w-5 h-5" />;
      case 'coaching':
        return <MessageCircle className="w-5 h-5" />;
      case 'health':
        return <Heart className="w-5 h-5" />;
      case 'decompose':
        return <GitBranch className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'refine':
        return 'Refine Goal';
      case 'criteria':
        return 'Generate Success Criteria';
      case 'metrics':
        return 'Suggest Metrics';
      case 'cascade':
        return 'Goal Cascade';
      case 'forecast':
        return 'Achievement Forecast';
      case 'conflicts':
        return 'Detect Conflicts';
      case 'progress':
        return 'Progress Analysis';
      case 'coaching':
        return 'Progress Coaching';
      case 'health':
        return 'Health Score';
      case 'decompose':
        return 'Goal Decomposition';
    }
  };

  if (!isConfigured) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl p-6 overflow-y-auto z-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                AI Not Configured
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Configure an AI provider in Settings to use AI features.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl p-6 overflow-y-auto z-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {getModeIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getModeTitle()}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Goal: <span className="font-medium text-gray-900 dark:text-gray-100">{goal.title}</span>
        </p>
        {!result && (
          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? 'Analyzing...' : 'Analyze with AI'}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <AIThinkingIndicator />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Analyzing goal...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {result && mode === 'refine' && 'refinedTitle' in result && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refined Title
            </label>
            <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
              {result.refinedTitle}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refined Description
            </label>
            <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
              {result.refinedDescription}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggested Adjustments
            </label>
            <ul className="space-y-2">
              {result.suggestedAdjustments.map((adj: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  {adj}
                </li>
              ))}
            </ul>
          </div>
          <AIConfidenceIndicator confidence={result.confidence} />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onApplyRefinement?.(result.refinedTitle, result.refinedDescription);
                onClose();
              }}
              className="flex-1"
            >
              Apply Refinements
            </Button>
            <Button onClick={onClose} variant="ghost" className="flex-1">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {result && mode === 'criteria' && 'criteria' in result && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Generated Success Criteria
            </label>
            <ul className="space-y-3">
              {result.criteria.map((c, i: number) => (
                <li key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {c.criterion}
                      </p>
                      {c.suggestedMetric && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Metric: {c.suggestedMetric}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <AIConfidenceIndicator confidence={result.confidence} />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const criteria = result.criteria.map((c) => c.criterion);
                onApplyCriteria?.(criteria);
                onClose();
              }}
              className="flex-1"
            >
              Apply Criteria
            </Button>
            <Button onClick={onClose} variant="ghost" className="flex-1">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {result && mode === 'forecast' && 'probability' in result && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {result.probability}%
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">Probability of Achievement</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Positive Factors
            </label>
            <ul className="space-y-1">
              {result.factors.positive.map((f: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2"
                >
                  <span>+</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Challenges
            </label>
            <ul className="space-y-1">
              {result.factors.negative.map((f: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2"
                >
                  <span>-</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recommendations
            </label>
            <ul className="space-y-2">
              {result.recommendations.map((r: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-blue-600 dark:text-blue-400">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result && mode === 'coaching' && 'overallAssessment' in result && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Assessment</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">{result.overallAssessment}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Specific Advice</h4>
            <div className="space-y-2">
              {result.specificAdvice.map((advice, i: number) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        advice.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : advice.priority === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}
                    >
                      {advice.area}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {advice.action}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{advice.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              {result.motivationalMessage}
            </p>
          </div>
        </div>
      )}

      {result && mode === 'health' && 'score' in result && (
        <div className="space-y-4">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {result.score}
            </div>
            <div
              className={`text-sm font-medium uppercase tracking-wide ${
                result.rating === 'excellent'
                  ? 'text-green-600 dark:text-green-400'
                  : result.rating === 'good'
                    ? 'text-blue-600 dark:text-blue-400'
                    : result.rating === 'fair'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : result.rating === 'poor'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-red-600 dark:text-red-400'
              }`}
            >
              {result.rating}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(result.factors).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>

          {result.strengths.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Strengths</h5>
              <ul className="space-y-1">
                {result.strengths.map((s: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2"
                  >
                    <span>+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.concerns.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Concerns</h5>
              <ul className="space-y-1">
                {result.concerns.map((c: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2"
                  >
                    <span>!</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result && mode === 'decompose' && 'subGoals' in result && (
        <div className="space-y-4">
          {result.subGoals && result.subGoals.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sub-Goals</h4>
              <div className="space-y-2">
                {result.subGoals.map((sg, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {sg.title}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {sg.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {sg.timeHorizon}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {onApplySubGoals && (
                <Button
                  onClick={() => {
                    onApplySubGoals(result.subGoals);
                    onClose();
                  }}
                  className="w-full mt-2"
                >
                  Create Sub-Goals
                </Button>
              )}
            </div>
          )}

          {'suggestedTasks' in result &&
            result.suggestedTasks &&
            result.suggestedTasks.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Suggested Tasks</h4>
                <div className="space-y-2">
                  {result.suggestedTasks.slice(0, 5).map((task, i: number) => (
                    <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {task.description}
                      </div>
                    </div>
                  ))}
                </div>
                {onApplyTasks && (
                  <Button
                    onClick={() => {
                      onApplyTasks(result.suggestedTasks);
                      onClose();
                    }}
                    className="w-full mt-2"
                  >
                    Create Tasks
                  </Button>
                )}
              </div>
            )}

          {'implementationPlan' in result && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Implementation Plan
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {result.implementationPlan}
              </p>
            </div>
          )}
        </div>
      )}

      {result && mode === 'conflicts' && 'isOvercommitted' in result && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              result.isOvercommitted
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}
          >
            <h4
              className={`font-medium mb-2 ${
                result.isOvercommitted
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-green-900 dark:text-green-100'
              }`}
            >
              {result.isOvercommitted ? 'Overcommitted' : 'Balanced Workload'}
            </h4>
            <div className="text-2xl font-bold mb-1 ${result.isOvercommitted ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">
              {result.overcommitmentScore}%
            </div>
            <p className="text-sm">{result.capacityAnalysis.sustainabilityRating}</p>
          </div>

          {result.conflicts && result.conflicts.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detected Conflicts</h4>
              <div className="space-y-2">
                {result.conflicts.map((conflict, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase">
                        {conflict.conflictType}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          conflict.severity === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : conflict.severity === 'medium'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {conflict.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white mb-1">
                      {conflict.description}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                      → {conflict.resolution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result &&
        ![
          'refine',
          'criteria',
          'forecast',
          'coaching',
          'health',
          'decompose',
          'conflicts',
        ].includes(mode) &&
        'message' in result && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {(result as GenericResult).message || 'Analysis complete'}
            </p>
          </div>
        )}
    </div>
  );
}
