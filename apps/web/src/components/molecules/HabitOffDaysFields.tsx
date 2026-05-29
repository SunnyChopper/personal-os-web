import { useState } from 'react';
import { HABIT_OFF_WEEKDAY_OPTIONS } from '@/constants/growth-system';
import type { HabitWeekdayCode } from '@/utils/habit-off-days';

export interface HabitOffDaysValue {
  offDaysOfWeek: HabitWeekdayCode[];
  offDates: string[];
}

interface HabitOffDaysFieldsProps {
  value: HabitOffDaysValue;
  onChange: (value: HabitOffDaysValue) => void;
}

export function HabitOffDaysFields({ value, onChange }: HabitOffDaysFieldsProps) {
  const [dateInput, setDateInput] = useState('');

  const toggleWeekday = (code: HabitWeekdayCode) => {
    const next = value.offDaysOfWeek.includes(code)
      ? value.offDaysOfWeek.filter((d) => d !== code)
      : [...value.offDaysOfWeek, code];
    onChange({ ...value, offDaysOfWeek: next });
  };

  const addDate = () => {
    if (!dateInput || value.offDates.includes(dateInput)) return;
    onChange({ ...value, offDates: [...value.offDates, dateInput].sort() });
    setDateInput('');
  };

  const removeDate = (date: string) => {
    onChange({ ...value, offDates: value.offDates.filter((d) => d !== date) });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/30">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Off days</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Scheduled off days are skipped for streaks and excluded from completion metrics.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Every week (recurring)
        </p>
        <div className="flex flex-wrap gap-2">
          {HABIT_OFF_WEEKDAY_OPTIONS.map(({ code, label }) => {
            const selected = value.offDaysOfWeek.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleWeekday(code)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                }`}
                aria-pressed={selected}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Specific dates</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <button
            type="button"
            onClick={addDate}
            disabled={!dateInput}
            className="px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {value.offDates.length > 0 && (
          <ul className="mt-2 space-y-1">
            {value.offDates.map((date) => (
              <li
                key={date}
                className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
              >
                <span>{date}</span>
                <button
                  type="button"
                  onClick={() => removeDate(date)}
                  className="text-red-600 dark:text-red-400 text-xs hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
