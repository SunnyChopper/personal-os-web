/** Weekly dashboard widget configuration (mirrors backend weekly_dashboard schemas). */

export type StatTileKey =
  | 'tasksCompleted'
  | 'tasksPlanned'
  | 'completedStoryPoints'
  | 'habitCompletions'
  | 'metricsLogged'
  | 'goalsActive'
  | 'goalsAtRisk'
  | 'journalEntries';

export type WeeklyDashboardWidgetType =
  | 'velocity'
  | 'statTiles'
  | 'metricSeries'
  | 'habitCompletion';

export interface VelocityWidgetConfig {
  comparisonWeeks?: number;
  rollingWindow?: number;
}

export interface StatTilesWidgetConfig {
  tiles: StatTileKey[];
}

export interface MetricSeriesWidgetConfig {
  metricId: string;
  comparisonWeeks?: number;
}

export interface HabitCompletionWidgetConfig {
  habitId: string;
  comparisonWeeks?: number;
}

export type WeeklyDashboardWidgetConfig =
  | VelocityWidgetConfig
  | StatTilesWidgetConfig
  | MetricSeriesWidgetConfig
  | HabitCompletionWidgetConfig;

export interface WeeklyDashboardWidget {
  id: string;
  type: WeeklyDashboardWidgetType;
  config: WeeklyDashboardWidgetConfig;
}

export interface WeeklyDashboardConfig {
  comparisonWeeks: number;
  widgets: WeeklyDashboardWidget[];
}

export const DEFAULT_WEEKLY_DASHBOARD_CONFIG: WeeklyDashboardConfig = {
  comparisonWeeks: 5,
  widgets: [
    {
      id: 'velocity',
      type: 'velocity',
      config: { comparisonWeeks: 5, rollingWindow: 4 },
    },
    {
      id: 'stat-tiles',
      type: 'statTiles',
      config: {
        tiles: [
          'tasksCompleted',
          'habitCompletions',
          'goalsActive',
          'metricsLogged',
          'journalEntries',
        ],
      },
    },
  ],
};

export const STAT_TILE_LABELS: Record<StatTileKey, string> = {
  tasksCompleted: 'Tasks done',
  tasksPlanned: 'Tasks planned',
  completedStoryPoints: 'Story points',
  habitCompletions: 'Habit logs',
  metricsLogged: 'Metrics',
  goalsActive: 'Goals active',
  goalsAtRisk: 'Goals at risk',
  journalEntries: 'Journal',
};

export function maxComparisonWeeks(config: WeeklyDashboardConfig): number {
  const weeks = [config.comparisonWeeks];
  for (const widget of config.widgets) {
    const cfg = widget.config;
    if ('comparisonWeeks' in cfg && cfg.comparisonWeeks) {
      weeks.push(cfg.comparisonWeeks);
    }
  }
  return Math.max(...weeks, 5);
}

export function velocityRollingWindow(config: WeeklyDashboardConfig): number {
  const velocity = config.widgets.find((w) => w.type === 'velocity');
  if (velocity && velocity.type === 'velocity') {
    const cfg = velocity.config as VelocityWidgetConfig;
    return cfg.rollingWindow ?? 4;
  }
  return 4;
}
