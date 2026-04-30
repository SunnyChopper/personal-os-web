import { useState } from 'react';
import { Sparkles, Zap, X, AlertCircle, Target, TrendingUp, Repeat, Lightbulb } from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import type { Habit, HabitLog } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';

type AssistMode = 'design' | 'stack' | 'recovery' | 'patterns' | 'triggers' | 'alignment';

interface FrictionStrategy {
  strategy: string;
  implementation: string;
  effectiveness: 'high' | 'medium' | 'low';
}

interface DesignResult {
  optimizedTrigger: string;
  optimizedAction: string;
  optimizedReward: string;
  frictionStrategies: FrictionStrategy[];
  targetFrequency: string;
  reasoning: string;
  confidence: number;
}

interface StackSuggestion {
  existingHabit: string;
  newHabit: string;
  stackingPattern: string;
  rationale: string;
  difficulty: string;
}

interface TimingRecommendation {
  timeOfDay: string;
  habits: string[];
  reasoning: string;
}

interface StackResult {
  stackSuggestions: StackSuggestion[];
  timingRecommendations: TimingRecommendation[];
  confidence: number;
}

interface RecoveryAnalysis {
  currentStreak: number;
  longestStreak: number;
  recentMisses: number;
  pattern: string;
}

interface RecoveryStep {
  step: string;
  timeframe: string;
  difficulty: 'easy' | 'moderate' | 'hard';
}

interface RecoveryResult {
  analysis: RecoveryAnalysis;
  recoveryPlan: RecoveryStep[];
  motivationalInsights: string[];
  adjustmentSuggestions: string[];
  confidence: number;
}

interface CompletionPattern {
  pattern: string;
  frequency: string;
  context: string;
  strength: string;
}

interface OptimalTiming {
  bestTimeOfDay: string;
  bestDayOfWeek: string;
  reasoning: string;
}

interface Correlation {
  factor: string;
  impact: string;
  strength: string;
  insights: string;
}

interface PatternsResult {
  completionPatterns: CompletionPattern[];
  optimalTiming: OptimalTiming;
  correlations: Correlation[];
  recommendations: string[];
  confidence: number;
}

interface TriggerAnalysis {
  clarity: string;
  observability: string;
  consistency: string;
  issues: string[];
}

interface OptimizedTrigger {
  trigger: string;
  type: string;
  specificity: string;
  effectiveness: string;
  implementation: string;
}

interface TriggersResult {
  currentTriggerAnalysis: TriggerAnalysis;
  optimizedTriggers: OptimizedTrigger[];
  environmentalCues: string[];
  confidence: number;
}

interface AlignedGoal {
  goalTitle: string;
  alignmentStrength: string;
  explanation: string;
  impact: string;
}

interface Misalignment {
  issue: string;
  severity: string;
  suggestion: string;
}

interface NewHabitSuggestion {
  habitName: string;
  goalSupported: string;
  rationale: string;
  priority: string;
}

interface AlignmentResult {
  alignedGoals: AlignedGoal[];
  misalignments: Misalignment[];
  newHabitSuggestions: NewHabitSuggestion[];
  confidence: number;
}

interface GenericResult {
  message: string;
}

type AnalysisResult =
  | DesignResult
  | StackResult
  | RecoveryResult
  | PatternsResult
  | TriggersResult
  | AlignmentResult
  | GenericResult;

interface AIHabitAssistPanelProps {
  mode: AssistMode;
  habit: Habit;
  logs: HabitLog[];
  onClose: () => void;
  onApplyDesign?: (trigger: string, action: string, reward: string) => void;
}

