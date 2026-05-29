import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search, Repeat, Calendar, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Habit,
  HabitLog,
  CreateHabitInput,
  UpdateHabitInput,
  CreateHabitLogInput,
  HabitType,
  Goal,
} from '@/types/growth-system';
import type { EstablishedHabitSuggestedPatch } from '@/types/habit-ai';
import { habitsService } from '@/services/growth-system/habits.service';
import { goalsService } from '@/services/growth-system/goals.service';
import { useHabits } from '@/hooks/useGrowthSystem';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/atoms/Button';
import { HabitCard } from '@/components/molecules/HabitCard';
import { HabitCardSkeleton } from '@/components/molecules/HabitCardSkeleton';
import { HabitLogWidget } from '@/components/molecules/HabitLogWidget';
import { HabitCreateForm } from '@/components/organisms/HabitCreateForm';
import { HabitEditForm } from '@/components/organisms/HabitEditForm';
import Dialog from '@/components/molecules/Dialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { AIHabitAssistPanel } from '@/components/molecules/AIHabitAssistPanel';
import { llmConfig } from '@/lib/llm';
import { HabitStatsDashboard } from '@/components/molecules/HabitStatsDashboard';
import { HabitCalendarHeatmap } from '@/components/molecules/HabitCalendarHeatmap';
import { CompletionRateChart } from '@/components/molecules/CompletionRateChart';
import { HabitCalendarView } from '@/components/molecules/HabitCalendarView';
import { WeeklyMonthlyComparison } from '@/components/molecules/WeeklyMonthlyComparison';
import { HabitDetailHeader } from '@/components/molecules/HabitDetailHeader';
import { HabitDetailTabs, type HabitDetailTab } from '@/components/molecules/HabitDetailTabs';
import { FloatingLogButton } from '@/components/molecules/FloatingLogButton';
import { DateDetailModal } from '@/components/molecules/DateDetailModal';
import { LinkedGoalsDisplay } from '@/components/molecules/LinkedGoalsDisplay';
import {
  formatCompletionDate,
  getHabitLogCalendarDay,
  parseHabitCompletionConflictDate,
  toLocalDateKey,
} from '@/utils/date-formatters';
import { getAllStreaks, getLogsForDateRange } from '@/utils/habit-analytics';
import { streakProtectedDatesForHabit } from '@/utils/habit-off-days';
import { buildHabitCompletionToasts } from '@/lib/habit-completion-feedback';

type ViewMode = 'today' | 'all';

const HABIT_TYPES: HabitType[] = ['Build', 'Maintain', 'Reduce', 'Quit'];

// Animation variants for staggered list
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

