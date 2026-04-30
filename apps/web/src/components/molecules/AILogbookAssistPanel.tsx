import { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  X,
  AlertCircle,
  TrendingUp,
  Smile,
  Calendar,
  Link,
} from 'lucide-react';
import { llmConfig } from '@/lib/llm';
import type { LogbookEntry } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';

type AssistMode = 'prompts' | 'digest' | 'patterns' | 'sentiment' | 'review' | 'connections';

interface Prompt {
  question: string;
  category: string;
  depth: string;
  context: string;
}

interface PromptsResult {
  prompts: Prompt[];
  focusAreas: string[];
  confidence: number;
}

interface Highlight {
  type: 'accomplishment' | 'learning' | 'challenge';
  description: string;
}

interface DigestMetrics {
  tasksCompleted: number;
  habitsLogged: number;
  energyAverage: number;
  moodSummary: string;
}

interface DigestResult {
  summary: string;
  highlights: Highlight[];
  metrics: DigestMetrics;
  momentum: string;
  tomorrowFocus: string[];
  confidence: number;
}

interface Pattern {
  pattern: string;
  frequency: string;
  significance: string;
  examples: string[];
  insights: string;
}

interface Trends {
  energyTrend: string;
  moodTrend: string;
  productivityTrend: string;
}

interface Correlation {
  factor1: string;
  factor2: string;
  relationship: string;
  strength: string;
}

interface PatternsResult {
  patterns: Pattern[];
  trends: Trends;
  correlations: Correlation[];
  recommendations: string[];
  confidence: number;
}

interface EmotionalTheme {
  theme: string;
  frequency: string;
  context: string;
}

interface ConcerningPattern {
  pattern: string;
  severity: string;
  suggestion: string;
}

interface SentimentResult {
  overallSentiment: string;
  sentimentScore: number;
  emotionalThemes: EmotionalTheme[];
  sentimentTrend: string;
  concerningPatterns: ConcerningPattern[];
  positiveMoments: string[];
  confidence: number;
}

interface Achievement {
  description: string;
  impact: string;
  category: string;
}

interface Challenge {
  description: string;
  lessons: string;
  futureAction: string;
}

interface ReviewMetrics {
  weeklyProgress: string;
  habitConsistency: string;
  energyPattern: string;
  moodPattern: string;
}

interface NextWeekFocus {
  area: string;
  objective: string;
  actions: string[];
}

interface ReviewResult {
  weekSummary: string;
  achievements: Achievement[];
  challenges: Challenge[];
  insights: string[];
  metrics: ReviewMetrics;
  nextWeekFocus: NextWeekFocus[];
  confidence: number;
}

interface SuggestedConnection {
  entityType: string;
  entityTitle: string;
  entityId: string;
  relevance: string;
  reasoning: string;
}

interface RelatedDay {
  date: string;
  similarity: string;
  commonThemes: string[];
}

interface ConnectionsResult {
  suggestedConnections: SuggestedConnection[];
  missingContext: string[];
  relatedDays: RelatedDay[];
  confidence: number;
}

interface GenericResult {
  message: string;
}

type AnalysisResult =
  | PromptsResult
  | DigestResult
  | PatternsResult
  | SentimentResult
  | ReviewResult
  | ConnectionsResult
  | GenericResult;

interface AILogbookAssistPanelProps {
  mode: AssistMode;
  entry?: LogbookEntry;
  entries: LogbookEntry[];
  onClose: () => void;
  onApplyPrompts?: (prompts: string[]) => void;
}

