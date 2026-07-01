import { useState } from 'react';
import type {
  CreateMetricInput,
  Area,
  SubCategory,
  MetricUnit,
  MetricDirection,
  MetricSource,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { MetricCoreFormFields } from '@/components/molecules/MetricCoreFormFields';
import { AREAS, METRIC_DIRECTIONS, METRIC_SOURCES, METRIC_UNITS } from '@/constants/growth-system';
import { Select } from '@/components/atoms/Select';

interface MetricCreateFormProps {
  onSubmit: (input: CreateMetricInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MetricCreateForm({ onSubmit, onCancel, isLoading }: MetricCreateFormProps) {
  const [formData, setFormData] = useState<CreateMetricInput>({
    name: '',
    description: '',
    area: 'Health',
    unit: 'count',
    direction: 'Higher',
    source: 'Manual',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset
        disabled={isLoading}
        className="min-w-0 space-y-6 border-0 p-0 m-0 disabled:opacity-60"
      >
        <MetricCoreFormFields
          values={{ name: formData.name, description: formData.description }}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Area *
            </label>
            <Select
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value as Area })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sub-Category
            </label>
            <input
              type="text"
              value={formData.subCategory || ''}
              onChange={(e) =>
                setFormData({ ...formData, subCategory: e.target.value as SubCategory })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit *
            </label>
            <Select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as MetricUnit })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {METRIC_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </div>

          {formData.unit === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Unit *
              </label>
              <input
                type="text"
                value={formData.customUnit || ''}
                onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., cups"
                required
              />
            </div>
          )}

          {formData.unit !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Direction *
              </label>
              <Select
                value={formData.direction}
                onChange={(e) =>
                  setFormData({ ...formData, direction: e.target.value as MetricDirection })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {METRIC_DIRECTIONS.map((direction) => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Value
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.targetValue || ''}
              onChange={(e) =>
                setFormData({ ...formData, targetValue: parseFloat(e.target.value) || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional target"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source *
            </label>
            <Select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as MetricSource })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {METRIC_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Low Threshold
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.thresholdLow || ''}
              onChange={(e) =>
                setFormData({ ...formData, thresholdLow: parseFloat(e.target.value) || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              High Threshold
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.thresholdHigh || ''}
              onChange={(e) =>
                setFormData({ ...formData, thresholdHigh: parseFloat(e.target.value) || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Metric'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
