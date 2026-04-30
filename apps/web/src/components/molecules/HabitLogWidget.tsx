import { useState } from 'react';
import type { Habit, CreateHabitLogInput } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { toLocalDateTimeString, fromLocalDateTimeString } from '@/utils/date-formatters';

interface HabitLogWidgetProps {
  habit: Habit;
  onSubmit: (input: CreateHabitLogInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function HabitLogWidget({ habit, onSubmit, onCancel, isLoading }: HabitLogWidgetProps) {
  const [formData, setFormData] = useState<CreateHabitLogInput>({
    habitId: habit.id,
    completedAt: new Date().toISOString(),
    amount: habit.dailyTarget || 1,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Habit
        </label>
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{habit.name}</p>
          {habit.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{habit.description}</p>
          )}
        </div>
      </div>

      {habit.habitType !== 'Quit' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData.amount || 1}
            onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {habit.dailyTarget && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Daily target: {habit.dailyTarget}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date & Time
        </label>
        <input
          type="datetime-local"
          value={toLocalDateTimeString(formData.completedAt)}
          onChange={(e) =>
            setFormData({
              ...formData,
              completedAt: fromLocalDateTimeString(e.target.value),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Logging...' : 'Log Completion'}
        </Button>
      </div>
    </form>
  );
}
