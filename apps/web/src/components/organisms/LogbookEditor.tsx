import { useState, useEffect } from 'react';
import { Smile, Meh, Frown, Loader2 } from 'lucide-react';
import type {
  LogbookEntry,
  CreateLogbookEntryInput,
  UpdateLogbookEntryInput,
  LogbookMood,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { parseDateInput } from '@/utils/date-formatters';

interface LogbookEditorProps {
  entry?: LogbookEntry;
  defaultDate?: string;
  onSubmit: (input: CreateLogbookEntryInput | UpdateLogbookEntryInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MOODS: { value: LogbookMood; label: string; icon: typeof Smile }[] = [
  { value: 'High', label: 'High', icon: Smile },
  { value: 'Steady', label: 'Steady', icon: Meh },
  { value: 'Low', label: 'Low', icon: Frown },
];

// Helper to get local date string YYYY-MM-DD
// Uses parseDateInput to ensure consistent date handling
const getLocalDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to extract YYYY-MM-DD from date string, handling both ISO format and plain date strings
// This prevents timezone conversion issues when the backend returns ISO strings
// IMPORTANT: Never create Date objects that could cause timezone shifts - always extract the string directly
const extractDateOnly = (dateString: string): string => {
  // If already in YYYY-MM-DD format, return as-is (most common case)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // If it's an ISO string (contains 'T'), extract just the date part before 'T'
  // This is safe because we're extracting the string directly, not parsing as a Date
  if (dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    // Verify it's a valid YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }

  // Try to extract YYYY-MM-DD from the beginning of the string
  // This handles cases like "2026-01-25T00:00:00.000Z" or "2026-01-25 00:00:00"
  const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch && dateMatch[1]) {
    return dateMatch[1];
  }

  // If we can't extract a valid date, use parseDateInput as a last resort
  // This handles edge cases where the date might be in a different format
  try {
    const parsedDate = parseDateInput(dateString);
    // Use local date components to avoid timezone shifts
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Could not extract YYYY-MM-DD from date string:', dateString, error);
    return dateString;
  }
};

export function LogbookEditor({
  entry,
  defaultDate,
  onSubmit,
  onCancel,
  isLoading,
}: LogbookEditorProps) {
  // Initialize form data - dates should already be normalized by the service layer
  const getInitialDate = () => {
    if (entry?.date) {
      // Double-check normalization (defense in depth)
      return extractDateOnly(entry.date);
    }
    if (defaultDate) {
      return extractDateOnly(defaultDate);
    }
    return getLocalDateString();
  };

  const [formData, setFormData] = useState<CreateLogbookEntryInput>({
    date: getInitialDate(),
    title: entry?.title || '',
    notes: entry?.notes || '',
    mood: entry?.mood || undefined,
    energy: entry?.energy ?? undefined,
  });

  // Update form data when entry prop changes
  // This is necessary to sync form state when editing different entries
  useEffect(() => {
    if (entry) {
      setFormData({
        date: extractDateOnly(entry.date),
        title: entry.title || '',
        notes: entry.notes || '',
        mood: entry.mood || undefined,
        energy: entry.energy ?? undefined,
      });
    } else if (defaultDate) {
      setFormData((prev) => ({
        ...prev,
        date: extractDateOnly(defaultDate),
      }));
    }
  }, [entry, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Normalize the date to ensure it's in YYYY-MM-DD format
    // This prevents timezone conversion issues
    const normalizedDate = extractDateOnly(formData.date);

    if (entry) {
      // For updates, include the normalized date to fix any timezone-shifted dates
      // This ensures the backend uses the correct date from the form
      const updateData: UpdateLogbookEntryInput = {
        date: normalizedDate, // Include date to fix timezone issues
        title: formData.title || undefined,
        notes: formData.notes || undefined,
        mood: formData.mood,
        energy: formData.energy,
      };
      // Remove undefined values to keep the request clean
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof UpdateLogbookEntryInput] === undefined) {
          delete updateData[key as keyof UpdateLogbookEntryInput];
        }
      });
      onSubmit(updateData);
    } else {
      // For creates, include the normalized date
      const createData: CreateLogbookEntryInput = {
        date: normalizedDate,
        title: formData.title || undefined,
        notes: formData.notes || undefined,
        mood: formData.mood,
        energy: formData.energy,
      };
      onSubmit(createData);
    }
  };

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto rounded-lg"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {entry ? 'Saving changes...' : 'Creating entry...'}
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={isLoading}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => {
              // Normalize the date value immediately to prevent timezone issues
              const dateValue = e.target.value;
              const normalizedDate = extractDateOnly(dateValue);
              setFormData({ ...formData, date: normalizedDate });
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional title for today..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mood
          </label>
          <div className="flex gap-3">
            {MOODS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData({ ...formData, mood: value })}
                className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-lg border-2 transition-all ${
                  formData.mood === value
                    ? value === 'High'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : value === 'Steady'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Icon
                  className={`w-8 h-8 ${
                    formData.mood === value
                      ? value === 'High'
                        ? 'text-green-600 dark:text-green-400'
                        : value === 'Steady'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.mood === value
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Energy Level
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.energy ?? 5}
              onChange={(e) => setFormData({ ...formData, energy: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">
              {formData.energy ?? 5}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What happened today? What are you grateful for? What did you learn?"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading
              ? entry
                ? 'Saving...'
                : 'Creating...'
              : entry
                ? 'Save Changes'
                : 'Create Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
}
