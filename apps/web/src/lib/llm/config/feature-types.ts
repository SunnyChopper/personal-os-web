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
  | 'noteAnalyze';

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
};

export const DEFAULT_FEATURE_PROVIDERS: Record<AIFeature, FeatureProviderConfig> = {
  parseTask: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  breakdownTask: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  priorityAdvisor: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  effortEstimation: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  taskCategorization: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  dependencyDetection: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  projectHealth: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  projectTaskGen: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  projectRisk: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  goalRefinement: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  successCriteriaGen: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  metricSuggestions: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  goalCascade: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  achievementForecast: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  goalConflict: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  goalProgress: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  metricPatterns: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  metricAnomalies: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  metricCorrelations: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  metricTargets: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  metricHealth: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  habitDesign: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  habitStack: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  streakRecovery: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  habitPatterns: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  triggerOptimization: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  habitGoalAlignment: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  reflectionPrompts: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  dailyDigest: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  logbookPatterns: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  sentimentAnalysis: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  weeklyReview: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  connectionSuggestions: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  noteExpand: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  noteSummarize: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  noteImprove: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  noteTagSuggest: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  noteAreaSuggest: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  noteLinkSuggest: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  noteGenerate: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  noteExtract: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  noteAnalyze: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
};