export default function HabitsPage() {
  // Use React Query hook to prevent duplicate fetches
  const {
    habits,
    isLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    logCompletion,
    updateCompletionNote,
  } = useHabits();
  const { showToast, ToastContainer } = useToast();
  const [habitLogs, setHabitLogs] = useState<Map<string, HabitLog[]>>(new Map());
  const [linkedGoals, setLinkedGoals] = useState<Map<string, Goal[]>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [selectedHabitType, setSelectedHabitType] = useState<HabitType | null>(null);
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [habitToLog, setHabitToLog] = useState<Habit | null>(null);
  /** Bump when opening the log dialog so the widget remounts with fresh defaults */
  const [logDialogKey, setLogDialogKey] = useState(0);
  const [logDialogDefaultDate, setLogDialogDefaultDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [logConflict, setLogConflict] = useState<{
    input: CreateHabitLogInput;
    completionDate: string;
    existingNote: string | null;
  } | null>(null);

  const [showAIAssist, setShowAIAssist] = useState(false);
  const [todaySummary, setTodaySummary] = useState<{
    completedCount: number;
    pendingCount: number;
    totalHabits: number;
  } | null>(null);
  const isAIConfigured = llmConfig.isConfigured();
  const [activeTab, setActiveTab] = useState<HabitDetailTab>('overview');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [activityView, setActivityView] = useState<'heatmap' | 'calendar'>('heatmap');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadLinkedGoals = async (habit: Habit) => {
    if (!habit.goalIds || habit.goalIds.length === 0) {
      if (isMountedRef.current) {
        setLinkedGoals((prev) => new Map(prev).set(habit.id, []));
      }
      return;
    }

    try {
      const allGoalsResponse = await goalsService.getAll();
      if (allGoalsResponse.success && allGoalsResponse.data && isMountedRef.current) {
        const goals = allGoalsResponse.data.filter((g: Goal) => habit.goalIds?.includes(g.id));
        setLinkedGoals((prev) => new Map(prev).set(habit.id, goals));
      }
    } catch (error) {
      console.error('Failed to load linked goals:', error);
    }
  };

  // Load linked goals when habits are loaded
  useEffect(() => {
    if (habits.length > 0) {
      habits.forEach((habit) => {
        if (!linkedGoals.has(habit.id)) {
          loadLinkedGoals(habit);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  // Update selectedHabit when habits list changes (e.g., after update)
  useEffect(() => {
    if (selectedHabit) {
      const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
      if (updatedHabit && updatedHabit !== selectedHabit) {
        setSelectedHabit(updatedHabit);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  const loadHabitLogs = async (habitId: string, options?: { throwOnError?: boolean }) => {
    try {
      const response = await habitsService.getLogsByHabit(habitId, {
        sortBy: 'completedAt',
        sortOrder: 'desc',
      });
      if (response.success && response.data && isMountedRef.current) {
        setHabitLogs((prev) => new Map(prev).set(habitId, response.data!));
        return;
      }
      const message = 'Failed to refresh completion history';
      if (options?.throwOnError) {
        throw new Error(message);
      }
      console.error(message);
    } catch (error) {
      if (options?.throwOnError) {
        throw error instanceof Error ? error : new Error('Failed to refresh completion history');
      }
      console.error('Failed to load habit logs:', error);
    }
  };

  const handleCreateHabit = async (input: CreateHabitInput) => {
    setIsSubmitting(true);
    try {
      const response = await createHabit(input);
      if (response.success && response.data) {
        setIsCreateDialogOpen(false);
        // React Query will automatically refetch and update the habits list
      }
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHabit = async (id: string, input: UpdateHabitInput) => {
    setIsSubmitting(true);
    try {
      const response = await updateHabit({ id, input });
      if (response.success && response.data) {
        if (selectedHabit && selectedHabit.id === id) {
          setSelectedHabit(response.data);
        }
        setIsEditDialogOpen(false);
        // React Query will automatically refetch and update the habits list
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!habitToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await deleteHabit(habitToDelete.id);
      if (response.success) {
        if (selectedHabit && selectedHabit.id === habitToDelete.id) {
          setSelectedHabit(null);
        }
        setHabitToDelete(null);
        // React Query will automatically refetch and update the habits list
      }
    } catch (error) {
      console.error('Failed to delete habit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogCompletion = async (input: CreateHabitLogInput) => {
    setIsSubmitting(true);
    try {
      const response = await logCompletion(input);
      if (response.success && response.data) {
        await loadHabitLogs(input.habitId);
        const completionDate =
          input.completedAt && /^\d{4}-\d{2}-\d{2}$/.test(input.completedAt)
            ? input.completedAt
            : input.completedAt
              ? getHabitLogCalendarDay(input.completedAt)
              : toLocalDateKey(new Date());
        const matchedLog = response.data.logs?.find(
          (log) => getHabitLogCalendarDay(log.completedAt) === completionDate
        );
        const points = matchedLog?.pointsAwarded ?? 0;
        const milestone = matchedLog?.milestoneBonus ?? 0;
        const streak = response.data.currentStreak ?? getStreak(input.habitId);
        const toasts = buildHabitCompletionToasts(points, milestone, streak);
        if (toasts.points) {
          showToast({ type: 'success', ...toasts.points });
        }
        if (toasts.milestone) {
          showToast({ type: 'success', ...toasts.milestone });
        }
        closeLogDialog();
        return;
      }

      if (response.error?.code === 'CONFLICT') {
        const completionDate =
          parseHabitCompletionConflictDate(response.error.message ?? '') ??
          (input.completedAt
            ? getHabitLogCalendarDay(input.completedAt)
            : toLocalDateKey(new Date()));
        const existing = (habitLogs.get(input.habitId) ?? []).find(
          (log) => getHabitLogCalendarDay(log.completedAt) === completionDate
        );
        setLogConflict({
          input,
          completionDate,
          existingNote: existing?.notes ?? null,
        });
        closeLogDialog();
        return;
      }

      console.error('Failed to log habit:', response.error?.message);
    } catch (error) {
      console.error('Failed to log habit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConflictReplace = async () => {
    if (!logConflict) return;
    setIsSubmitting(true);
    try {
      const note = logConflict.input.notes?.trim() || null;
      const response = await updateCompletionNote({
        habitId: logConflict.input.habitId,
        completionDate: logConflict.completionDate,
        note,
      });
      if (response.success) {
        await loadHabitLogs(logConflict.input.habitId);
        setLogConflict(null);
      }
    } catch (error) {
      console.error('Failed to replace habit completion note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConflictAppend = async () => {
    if (!logConflict) return;
    const newText = logConflict.input.notes?.trim();
    if (!newText) {
      setLogConflict(null);
      return;
    }

    setIsSubmitting(true);
    try {
      let existingNote = logConflict.existingNote;
      if (existingNote === null) {
        const logsResponse = await habitsService.getLogsByHabit(logConflict.input.habitId, {
          startDate: logConflict.completionDate,
          endDate: logConflict.completionDate,
        });
        existingNote = logsResponse.data?.[0]?.notes ?? null;
      }

      const merged = existingNote ? `${existingNote}\n\n${newText}` : newText;
      const response = await updateCompletionNote({
        habitId: logConflict.input.habitId,
        completionDate: logConflict.completionDate,
        note: merged,
      });
      if (response.success) {
        await loadHabitLogs(logConflict.input.habitId);
        setLogConflict(null);
      }
    } catch (error) {
      console.error('Failed to append habit completion note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHabitClick = (habit: Habit) => {
    setSelectedHabit(habit);
    // Load logs only when viewing habit detail
    loadHabitLogs(habit.id);
    // Ensure linked goals are loaded for this habit
    if (!linkedGoals.has(habit.id)) {
      loadLinkedGoals(habit);
    }
  };

  const handleBackToGrid = () => {
    setSelectedHabit(null);
  };

  const handleQuickLog = (habit: Habit, date?: Date) => {
    setHabitToLog(habit);
    setLogDialogDefaultDate(date);
    setLogDialogKey((k) => k + 1);
    setIsLogDialogOpen(true);
  };

  const closeLogDialog = () => {
    setIsLogDialogOpen(false);
    setHabitToLog(null);
    setLogDialogDefaultDate(undefined);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDateModalOpen(true);
  };

  const handleDateModalLog = (date: Date) => {
    if (selectedHabit) {
      handleQuickLog(selectedHabit, date);
      setIsDateModalOpen(false);
    }
  };

  const getStreak = (habitId: string): number => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit?.currentStreak != null) {
      return habit.currentStreak;
    }
    const logs = habitLogs.get(habitId) || [];
    if (logs.length === 0) return 0;
    const protectedDates = habit ? streakProtectedDatesForHabit(habit) : undefined;
    return getAllStreaks(logs, protectedDates).current;
  };

  const isTodayCompleted = (habitId: string): boolean => {
    // Only check if logs are loaded for this habit
    const logs = habitLogs.get(habitId) || [];
    if (logs.length === 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = toLocalDateKey(today);

    return logs.some((log) => getHabitLogCalendarDay(log.completedAt) === todayKey);
  };

  const getTodayProgress = (habitId: string): number => {
    // Only calculate if logs are loaded for this habit
    const logs = habitLogs.get(habitId) || [];
    if (logs.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = toLocalDateKey(today);

    return logs
      .filter((log) => getHabitLogCalendarDay(log.completedAt) === todayKey)
      .reduce((sum, log) => sum + (log.amount || 1), 0);
  };

  const getWeeklyProgress = (habitId: string): number => {
    // Only calculate if logs are loaded for this habit
    const logs = habitLogs.get(habitId) || [];
    if (logs.length === 0) return 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get Monday of current week
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    // Get Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return logs
      .filter((log) => {
        const logKey = getHabitLogCalendarDay(log.completedAt);
        const mondayKey = toLocalDateKey(monday);
        const sundayKey = toLocalDateKey(sunday);
        return logKey >= mondayKey && logKey <= sundayKey;
      })
      .reduce((sum, log) => sum + (log.amount || 1), 0);
  };

  const getTotalCompletions = (habitId: string): number => {
    // Only calculate if logs are loaded for this habit
    const logs = habitLogs.get(habitId) || [];
    if (logs.length === 0) return 0;
    return logs.reduce((sum, log) => sum + (log.amount || 1), 0);
  };

  const getLastCompletedDate = (habitId: string): string | null => {
    // Only calculate if logs are loaded for this habit
    const logs = habitLogs.get(habitId) || [];
    if (logs.length === 0) return null;
    const sortedLogs = [...logs].sort((a, b) =>
      getHabitLogCalendarDay(b.completedAt).localeCompare(getHabitLogCalendarDay(a.completedAt))
    );
    return sortedLogs[0].completedAt;
  };

  // Load habit logs for all habits to enable stats display
  useEffect(() => {
    if (habits.length > 0) {
      habits.forEach((habit) => {
        if (!habitLogs.has(habit.id)) {
          loadHabitLogs(habit.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  useEffect(() => {
    if (viewMode !== 'today') return;
    let cancelled = false;
    habitsService
      .getTodaySummary()
      .then((response) => {
        if (!cancelled && response.success && response.data) {
          setTodaySummary({
            completedCount: response.data.completedCount,
            pendingCount: response.data.pendingCount,
            totalHabits: response.data.totalHabits,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setTodaySummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [viewMode, habits.length]);

  const filteredHabits = useMemo(() => {
    let result = habits.filter((habit) => {
      const isActive = (habit as Habit & { isActive?: boolean }).isActive ?? true;
      return isActive;
    });

    if (selectedHabitType) {
      result = result.filter((habit) => habit.habitType === selectedHabitType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (habit) =>
          habit.name.toLowerCase().includes(query) ||
          (habit.description && habit.description.toLowerCase().includes(query))
      );
    }

    if (viewMode === 'today') {
      result = result.filter(
        (habit) => habit.frequency === 'Daily' || habit.frequency === 'Weekly' || !habit.frequency
      );
      result = [...result].sort((a, b) => {
        const aDone = isTodayCompleted(a.id) ? 1 : 0;
        const bDone = isTodayCompleted(b.id) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [habits, selectedHabitType, searchQuery, viewMode, habitLogs]);

  const groupedByType = HABIT_TYPES.reduce(
    (acc, type) => {
      acc[type] = habits.filter((h) => h.habitType === type);
      return acc;
    },
    {} as Record<HabitType, Habit[]>
  );

  const selectedLogs = selectedHabit ? habitLogs.get(selectedHabit.id) || [] : [];
  const sortedSelectedLogs = useMemo(
    () =>
      [...selectedLogs].sort((a, b) =>
        getHabitLogCalendarDay(b.completedAt).localeCompare(getHabitLogCalendarDay(a.completedAt))
      ),
    [selectedLogs]
  );
  const selectedStreak = selectedHabit ? getStreak(selectedHabit.id) : 0;
  const selectedDateLogs =
    selectedHabit && selectedDate
      ? getLogsForDateRange(
          selectedLogs,
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
          new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            23,
            59,
            59,
            999
          )
        )
      : [];

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${selectedHabit ? 'pb-24 max-lg:pb-28' : ''}`}
        >
          {selectedHabit ? (
            <>
              <HabitDetailHeader
                habit={selectedHabit}
                logs={selectedLogs}
                onBack={handleBackToGrid}
                onEdit={() => setIsEditDialogOpen(true)}
                onDelete={() => setHabitToDelete(selectedHabit)}
              />

              {isAIConfigured && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
                  <button
                    onClick={() => setShowAIAssist(!showAIAssist)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    <Sparkles size={18} />
                    <span>AI Habit Tools</span>
                    {showAIAssist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showAIAssist && (
                    <div className="mt-4">
                      <AIHabitAssistPanel
                        habit={selectedHabit}
                        logs={selectedLogs}
                        onApplyPatch={async (patch: EstablishedHabitSuggestedPatch) => {
                          const input: UpdateHabitInput = { ...patch };
                          await handleUpdateHabit(selectedHabit.id, input);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <HabitDetailTabs activeTab={activeTab} onTabChange={setActiveTab}>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <HabitStatsDashboard habit={selectedHabit} logs={selectedLogs} />
                    <LinkedGoalsDisplay goals={linkedGoals.get(selectedHabit.id) || []} />
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Activity
                      </h2>
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setActivityView('heatmap')}
                          className={`px-3 py-1.5 text-sm rounded transition-colors min-h-[40px] touch-manipulation ${
                            activityView === 'heatmap'
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          Heatmap
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityView('calendar')}
                          className={`px-3 py-1.5 text-sm rounded transition-colors min-h-[40px] touch-manipulation ${
                            activityView === 'calendar'
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          Calendar
                        </button>
                      </div>
                    </div>
                    {activityView === 'heatmap' ? (
                      <HabitCalendarHeatmap
                        habit={selectedHabit}
                        logs={selectedLogs}
                        months={6}
                        onDateClick={handleDateClick}
                      />
                    ) : (
                      <HabitCalendarView
                        habit={selectedHabit}
                        logs={selectedLogs}
                        onDateClick={handleDateClick}
                        onQuickLog={(date) => handleDateModalLog(date)}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <CompletionRateChart habit={selectedHabit} logs={selectedLogs} />
                    <WeeklyMonthlyComparison habit={selectedHabit} logs={selectedLogs} />
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 shrink-0" />
                          Completion History
                        </h2>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedLogs.length} total • {selectedStreak} day streak
                        </div>
                      </div>

                      {selectedLogs.length === 0 ? (
                        <EmptyState
                          title="No completions yet"
                          description="Start building your streak by logging your first completion"
                          actionLabel="Log Completion"
                          onAction={() => handleQuickLog(selectedHabit)}
                        />
                      ) : (
                        <div className="space-y-2">
                          {sortedSelectedLogs.slice(0, 50).map((log) => (
                            <button
                              key={log.id}
                              onClick={() => {
                                const dayKey = getHabitLogCalendarDay(log.completedAt);
                                const [year, month, day] = dayKey.split('-').map(Number);
                                handleDateClick(new Date(year, month - 1, day));
                              }}
                              className="w-full text-left flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-h-[44px] touch-manipulation"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                                    {formatCompletionDate(log.completedAt)}
                                  </span>
                                  {log.amount && log.amount > 1 && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      × {log.amount}
                                    </span>
                                  )}
                                </div>
                                {log.notes && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                                    {log.notes}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </HabitDetailTabs>

              <FloatingLogButton
                habit={selectedHabit}
                logs={selectedLogs}
                onLog={() => handleQuickLog(selectedHabit)}
              />

              {selectedDate && (
                <DateDetailModal
                  isOpen={isDateModalOpen}
                  onClose={() => {
                    setIsDateModalOpen(false);
                    setSelectedDate(null);
                  }}
                  habit={selectedHabit}
                  date={selectedDate}
                  logs={selectedDateLogs}
                  onLog={handleDateModalLog}
                  onUpdateCompletionNote={async (completionDate, note) => {
                    if (!selectedHabit) {
                      throw new Error('No habit selected');
                    }
                    const response = await updateCompletionNote({
                      habitId: selectedHabit.id,
                      completionDate,
                      note,
                    });
                    if (!response.success) {
                      throw new Error(
                        response.error?.message ?? 'Failed to update completion note'
                      );
                    }
                    await loadHabitLogs(selectedHabit.id, { throwOnError: true });
                  }}
                />
              )}
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                    <Repeat className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                    Daily Habits
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Build consistency one day at a time
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">New Habit</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Search and View Mode */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search habits..."
                    className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
                  />
                </div>
                <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-1">
                  <motion.button
                    onClick={() => setViewMode('today')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-2 rounded-md transition-colors min-h-[44px] touch-manipulation ${
                      viewMode === 'today'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Today
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('all')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-2 rounded-md transition-colors min-h-[44px] touch-manipulation ${
                      viewMode === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    All Habits
                  </motion.button>
                </div>
              </motion.div>

              {viewMode === 'today' && todaySummary && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-900 dark:text-blue-100"
                >
                  Today: {todaySummary.completedCount} of {todaySummary.totalHabits} habits logged
                  {todaySummary.pendingCount > 0
                    ? ` · ${todaySummary.pendingCount} still pending`
                    : ' · all done'}
                </motion.div>
              )}

              {viewMode === 'today' && (
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  Showing habits to focus on today—pending completions appear first. Switch to All
                  Habits for the full list.
                </p>
              )}

              {/* Filter Pills */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mb-6 flex flex-wrap gap-2"
              >
                {/* All Filter */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedHabitType(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-full border transition-all touch-manipulation ${
                    selectedHabitType === null
                      ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-gray-700 dark:border-gray-300 shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  All ({habits.length})
                </motion.button>

                {/* Type Filters */}
                {HABIT_TYPES.map((type) => {
                  const typeHabits = groupedByType[type];
                  const isSelected = selectedHabitType === type;
                  const hasHabits = typeHabits.length > 0;

                  // Color scheme for each type
                  const getTypeStyles = (t: HabitType, selected: boolean) => {
                    const baseStyles =
                      'px-4 py-2 text-sm font-medium rounded-full border transition-all touch-manipulation';

                    if (!hasHabits) {
                      return `${baseStyles} bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed`;
                    }

                    if (selected) {
                      switch (t) {
                        case 'Build':
                          return `${baseStyles} bg-green-600 dark:bg-green-500 text-white border-green-700 dark:border-green-400 shadow-md`;
                        case 'Maintain':
                          return `${baseStyles} bg-blue-600 dark:bg-blue-500 text-white border-blue-700 dark:border-blue-400 shadow-md`;
                        case 'Reduce':
                          return `${baseStyles} bg-amber-600 dark:bg-amber-500 text-white border-amber-700 dark:border-amber-400 shadow-md`;
                        case 'Quit':
                          return `${baseStyles} bg-red-600 dark:bg-red-500 text-white border-red-700 dark:border-red-400 shadow-md`;
                        default:
                          return `${baseStyles} bg-gray-600 dark:bg-gray-500 text-white border-gray-700 dark:border-gray-400 shadow-md`;
                      }
                    }

                    // Unselected state
                    switch (t) {
                      case 'Build':
                        return `${baseStyles} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer`;
                      case 'Maintain':
                        return `${baseStyles} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer`;
                      case 'Reduce':
                        return `${baseStyles} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer`;
                      case 'Quit':
                        return `${baseStyles} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer`;
                      default:
                        return `${baseStyles} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer`;
                    }
                  };

                  return (
                    <motion.button
                      key={type}
                      whileHover={hasHabits ? { scale: 1.05 } : {}}
                      whileTap={hasHabits ? { scale: 0.95 } : {}}
                      onClick={() => hasHabits && setSelectedHabitType(isSelected ? null : type)}
                      disabled={!hasHabits}
                      className={getTypeStyles(type, isSelected)}
                    >
                      {type} ({typeHabits.length})
                    </motion.button>
                  );
                })}
              </motion.div>

              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    <HabitCardSkeleton count={8} />
                  </motion.div>
                ) : filteredHabits.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <EmptyState
                      title="No habits found"
                      description={
                        viewMode === 'today'
                          ? 'No daily or weekly habits match your filters for today.'
                          : selectedHabitType
                            ? `No ${selectedHabitType.toLowerCase()} habits found${searchQuery ? ' matching your search' : ''}`
                            : searchQuery
                              ? 'Try adjusting your search query'
                              : 'Get started by creating your first habit'
                      }
                      actionLabel="Create Habit"
                      onAction={() => setIsCreateDialogOpen(true)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="habits-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredHabits.map((habit) => (
                        <motion.div
                          key={habit.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                        >
                          <HabitCard
                            habit={habit}
                            streak={getStreak(habit.id)}
                            todayCompleted={isTodayCompleted(habit.id)}
                            todayProgress={getTodayProgress(habit.id)}
                            weeklyProgress={getWeeklyProgress(habit.id)}
                            totalCompletions={getTotalCompletions(habit.id)}
                            lastCompletedDate={getLastCompletedDate(habit.id)}
                            onClick={handleHabitClick}
                            onQuickLog={handleQuickLog}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Create New Habit"
        className="max-w-2xl"
      >
        <HabitCreateForm
          onSubmit={handleCreateHabit}
          onCancel={() => setIsCreateDialogOpen(false)}
          isLoading={isSubmitting}
        />
      </Dialog>

      <Dialog
        isOpen={isLogDialogOpen}
        onClose={closeLogDialog}
        title="Log Completion"
        className="max-w-lg"
      >
        {habitToLog && (
          <HabitLogWidget
            key={logDialogKey}
            habit={habitToLog}
            defaultLogDate={logDialogDefaultDate}
            onSubmit={handleLogCompletion}
            onCancel={closeLogDialog}
            isLoading={isSubmitting}
          />
        )}
      </Dialog>

      <Dialog
        isOpen={!!logConflict}
        onClose={() => !isSubmitting && setLogConflict(null)}
        title="Completion already exists"
        className="max-w-lg"
      >
        {logConflict && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              You already logged a completion for{' '}
              <span className="font-medium">
                {formatCompletionDate(logConflict.completionDate)}
              </span>
              . Replace the existing note or append your new note to it?
            </p>
            {logConflict.existingNote && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Current note
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {logConflict.existingNote}
                </p>
              </div>
            )}
            {logConflict.input.notes?.trim() && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  New note
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {logConflict.input.notes.trim()}
                </p>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLogConflict(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleConflictAppend}
                disabled={isSubmitting || !logConflict.input.notes?.trim()}
              >
                {isSubmitting ? 'Saving…' : 'Append to note'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConflictReplace}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Replace note'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog isOpen={!!habitToDelete} onClose={() => setHabitToDelete(null)} title="Delete Habit">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this habit? This action cannot be undone.
          </p>
          {habitToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white">{habitToDelete.name}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setHabitToDelete(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteHabit}
              disabled={isSubmitting}
              className="!bg-red-600 hover:!bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Habit'}
            </Button>
          </div>
        </div>
      </Dialog>

      {selectedHabit && (
        <Dialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          title="Edit Habit"
          className="max-w-2xl"
        >
          <HabitEditForm
            habit={selectedHabit}
            onSubmit={handleUpdateHabit}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </Dialog>
      )}
      <ToastContainer />
    </>
  );
}
