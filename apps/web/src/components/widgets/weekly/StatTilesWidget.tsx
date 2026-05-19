import type { ComponentType } from 'react';
import {
  Activity,
  BarChart2,
  BookOpen,
  CheckCircle,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { WeeklyReviewCurrentDashboard } from '@/types/growth-system';
import type { StatTileKey, WeeklyDashboardWidget } from '@/types/weekly-dashboard';
import { STAT_TILE_LABELS } from '@/types/weekly-dashboard';
import { cn } from '@/lib/utils';

const TILE_ICONS: Record<StatTileKey, ComponentType<{ className?: string }>> = {
  tasksCompleted: CheckCircle,
  tasksPlanned: CheckCircle,
  completedStoryPoints: TrendingUp,
  habitCompletions: Activity,
  metricsLogged: BarChart2,
  goalsActive: Target,
  goalsAtRisk: Target,
  journalEntries: BookOpen,
};

const TILE_ACCENTS: Record<StatTileKey, string> = {
  tasksCompleted: 'text-gray-900 dark:text-white',
  tasksPlanned: 'text-slate-600 dark:text-slate-300',
  completedStoryPoints: 'text-blue-600 dark:text-blue-400',
  habitCompletions: 'text-emerald-500 dark:text-emerald-400',
  metricsLogged: 'text-amber-500 dark:text-amber-400',
  goalsActive: 'text-violet-500 dark:text-violet-400',
  goalsAtRisk: 'text-red-500 dark:text-red-400',
  journalEntries: 'text-cyan-500 dark:text-cyan-400',
};

interface StatTilesWidgetProps {
  widget: WeeklyDashboardWidget;
  data: WeeklyReviewCurrentDashboard;
}

export function StatTilesWidget({ widget, data }: StatTilesWidgetProps) {
  const cfg = widget.config as { tiles: StatTileKey[] };
  const tiles = cfg.tiles ?? [];

  if (tiles.length === 0) return null;

  return (
    <div
      className={cn(
        'grid gap-3',
        tiles.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-5'
      )}
    >
      {tiles.map((key) => {
        const Icon = TILE_ICONS[key];
        const value = data.statsPartial[key] ?? 0;
        return (
          <div
            key={key}
            className="rounded-xl border border-blue-200/60 bg-gradient-to-br from-white to-blue-50/50 p-4 dark:border-blue-900/45 dark:from-gray-800 dark:to-blue-950/25"
          >
            <Icon className={cn('h-5 w-5', TILE_ACCENTS[key])} aria-hidden />
            <div className={cn('mt-2 text-2xl font-bold tabular-nums', TILE_ACCENTS[key])}>
              {value}
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {STAT_TILE_LABELS[key]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