export function AIHabitAssistPanel({
  mode,
  habit,
  logs,
  onClose,
  onApplyDesign,
}: AIHabitAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const isConfigured = llmConfig.isConfigured();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (mode === 'design') {
      setResult({
        optimizedTrigger: `After ${habit.trigger || 'your morning coffee'}`,
        optimizedAction: habit.action || 'Perform the habit',
        optimizedReward: 'Feel accomplished and energized',
        frictionStrategies: [
          {
            strategy: 'Environment design',
            implementation: 'Place tools in visible location',
            effectiveness: 'high',
          },
          {
            strategy: 'Implementation intention',
            implementation: 'Use "if-then" planning',
            effectiveness: 'high',
          },
          {
            strategy: 'Habit stacking',
            implementation: 'Link to existing routine',
            effectiveness: 'medium',
          },
        ],
        targetFrequency: habit.frequency || 'Daily',
        reasoning: 'Clear triggers and immediate rewards increase habit formation success',
        confidence: 0.88,
      });
    } else if (mode === 'stack') {
      setResult({
        stackSuggestions: [
          {
            existingHabit: 'Morning coffee',
            newHabit: habit.name,
            stackingPattern: 'After I pour my coffee, I will do [habit]',
            rationale: 'Morning routines are stable anchors',
            difficulty: 'easy',
          },
          {
            existingHabit: 'Lunch break',
            newHabit: habit.name,
            stackingPattern: 'Before I eat lunch, I will do [habit]',
            rationale: 'Consistent daily trigger',
            difficulty: 'moderate',
          },
        ],
        timingRecommendations: [
          {
            timeOfDay: 'Morning (6-9 AM)',
            habits: [habit.name, 'Exercise', 'Meditation'],
            reasoning: 'High willpower and energy levels',
          },
        ],
        confidence: 0.85,
      });
    } else if (mode === 'recovery') {
      const hasRecent = logs.length > 0;
      const currentStreak = 0;
      const longestStreak = 0;
      setResult({
        analysis: {
          currentStreak: currentStreak,
          longestStreak: longestStreak,
          recentMisses: hasRecent ? 2 : 5,
          pattern: hasRecent ? 'Occasional misses on weekends' : 'Long gap in tracking',
        },
        recoveryPlan: [
          { step: 'Start with single day completion', timeframe: 'Today', difficulty: 'easy' },
          {
            step: 'Maintain for 3 consecutive days',
            timeframe: 'This week',
            difficulty: 'moderate',
          },
          { step: 'Reach 7-day streak', timeframe: '2 weeks', difficulty: 'moderate' },
        ],
        motivationalInsights: [
          "You've done this before - your longest streak proves it's possible",
          'Small wins compound over time',
          'Focus on consistency over perfection',
        ],
        adjustmentSuggestions: [
          'Reduce difficulty temporarily',
          'Add environmental cues',
          'Find an accountability partner',
        ],
        confidence: 0.82,
      });
    } else if (mode === 'patterns') {
      setResult({
        completionPatterns: [
          {
            pattern: 'Higher completion on weekdays',
            frequency: '80%',
            context: 'Structured schedule supports consistency',
            strength: 'strong',
          },
          {
            pattern: 'Better performance in morning',
            frequency: '70%',
            context: 'Fresh energy and willpower',
            strength: 'moderate',
          },
        ],
        optimalTiming: {
          bestTimeOfDay: '7:00 AM - 8:00 AM',
          bestDayOfWeek: 'Tuesday and Thursday',
          reasoning: 'Highest historical completion rates',
        },
        correlations: [
          {
            factor: 'Energy level',
            impact: 'positive',
            strength: 'strong',
            insights: 'Higher energy strongly predicts completion',
          },
          {
            factor: 'Weekend days',
            impact: 'negative',
            strength: 'moderate',
            insights: 'Unstructured time makes habit harder',
          },
        ],
        recommendations: [
          'Schedule for early morning on weekdays',
          'Create weekend-specific cues',
          'Track energy levels to identify patterns',
        ],
        confidence: 0.86,
      });
    } else if (mode === 'triggers') {
      setResult({
        currentTriggerAnalysis: {
          clarity: habit.trigger ? 'somewhat clear' : 'unclear',
          observability: habit.trigger ? 'noticeable' : 'hard to notice',
          consistency: 'somewhat consistent',
          issues: habit.trigger
            ? ['Could be more specific']
            : ['No clear trigger defined', 'Relies on motivation'],
        },
        optimizedTriggers: [
          {
            trigger: 'Right after morning alarm',
            type: 'time',
            specificity: 'very specific',
            effectiveness: 'high',
            implementation: 'Set phone alarm with habit reminder',
          },
          {
            trigger: 'When entering home office',
            type: 'location',
            specificity: 'very specific',
            effectiveness: 'high',
            implementation: 'Place visual cue on door',
          },
          {
            trigger: 'After completing breakfast',
            type: 'preceding action',
            specificity: 'very specific',
            effectiveness: 'medium',
            implementation: 'Add to morning routine checklist',
          },
        ],
        environmentalCues: [
          'Visual reminder in obvious location',
          'Physical tool placement',
          'Phone notification',
          'Calendar block',
        ],
        confidence: 0.84,
      });
    } else if (mode === 'alignment') {
      setResult({
        alignedGoals: [
          {
            goalTitle: 'Improve Health',
            alignmentStrength: 'strong',
            explanation: 'Directly supports fitness goals',
            impact: 'Regular practice builds toward long-term health outcomes',
          },
        ],
        misalignments: [
          {
            issue: 'May conflict with evening social activities',
            severity: 'low',
            suggestion: 'Reschedule to morning hours',
          },
        ],
        newHabitSuggestions: [
          {
            habitName: 'Track habit completion',
            goalSupported: 'Improve Health',
            rationale: 'Tracking increases awareness and consistency',
            priority: 'medium',
          },
        ],
        confidence: 0.87,
      });
    } else {
      setResult({ message: 'AI analysis in progress...' });
    }

    setIsLoading(false);
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'design':
        return <Lightbulb className="w-5 h-5" />;
      case 'stack':
        return <Repeat className="w-5 h-5" />;
      case 'recovery':
        return <Target className="w-5 h-5" />;
      case 'patterns':
        return <TrendingUp className="w-5 h-5" />;
      case 'triggers':
        return <Zap className="w-5 h-5" />;
      case 'alignment':
        return <Target className="w-5 h-5" />;
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'design':
        return 'Habit Design Assistant';
      case 'stack':
        return 'Habit Stack Suggestions';
      case 'recovery':
        return 'Streak Recovery Coach';
      case 'patterns':
        return 'Pattern Analysis';
      case 'triggers':
        return 'Trigger Optimization';
      case 'alignment':
        return 'Goal Alignment';
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
          Habit: <span className="font-medium text-gray-900 dark:text-gray-100">{habit.name}</span>
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
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Analyzing habit...</p>
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

      {result && mode === 'design' && 'frictionStrategies' in result && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Optimized Trigger
            </label>
            <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
              {result.optimizedTrigger}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Optimized Reward
            </label>
            <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
              {result.optimizedReward}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Friction Strategies
            </label>
            <div className="space-y-2">
              {result.frictionStrategies.map((s, i: number) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {s.strategy}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        s.effectiveness === 'high'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : s.effectiveness === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {s.effectiveness}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{s.implementation}</p>
                </div>
              ))}
            </div>
          </div>
          <AIConfidenceIndicator confidence={result.confidence} />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onApplyDesign?.(
                  result.optimizedTrigger,
                  result.optimizedAction,
                  result.optimizedReward
                );
                onClose();
              }}
              className="flex-1"
            >
              Apply Design
            </Button>
            <Button onClick={onClose} variant="ghost" className="flex-1">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {result && mode === 'recovery' && 'recoveryPlan' in result && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.analysis.currentStreak}
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-200">Current Streak</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.analysis.longestStreak}
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-200">Longest Streak</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recovery Plan
            </label>
            <div className="space-y-2">
              {result.recoveryPlan.map((step, i: number) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {step.step}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {step.timeframe}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      step.difficulty === 'easy'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : step.difficulty === 'moderate'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {step.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivational Insights
            </label>
            <ul className="space-y-2">
              {result.motivationalInsights.map((insight: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
          <AIConfidenceIndicator confidence={result.confidence} />
        </div>
      )}

      {result && mode === 'patterns' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Completion Patterns
            </label>
            {(result as PatternsResult).completionPatterns.map((pattern, i: number) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pattern.pattern}
                  </span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {pattern.frequency}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{pattern.context}</p>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Optimal Timing
            </label>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                <span className="font-medium">Best Time:</span>{' '}
                {(result as PatternsResult).optimalTiming.bestTimeOfDay}
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                <span className="font-medium">Best Day:</span>{' '}
                {(result as PatternsResult).optimalTiming.bestDayOfWeek}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {(result as PatternsResult).optimalTiming.reasoning}
              </p>
            </div>
          </div>
          <AIConfidenceIndicator confidence={(result as PatternsResult).confidence} />
        </div>
      )}

      {result && !['design', 'recovery', 'patterns'].includes(mode) && 'message' in result && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {result.message || 'Analysis complete'}
          </p>
        </div>
      )}
    </div>
  );
}
