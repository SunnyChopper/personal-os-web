import { FeatureProviderSelector } from './FeatureProviderSelector';
import { setAllFeaturesToProvider, setCostOptimizedMix } from '@/lib/llm';

export function AISettingsPanel() {
  const handleQuickPreset = async (preset: 'anthropic' | 'openai' | 'cost-optimized') => {
    if (preset === 'cost-optimized') {
      await setCostOptimizedMix();
    } else {
      await setAllFeaturesToProvider(preset);
    }
    alert('Preset applied successfully! Check the Feature Configuration below to see changes.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          AI Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure which AI providers to use for different features. API keys are managed by the
          backend via AWS Secrets Manager.
        </p>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Quick Presets
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          Apply a preset configuration to all features:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickPreset('anthropic')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm"
          >
            All Anthropic
          </button>
          <button
            onClick={() => handleQuickPreset('openai')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm"
          >
            All OpenAI
          </button>
          <button
            onClick={() => handleQuickPreset('cost-optimized')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm"
          >
            Cost-Optimized Mix
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <FeatureProviderSelector />
      </div>
    </div>
  );
}