export function AILogbookAssistPanel({
  mode,
  entry,
  entries,
  onClose,
  onApplyPrompts,
}: AILogbookAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const isConfigured = llmConfig.isConfigured();

  const handlePrompts = (): void => {
    setResult({
      prompts: [
        {
          question: 'What am I most grateful for today?',
          category: 'gratitude',
          depth: 'surface',
          context: 'Starting with gratitude sets a positive tone',
        },
        {
          question: "What did I learn from today's challenges?",
          category: 'learning',
          depth: 'moderate',
          context: 'Recent obstacles present growth opportunities',
        },
        {
          question: 'How did my actions today align with my long-term goals?',
          category: 'progress',
          depth: 'deep',
          context: 'Connecting daily actions to bigger vision',
        },
      ],
      focusAreas: ['Personal growth', 'Goal alignment', 'Emotional awareness'],
      confidence: 0.86,
    });
  };

  const handleDigest = (): void => {
    const hasEntries = entries.length > 0;
    setResult({
      summary: hasEntries
        ? 'Today was a productive day focused on completing key tasks and maintaining healthy habits. Energy levels were steady throughout the day.'
        : 'No entries logged today yet. Start by reflecting on your morning.',
      highlights: hasEntries
        ? [
            { type: 'accomplishment', description: 'Completed 5 out of 6 planned tasks' },
            { type: 'learning', description: 'Discovered new approach to problem-solving' },
            { type: 'challenge', description: 'Struggled with time management in afternoon' },
          ]
        : [],
      metrics: {
        tasksCompleted: 5,
        habitsLogged: 3,
        energyAverage: 7.5,
        moodSummary: 'Mostly steady with positive moments',
      },
      momentum: 'building',
      tomorrowFocus: [
        'Continue morning routine consistency',
        'Address afternoon energy dip',
        'Complete remaining high-priority task',
      ],
      confidence: 0.88,
    });
  };

  const handlePatterns = (): void => {
    setResult({
      patterns: [
        {
          pattern: 'Higher energy on days with morning exercise',
          frequency: '85% of days',
          significance: 'high',
          examples: ['Jan 2', 'Jan 4', 'Jan 5'],
          insights: 'Morning movement strongly predicts full-day energy',
        },
        {
          pattern: 'Lower mood on days with fewer social interactions',
          frequency: '60% of days',
          significance: 'medium',
          examples: ['Jan 1', 'Jan 3'],
          insights: 'Connection time appears important for emotional well-being',
        },
      ],
      trends: {
        energyTrend: 'improving',
        moodTrend: 'stable',
        productivityTrend: 'improving',
      },
      correlations: [
        {
          factor1: 'Morning exercise',
          factor2: 'Task completion rate',
          relationship: 'Positive correlation',
          strength: 'strong',
        },
      ],
      recommendations: [
        'Prioritize morning movement',
        'Schedule regular social time',
        'Track sleep quality for deeper insights',
      ],
      confidence: 0.84,
    });
  };

  const handleSentiment = (): void => {
    const hasMultiple = entries.length > 3;
    setResult({
      overallSentiment: hasMultiple ? 'positive' : 'neutral',
      sentimentScore: hasMultiple ? 0.65 : 0.1,
      emotionalThemes: hasMultiple
        ? [
            { theme: 'Optimism', frequency: 'frequent', context: 'When writing about progress' },
            {
              theme: 'Frustration',
              frequency: 'occasional',
              context: 'Related to time constraints',
            },
          ]
        : [
            {
              theme: 'Neutral reflection',
              frequency: 'frequent',
              context: 'Limited data available',
            },
          ],
      sentimentTrend: hasMultiple ? 'improving' : 'stable',
      concerningPatterns: hasMultiple
        ? []
        : [
            {
              pattern: 'Insufficient data for analysis',
              severity: 'low',
              suggestion: 'Log entries more frequently for better insights',
            },
          ],
      positiveMoments: hasMultiple
        ? ['Jan 4 - Breakthrough moment', 'Jan 5 - Strong progress']
        : [],
      confidence: hasMultiple ? 0.79 : 0.65,
    });
  };

  const handleReview = (): void => {
    setResult({
      weekSummary:
        'A week of steady progress with strong momentum building in the second half. Key breakthrough in project work.',
      achievements: [
        {
          description: 'Completed major project milestone',
          impact: 'significant',
          category: 'Work',
        },
        {
          description: 'Maintained daily habit streak',
          impact: 'moderate',
          category: 'Health',
        },
      ],
      challenges: [
        {
          description: 'Time management on busy days',
          lessons: 'Need better prioritization system',
          futureAction: 'Implement time-blocking technique',
        },
      ],
      insights: [
        'Morning routines create momentum for entire day',
        'Social connections boost energy and mood',
        'Evening wind-down improves next-day performance',
      ],
      metrics: {
        weeklyProgress: '85% of goals achieved',
        habitConsistency: '6/7 days completed',
        energyPattern: 'Higher in mornings, dips after lunch',
        moodPattern: 'Steady positive with weekend peaks',
      },
      nextWeekFocus: [
        {
          area: 'Health',
          objective: 'Maintain exercise streak',
          actions: ['Morning workout', 'Evening walk', 'Track water intake'],
        },
        {
          area: 'Work',
          objective: 'Complete next project phase',
          actions: ['Time-block deep work', 'Minimize meetings', 'Daily progress review'],
        },
      ],
      confidence: 0.89,
    });
  };

  const handleConnections = (): void => {
    setResult({
      suggestedConnections: [
        {
          entityType: 'task',
          entityTitle: 'Complete project documentation',
          entityId: 'task-1',
          relevance: 'high',
          reasoning: 'You mentioned working on documentation today',
        },
        {
          entityType: 'habit',
          entityTitle: 'Morning exercise',
          entityId: 'habit-1',
          relevance: 'medium',
          reasoning: 'You noted feeling energized this morning',
        },
      ],
      missingContext: [
        'Which specific tasks were completed?',
        'What was the biggest challenge faced?',
        'Any notable interactions or conversations?',
      ],
      relatedDays: [
        {
          date: '2026-01-03',
          similarity: 'very similar',
          commonThemes: ['High energy', 'Productive morning', 'Project focus'],
        },
      ],
      confidence: 0.81,
    });
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (mode === 'prompts') {
      handlePrompts();
    } else if (mode === 'digest') {
      handleDigest();
    } else if (mode === 'patterns') {
      handlePatterns();
    } else if (mode === 'sentiment') {
      handleSentiment();
    } else if (mode === 'review') {
      handleReview();
    } else if (mode === 'connections') {
      handleConnections();
    } else {
      setResult({ message: 'AI analysis in progress...' });
    }

    setIsLoading(false);
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'prompts':
        return <BookOpen className="w-5 h-5" />;
      case 'digest':
        return <Calendar className="w-5 h-5" />;
      case 'patterns':
        return <TrendingUp className="w-5 h-5" />;
      case 'sentiment':
        return <Smile className="w-5 h-5" />;
      case 'review':
        return <Calendar className="w-5 h-5" />;
      case 'connections':
        return <Link className="w-5 h-5" />;
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'prompts':
        return 'Reflection Prompts';
      case 'digest':
        return 'Daily Digest';
      case 'patterns':
        return 'Pattern Insights';
      case 'sentiment':
        return 'Sentiment Analysis';
      case 'review':
        return 'Weekly Review';
      case 'connections':
        return 'Connection Suggestions';
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
          {entry ? `Entry: ${entry.title || 'Today'}` : `Analyzing ${entries.length} entries`}
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
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Analyzing journal...</p>
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

      {result && mode === 'prompts' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Reflection Questions
            </label>
            <div className="space-y-3">
              {(result as PromptsResult).prompts.map((prompt, i: number) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {prompt.question}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {prompt.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {prompt.depth}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{prompt.context}</p>
                </div>
              ))}
            </div>
          </div>
          <AIConfidenceIndicator confidence={(result as PromptsResult).confidence} />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const prompts = (result as PromptsResult).prompts.map((p) => p.question);
                onApplyPrompts?.(prompts);
                onClose();
              }}
              className="flex-1"
            >
              Use Prompts
            </Button>
            <Button onClick={onClose} variant="ghost" className="flex-1">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {result && mode === 'digest' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Summary
            </label>
            <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
              {(result as DigestResult).summary}
            </p>
          </div>
          {(result as DigestResult).highlights.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Highlights
              </label>
              <div className="space-y-2">
                {(result as DigestResult).highlights.map((h, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-0.5 ${
                        h.type === 'accomplishment'
                          ? 'text-green-600 dark:text-green-400'
                          : h.type === 'learning'
                            ? 'text-blue-600 dark:text-blue-400'
                            : h.type === 'challenge'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {h.type === 'accomplishment'
                        ? '✓'
                        : h.type === 'learning'
                          ? '💡'
                          : h.type === 'challenge'
                            ? '⚡'
                            : '•'}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{h.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-blue-900 dark:text-blue-100">Momentum:</span>
                <span className="font-medium text-blue-700 dark:text-blue-300 capitalize">
                  {(result as DigestResult).momentum}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-900 dark:text-blue-100">Tasks Completed:</span>
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {(result as DigestResult).metrics.tasksCompleted}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-900 dark:text-blue-100">Habits Logged:</span>
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {(result as DigestResult).metrics.habitsLogged}
                </span>
              </div>
            </div>
          </div>
          <AIConfidenceIndicator confidence={(result as DigestResult).confidence} />
        </div>
      )}

      {result && mode === 'review' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Week Summary
            </label>
            <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
              {(result as ReviewResult).weekSummary}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Achievements
            </label>
            <div className="space-y-2">
              {(result as ReviewResult).achievements.map((a, i: number) => (
                <div key={i} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  <p className="text-gray-900 dark:text-gray-100">{a.description}</p>
                  <span className="text-xs text-green-700 dark:text-green-300">
                    {a.category} - {a.impact} impact
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Next Week Focus
            </label>
            <div className="space-y-2">
              {(result as ReviewResult).nextWeekFocus.map((f, i: number) => (
                <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    {f.area}: {f.objective}
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                    {f.actions.map((action: string, j: number) => (
                      <li key={j}>• {action}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <AIConfidenceIndicator confidence={(result as ReviewResult).confidence} />
        </div>
      )}

      {result && !['prompts', 'digest', 'review'].includes(mode) && 'message' in result && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {(result as GenericResult).message || 'Analysis complete'}
          </p>
        </div>
      )}
    </div>
  );
}
