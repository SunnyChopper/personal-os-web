import { useState } from 'react';
import { TrendingUp, Target, Check, ArrowRight } from 'lucide-react';
import type { CreateMetricInput } from '@/types/growth-system';
import Button from '@/components/atoms/Button';

interface MetricOnboardingProps {
  onComplete: () => void;
  onCreateMetric: (input: CreateMetricInput) => void;
}

const EXAMPLE_METRICS = [
  {
    name: 'Weekly Running Miles',
    description: 'Track your weekly running distance',
    area: 'Health' as const,
    unit: 'count' as const,
    direction: 'Higher' as const,
    targetValue: 20,
  },
  {
    name: 'Daily Meditation Minutes',
    description: 'Minutes of meditation practice per day',
    area: 'Health' as const,
    unit: 'minutes' as const,
    direction: 'Higher' as const,
    targetValue: 15,
  },
  {
    name: 'Body Weight',
    description: 'Track your body weight',
    area: 'Health' as const,
    unit: 'pounds' as const,
    direction: 'Lower' as const,
    targetValue: 170,
  },
];

export function MetricOnboarding({ onComplete, onCreateMetric }: MetricOnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <TrendingUp className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Metrics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track what matters most to your personal growth
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Example Metrics
          </h3>
          <div className="space-y-3">
            {EXAMPLE_METRICS.map((example, index) => (
              <button
                key={index}
                onClick={() => setSelectedExample(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedExample === index
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{example.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {example.description}
                    </p>
                  </div>
                  {selectedExample === index && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onComplete}>
            Skip
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (selectedExample !== null) {
                onCreateMetric(EXAMPLE_METRICS[selectedExample]);
              }
              setStep(1);
            }}
            disabled={selectedExample === null}
          >
            Create Metric
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <Target className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">You're all set!</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start logging values to track your progress
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Next Steps</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Log your first value</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click "Log Value" on your metric card to record your first measurement
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Track consistently</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Log values regularly to see trends and unlock achievements
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Explore insights</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use AI insights to discover patterns and get recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onComplete}>
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
