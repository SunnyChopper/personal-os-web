import type { LLMProvider } from './provider-types';

export type AIFeature =
  | 'parseTask'
  | 'breakdownTask'
  | 'priorityAdvisor'
  | 'effortEstimation'
  | 'taskCategorization'
  | 'dependencyDetection'
  | 'projectHealth'
  | 'projectTaskGen'
  | 'projectRisk'
  | 'goalRefinement'
  | 'successCriteriaGen'
  | 'metricSuggestions'
  | 'goalCascade'
  | 'achievementForecast'
  | 'goalConflict'
  | 'goalProgress'
  | 'metricPatterns'
  | 'metricAnomalies'
  | 'metricCorrelations'
  | 'metricTargets'
  | 'metricHealth'
  | 'habitDesign'
  | 'habitStack'
  | 'streakRecovery'
  | 'habitPatterns'
  | 'triggerOptimization'
  | 'habitGoalAlignment'
  | 'reflectionPrompts'
  | 'dailyDigest'
  | 'logbookPatterns'
  | 'sentimentAnalysis'
  | 'weeklyReview'
  | 'connectionSuggestions'
  | 'noteExpand'
  | 'noteSummarize'
  | 'noteImprove'
  | 'noteTagSuggest'
  | 'noteAreaSuggest'
  | 'noteLinkSuggest'
  | 'noteGenerate'
  | 'noteExtract'
  | 'noteAnalyze'
  | 'contentIdeation'
  | 'brandTopicBrainstorm'
  | 'platformFitSuggest'
  | 'projectLabIdeation';

export interface FeatureProviderConfig {
  provider: LLMProvider;
  model: string;
}

/** Grouped for settings UI (order preserved within each group). */
export const AI_FEATURE_GROUPS: { id: string; label: string; features: AIFeature[] }[] = [
  {
    id: 'tasks-projects',
    label: 'Tasks & projects',
    features: [
      'parseTask',
      'breakdownTask',
      'priorityAdvisor',
      'effortEstimation',
      'taskCategorization',
      'dependencyDetection',
      'projectHealth',
      'projectTaskGen',
      'projectRisk',
    ],
  },
  {
    id: 'goals-metrics',
    label: 'Goals & metrics',
    features: [
      'goalRefinement',
      'successCriteriaGen',
      'metricSuggestions',
      'goalCascade',
      'achievementForecast',
      'goalConflict',
      'goalProgress',
      'metricPatterns',
      'metricAnomalies',
      'metricCorrelations',
      'metricTargets',
      'metricHealth',
    ],
  },
  {
    id: 'habits-logbook',
    label: 'Habits, logbook & review',
    features: [
      'habitDesign',
      'habitStack',
      'streakRecovery',
      'habitPatterns',
      'triggerOptimization',
      'habitGoalAlignment',
      'reflectionPrompts',
      'dailyDigest',
      'logbookPatterns',
      'sentimentAnalysis',
      'weeklyReview',
      'connectionSuggestions',
    ],
  },
  {
    id: 'personal-branding',
    label: 'Personal branding',
    features: ['contentIdeation', 'brandTopicBrainstorm', 'platformFitSuggest'],
  },
  {
    id: 'notes',
    label: 'Knowledge vault / notes',
    features: [
      'noteExpand',
      'noteSummarize',
      'noteImprove',
      'noteTagSuggest',
      'noteAreaSuggest',
      'noteLinkSuggest',
      'noteGenerate',
      'noteExtract',
      'noteAnalyze',
      'projectLabIdeation',
    ],
  },
];

export const AI_FEATURE_DISPLAY_NAMES: Record<AIFeature, string> = {
  parseTask: 'Task Parsing',
  breakdownTask: 'Task Breakdown',
  priorityAdvisor: 'Priority Advisor',
  effortEstimation: 'Effort Estimation',
  taskCategorization: 'Task Categorization',
  dependencyDetection: 'Dependency Detection',
  projectHealth: 'Project Health Analysis',
  projectTaskGen: 'Project Task Generation',
  projectRisk: 'Project Risk Assessment',
  goalRefinement: 'Goal Refinement',
  successCriteriaGen: 'Success Criteria Generation',
  metricSuggestions: 'Metric Suggestions',
  goalCascade: 'Goal Cascade Planning',
  achievementForecast: 'Achievement Forecasting',
  goalConflict: 'Goal Conflict Detection',
  goalProgress: 'Goal Progress Analysis',
  metricPatterns: 'Metric Pattern Recognition',
  metricAnomalies: 'Anomaly Detection',
  metricCorrelations: 'Correlation Discovery',
  metricTargets: 'Target Recommendations',
  metricHealth: 'Metric Health Analysis',
  habitDesign: 'Habit Design Assistant',
  habitStack: 'Habit Stack Suggestions',
  streakRecovery: 'Streak Recovery Coach',
  habitPatterns: 'Habit Pattern Analysis',
  triggerOptimization: 'Trigger Optimization',
  habitGoalAlignment: 'Habit-Goal Alignment',
  reflectionPrompts: 'Reflection Prompts',
  dailyDigest: 'Daily Digest Generation',
  logbookPatterns: 'Journal Pattern Insights',
  sentimentAnalysis: 'Sentiment Analysis',
  weeklyReview: 'Weekly Review Generator',
  connectionSuggestions: 'Connection Suggestions',
  noteExpand: 'Note Content Expansion',
  noteSummarize: 'Note Summarization',
  noteImprove: 'Note Clarity Improvement',
  noteTagSuggest: 'Note Tag Suggestions',
  noteAreaSuggest: 'Note Area Categorization',
  noteLinkSuggest: 'Note Link Suggestions',
  noteGenerate: 'Note Content Generation',
  noteExtract: 'Note Content Extraction',
  noteAnalyze: 'Note Content Analysis',
  contentIdeation: 'Content Ideation Engine',
  brandTopicBrainstorm: 'Brand Topic Brainstorm',
  platformFitSuggest: 'Platform Fit Suggestions',
  projectLabIdeation: 'Project Labs Ideation',
};

/** Bundled fallback when feature-config API is unreachable (Apr 2026 catalog). */
export const DEFAULT_FEATURE_PROVIDERS: Record<AIFeature, FeatureProviderConfig> = {
  parseTask: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  breakdownTask: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  priorityAdvisor: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  effortEstimation: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  taskCategorization: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  dependencyDetection: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  projectHealth: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  projectTaskGen: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  projectRisk: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  goalRefinement: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  successCriteriaGen: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  metricSuggestions: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  goalCascade: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  achievementForecast: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  goalConflict: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  goalProgress: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  metricPatterns: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  metricAnomalies: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  metricCorrelations: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  metricTargets: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  metricHealth: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  habitDesign: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  habitStack: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  streakRecovery: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  habitPatterns: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  triggerOptimization: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  habitGoalAlignment: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  reflectionPrompts: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  dailyDigest: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  logbookPatterns: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  sentimentAnalysis: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  weeklyReview: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  connectionSuggestions: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  noteExpand: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  noteSummarize: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  noteImprove: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  noteTagSuggest: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  noteAreaSuggest: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  noteLinkSuggest: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  noteGenerate: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  noteExtract: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  noteAnalyze: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  contentIdeation: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  brandTopicBrainstorm: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  platformFitSuggest: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  projectLabIdeation: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
};
