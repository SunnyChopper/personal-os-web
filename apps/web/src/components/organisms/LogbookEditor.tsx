import { useState, useEffect } from 'react';
import { Smile, Meh, Frown, Loader2, Sparkles } from 'lucide-react';
import type {
  LogbookEntry,
  CreateLogbookEntryInput,
  UpdateLogbookEntryInput,
  LogbookMood,
  LogbookLinkedEntity,
  LogbookEntityLinkSuggestion,
  Project,
  Goal,
} from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { parseDateInput } from '@/utils/date-formatters';
import { Textarea } from '@/components/atoms/Textarea';
import { projectsService } from '@/services/growth-system/projects.service';
import { goalsService } from '@/services/growth-system/goals.service';
import { LogbookLinkSuggestionsPanel } from '@/components/molecules/LogbookLinkSuggestionsPanel';
import { LogbookLinkedEntityAreaPicker } from '@/components/molecules/LogbookLinkedEntityAreaPicker';
import { useLogbookLinkSuggestions } from '@/hooks/growth-system/useLogbookLinkSuggestions';
import {
  filterLinkableGoals,
  filterLinkableProjects,
} from '@/lib/growth-system/logbook-linkable-entities';

interface LogbookEditorProps {
  entry?: LogbookEntry;
  defaultDate?: string;
  defaultTitle?: string;
  defaultNotes?: string;
  defaultLinkedEntities?: LogbookLinkedEntity[];
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
  defaultTitle,
  defaultNotes,
  defaultLinkedEntities,
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
    title: entry?.title || defaultTitle || '',
    notes: entry?.notes || defaultNotes || '',
    mood: entry?.mood || undefined,
    energy: entry?.energy ?? undefined,
    linkedEntities: entry?.linkedEntities || defaultLinkedEntities || [],
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hasRequestedSuggestions, setHasRequestedSuggestions] = useState(false);
  const { suggestLinks, suggestions, isSuggesting, resetSuggestions } = useLogbookLinkSuggestions();

  const notesText = formData.notes?.trim() ?? '';
  const linkableProjects = filterLinkableProjects(projects);
  const linkableGoals = filterLinkableGoals(goals);
  const showLinkingSection = linkableProjects.length > 0 || linkableGoals.length > 0;

  useEffect(() => {
    let cancelled = false;
    Promise.all([projectsService.getAll(), goalsService.getAll()])
      .then(([projectRes, goalRes]) => {
        if (cancelled) return;
        if (projectRes.success) setProjects(projectRes.data ?? []);
        if (goalRes.success) setGoals(goalRes.data ?? []);
      })
      .catch(() => {
        /* optional picker — ignore load errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLinkedEntity = (entity: LogbookLinkedEntity) => {
    setFormData((prev) => {
      const current = prev.linkedEntities || [];
      const exists = current.some(
        (row) => row.entityType === entity.entityType && row.entityId === entity.entityId
      );
      return {
        ...prev,
        linkedEntities: exists
          ? current.filter(
              (row) => !(row.entityType === entity.entityType && row.entityId === entity.entityId)
            )
          : [...current, entity],
      };
    });
  };

  const toggleSuggestionLink = (suggestion: LogbookEntityLinkSuggestion) => {
    toggleLinkedEntity({
      entityType: suggestion.entityType,
      entityId: suggestion.entityId,
      entityName: suggestion.title,
    });
  };

  const handleSuggestLinks = async () => {
    if (!notesText) return;
    setHasRequestedSuggestions(true);
    const excludeEntities = (formData.linkedEntities ?? [])
      .filter((row) => row.entityType === 'project' || row.entityType === 'goal')
      .map((row) => ({
        entityType: row.entityType as 'project' | 'goal',
        entityId: row.entityId,
      }));
    await suggestLinks({
      notes: notesText,
      title: formData.title || undefined,
      mood: formData.mood,
      energy: formData.energy,
      limit: 3,
      useCache: true,
      excludeEntities,
    });
  };

  useEffect(() => {
    if (!notesText) {
      setHasRequestedSuggestions(false);
      resetSuggestions();
    }
  }, [notesText, resetSuggestions]);

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
        linkedEntities: entry.linkedEntities || [],
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
      // PATCH body must not include date — Dynamo SK is LOGBOOK#{date}; GET normalizes display.
      const updateData: UpdateLogbookEntryInput = {
        title: formData.title || undefined,
        notes: formData.notes || undefined,
        mood: formData.mood,
        energy: formData.energy,
        linkedEntities: formData.linkedEntities,
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
        linkedEntities: formData.linkedEntities,
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

      <form onSubmit={handleSubmit} aria-busy={isLoading}>
        <fieldset
          disabled={isLoading}
          className="min-w-0 space-y-6 border-0 p-0 m-0 disabled:opacity-60"
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
              disabled={Boolean(entry)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What happened today? What are you grateful for? What did you learn?"
            />
          </div>

          {showLinkingSection && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Link to projects or goals
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!notesText || isSuggesting}
                  onClick={() => void handleSuggestLinks()}
                >
                  {isSuggesting ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-4 w-4 text-violet-500" />
                  )}
                  Suggest links
                </Button>
              </div>

              <LogbookLinkSuggestionsPanel
                suggestions={suggestions}
                linkedEntities={formData.linkedEntities}
                isLoading={isSuggesting}
                hasRequested={hasRequestedSuggestions}
                onToggle={toggleSuggestionLink}
              />

              <LogbookLinkedEntityAreaPicker
                projects={projects}
                goals={goals}
                linkedEntities={formData.linkedEntities}
                onToggle={toggleLinkedEntity}
              />
            </div>
          )}

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
        </fieldset>
      </form>
    </div>
  );
}
