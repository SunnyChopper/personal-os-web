import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Camera, Mic } from 'lucide-react';
import type { Metric, MetricLog, CreateMetricLogInput } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { predictTrajectory, getTrendData } from '@/utils/metric-analytics';

interface MetricLogFormProps {
  metric: Metric;
  logs: MetricLog[];
  onSubmit: (input: CreateMetricLogInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MetricLogForm({
  metric,
  logs,
  onSubmit,
  onCancel,
  isLoading = false,
}: MetricLogFormProps) {
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [contextTags, setContextTags] = useState<{
    energy?: number;
    stress?: number;
    mood?: string;
  }>({});

  const latestLog = logs.length > 0 ? logs[0] : null;

  // AI prediction for next value
  const prediction = useMemo(() => {
    if (logs.length < 3) return null;
    return predictTrajectory(logs, 1);
  }, [logs]);

  const trend = useMemo(() => {
    if (logs.length < 2) return null;
    return getTrendData(logs, metric);
  }, [logs, metric]);

  // Smart suggestions
  const suggestions = useMemo(() => {
    if (!latestLog) return [];
    const suggestions = [];
    suggestions.push({
      label: 'Same as yesterday',
      value: latestLog.value,
      icon: Minus,
    });
    if (trend && trend.velocity > 0) {
      const slightIncrease = latestLog.value * 1.05;
      suggestions.push({
        label: 'Slight increase',
        value: slightIncrease,
        icon: TrendingUp,
      });
    }
    if (trend && trend.velocity < 0) {
      const slightDecrease = latestLog.value * 0.95;
      suggestions.push({
        label: 'Slight decrease',
        value: slightDecrease,
        icon: TrendingDown,
      });
    }
    if (prediction) {
      suggestions.push({
        label: 'AI predicted',
        value: prediction.futureValue,
        icon: TrendingUp,
      });
    }
    return suggestions;
  }, [latestLog, trend, prediction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    onSubmit({
      metricId: metric.id,
      value: numValue,
      notes: notes || undefined,
      loggedAt: new Date().toISOString(),
    });
  };

  const unit = metric.unit === 'custom' ? metric.customUnit || '' : metric.unit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Value Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Value ({unit})
        </label>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={latestLog ? latestLog.value.toString() : 'Enter value'}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoFocus
        />

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setValue(suggestion.value.toFixed(metric.unit === 'dollars' ? 0 : 1))
                  }
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                >
                  <suggestion.icon className="w-3 h-3" />
                  {suggestion.label}: {suggestion.value.toFixed(metric.unit === 'dollars' ? 0 : 1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Prediction */}
        {prediction && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
              AI Prediction
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Predicted next value:{' '}
              {prediction.futureValue.toFixed(metric.unit === 'dollars' ? 0 : 1)} {unit}
              <span className="text-xs ml-2">
                (Confidence: {(prediction.confidence * 100).toFixed(0)}%)
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any context or notes about this value..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Context Tags (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Context (optional)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Energy Level
            </label>
            <select
              value={contextTags.energy || ''}
              onChange={(e) =>
                setContextTags({
                  ...contextTags,
                  energy: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not set</option>
              <option value="1">Very Low</option>
              <option value="2">Low</option>
              <option value="3">Medium</option>
              <option value="4">High</option>
              <option value="5">Very High</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Stress Level
            </label>
            <select
              value={contextTags.stress || ''}
              onChange={(e) =>
                setContextTags({
                  ...contextTags,
                  stress: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not set</option>
              <option value="1">Very Low</option>
              <option value="2">Low</option>
              <option value="3">Medium</option>
              <option value="4">High</option>
              <option value="5">Very High</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Mood</label>
            <select
              value={contextTags.mood || ''}
              onChange={(e) =>
                setContextTags({ ...contextTags, mood: e.target.value || undefined })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not set</option>
              <option value="great">Great</option>
              <option value="good">Good</option>
              <option value="okay">Okay</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photo/Voice (Placeholder for mobile) */}
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
          disabled
        >
          <Camera className="w-4 h-4" />
          Photo (Mobile)
        </button>
        <button
          type="button"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
          disabled
        >
          <Mic className="w-4 h-4" />
          Voice (Mobile)
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading || !value}>
          {isLoading ? 'Logging...' : 'Log Value'}
        </Button>
      </div>
    </form>
  );
}
