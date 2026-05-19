import { useQuery } from '@tanstack/react-query';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import { habitsService } from '@/services/growth-system';
import { getWeeklyData } from '@/utils/habit-analytics';
import { getHabitTypeColors } from '@/utils/habit-colors';
import type { HabitCompletionWidgetConfig, WeeklyDashboardWidget } from '@/types/weekly-dashboard';

interface HabitCompletionWidgetProps {
  widget: WeeklyDashboardWidget;
}

export function HabitCompletionWidget({ widget }: HabitCompletionWidgetProps) {
  const cfg = widget.config as HabitCompletionWidgetConfig;
  const { habits } = useGrowthSystemDashboard();
  const habit = habits.find((h) => h.id === cfg.habitId);
  const weeks = cfg.comparisonWeeks ?? 5;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['habit-logs-weekly-widget', cfg.habitId, weeks],
    queryFn: async () => {
      const res = await habitsService.getLogsByHabit(cfg.habitId);
      return res.data ?? [];
    },
    enabled: Boolean(cfg.habitId),
    staleTime: 60_000,
  });

  const weekData = habit ? getWeeklyData(logs, habit, weeks) : [];

  if (!habit) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
        Habit not found. Update dashboard settings to pick a valid habit.
      </div>
    );
  }

  const colors = getHabitTypeColors(habit.habitType);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{habit.name}</h3>
        <span className="text-xs text-gray-500">{weeks} weeks</span>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading habit logs…</p>
      ) : (
        <div className="space-y-2">
          {weekData.map((row) => {
            const pct = row.expected > 0 ? Math.min(100, (row.completions / row.expected) * 100) : 0;
            return (
              <div key={row.startDate} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 truncate text-gray-500">
                  {row.period.replace('Week of ', '')}
                </span>
                <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${colors.progressFill}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right tabular-nums text-gray-700 dark:text-gray-300">
                  {row.completions}/{row.expected || '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
