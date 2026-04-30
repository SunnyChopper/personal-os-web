import type { AIFeature, FeatureProviderConfig } from './feature-types';
import type { LLMProvider } from './provider-types';
import { PROVIDER_DISPLAY_NAMES } from './provider-types';
import { DEFAULT_FEATURE_PROVIDERS } from './feature-types';
import { getDefaultModel } from './model-catalog';
import { apiClient } from '@/lib/api-client';

// Cache for feature configs to avoid repeated API calls
let featureConfigsCache: Record<AIFeature, FeatureProviderConfig> | null = null;
let cacheLoadPromise: Promise<Record<AIFeature, FeatureProviderConfig>> | null = null;

async function loadFeatureConfigs(): Promise<Record<AIFeature, FeatureProviderConfig>> {
  if (featureConfigsCache !== null) {
    return featureConfigsCache;
  }

  // If already loading, return the existing promise
  if (cacheLoadPromise !== null) {
    return cacheLoadPromise;
  }

  cacheLoadPromise = (async () => {
    try {
      const response = await apiClient.getFeatureConfigs();
      if (response.success && response.data) {
        featureConfigsCache = response.data;
        return featureConfigsCache;
      }
      // Fallback to defaults if API fails
      return DEFAULT_FEATURE_PROVIDERS;
    } catch (error) {
      console.error('Failed to load feature configs from backend:', error);
      // Fallback to defaults on error
      return DEFAULT_FEATURE_PROVIDERS;
    } finally {
      cacheLoadPromise = null;
    }
  })();

  return cacheLoadPromise;
}

function invalidateCache(): void {
  featureConfigsCache = null;
  cacheLoadPromise = null;
}

// Async version - always fetches from backend
export async function getFeatureConfig(feature: AIFeature): Promise<FeatureProviderConfig> {
  try {
    const configs = await loadFeatureConfigs();
    return configs[feature] || DEFAULT_FEATURE_PROVIDERS[feature];
  } catch (error) {
    console.error(`Failed to get feature config for ${feature}:`, error);
    return DEFAULT_FEATURE_PROVIDERS[feature];
  }
}

// Synchronous version for backward compatibility (returns cached value or default)
export function getFeatureConfigSync(feature: AIFeature): FeatureProviderConfig {
  if (featureConfigsCache === null) {
    // Try to trigger async load in background
    loadFeatureConfigs().catch(() => {
      // Silently fail - will be retried on next access
    });
    return DEFAULT_FEATURE_PROVIDERS[feature];
  }
  return featureConfigsCache[feature] || DEFAULT_FEATURE_PROVIDERS[feature];
}

export async function setFeatureConfig(
  feature: AIFeature,
  provider: LLMProvider,
  model: string
): Promise<void> {
  try {
    const config: FeatureProviderConfig = { provider, model };
    const response = await apiClient.setFeatureConfig(feature, config);
    if (!response.success) {
      throw new Error(response.error?.message || `Failed to save configuration for ${feature}`);
    }
    invalidateCache();
    // Reload cache after update
    await loadFeatureConfigs();
  } catch (error) {
    console.error(`Failed to set feature config for ${feature}:`, error);
    throw error instanceof Error ? error : new Error(`Failed to save configuration for ${feature}`);
  }
}

export async function resetFeatureConfig(feature: AIFeature): Promise<void> {
  try {
    const response = await apiClient.resetFeatureConfig(feature);
    if (!response.success) {
      console.error(`Failed to reset feature config for ${feature}:`, response.error);
    }
    invalidateCache();
    // Reload cache after update
    await loadFeatureConfigs();
  } catch (error) {
    console.error(`Failed to reset feature config for ${feature}:`, error);
  }
}

export async function resetAllFeatureConfigs(): Promise<void> {
  const features: AIFeature[] = [
    'parseTask',
    'breakdownTask',
    'priorityAdvisor',
    'effortEstimation',
    'taskCategorization',
    'dependencyDetection',
    'projectHealth',
    'projectTaskGen',
    'projectRisk',
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
  ];

  await Promise.all(features.map((feature) => resetFeatureConfig(feature)));
}

export async function getConfiguredProviders(): Promise<LLMProvider[]> {
  // Backend now manages API keys, so we can't detect configured keys client-side.
  // Expose all supported providers to allow selection.
  return Object.keys(PROVIDER_DISPLAY_NAMES) as LLMProvider[];
}

export async function setAllFeaturesToProvider(provider: LLMProvider): Promise<void> {
  const features: AIFeature[] = [
    'parseTask',
    'breakdownTask',
    'priorityAdvisor',
    'effortEstimation',
    'taskCategorization',
    'dependencyDetection',
    'projectHealth',
    'projectTaskGen',
    'projectRisk',
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
  ];

  const defaultModel = getDefaultModel(provider);

  await Promise.all(features.map((feature) => setFeatureConfig(feature, provider, defaultModel)));
}

export async function setCostOptimizedMix(): Promise<void> {
  await Promise.all([
    setFeatureConfig('parseTask', 'anthropic', 'claude-3-5-haiku-20241022'),
    setFeatureConfig('breakdownTask', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('priorityAdvisor', 'anthropic', 'claude-3-5-haiku-20241022'),
    setFeatureConfig('effortEstimation', 'anthropic', 'claude-3-5-haiku-20241022'),
    setFeatureConfig('taskCategorization', 'anthropic', 'claude-3-5-haiku-20241022'),
    setFeatureConfig('dependencyDetection', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('projectHealth', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('projectTaskGen', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('projectRisk', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('goalRefinement', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('successCriteriaGen', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('metricSuggestions', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('goalCascade', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('achievementForecast', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('goalConflict', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('goalProgress', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('metricPatterns', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('metricAnomalies', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('metricCorrelations', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('metricTargets', 'anthropic', 'claude-3-5-haiku-20241022'),
    setFeatureConfig('metricHealth', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('habitDesign', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('habitStack', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('streakRecovery', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('habitPatterns', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('triggerOptimization', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('habitGoalAlignment', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('reflectionPrompts', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('dailyDigest', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('logbookPatterns', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('sentimentAnalysis', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('weeklyReview', 'anthropic', 'claude-3-5-sonnet-20241022'),
    setFeatureConfig('connectionSuggestions', 'anthropic', 'claude-3-5-haiku-20241022'),
  ]);
}
