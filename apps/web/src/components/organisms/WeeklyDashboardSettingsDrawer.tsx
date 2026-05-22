import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import {
  useWeeklyDashboardConfig,
  useWeeklyDashboardConfigMutation,
} from '@/hooks/useWeeklyDashboardConfig';
import type {
  StatTileKey,
  WeeklyDashboardConfig,
  WeeklyDashboardWidget,
  WeeklyDashboardWidgetType,
} from '@/types/weekly-dashboard';
import { DEFAULT_WEEKLY_DASHBOARD_CONFIG, STAT_TILE_LABELS } from '@/types/weekly-dashboard';
import { cn } from '@/lib/utils';

interface WeeklyDashboardSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const WIDGET_TYPE_LABELS: Record<WeeklyDashboardWidgetType, string> = {
  velocity: 'Story Point Velocity',
  statTiles: 'Stat Tiles',
  metricSeries: 'Metric Trend',
  habitCompletion: 'Habit Completion',
};

const FIELD_LABEL_CLASS = 'mb-1.5 inline-block font-medium text-gray-700 dark:text-gray-300';
const FIELD_INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800';

function newWidgetId(type: WeeklyDashboardWidgetType): string {
  return `${type}-${Date.now().toString(36)}`;
}

function defaultWidget(type: WeeklyDashboardWidgetType): WeeklyDashboardWidget {
  switch (type) {
    case 'velocity':
      return {
        id: newWidgetId(type),
        type,
        config: { comparisonWeeks: 5, rollingWindow: 4 },
      };
    case 'statTiles':
      return {
        id: newWidgetId(type),
        type,
        config: { tiles: ['tasksCompleted', 'journalEntries'] },
      };
    case 'metricSeries':
      return { id: newWidgetId(type), type, config: { metricId: '', comparisonWeeks: 5 } };
    case 'habitCompletion':
      return { id: newWidgetId(type), type, config: { habitId: '', comparisonWeeks: 5 } };
  }
}

export function WeeklyDashboardSettingsDrawer({
  open,
  onClose,
}: WeeklyDashboardSettingsDrawerProps) {
  const { data: saved } = useWeeklyDashboardConfig();
  const save = useWeeklyDashboardConfigMutation();
  const { metrics, habits } = useGrowthSystemDashboard();
  const [draft, setDraft] = useState<WeeklyDashboardConfig>(DEFAULT_WEEKLY_DASHBOARD_CONFIG);

  useEffect(() => {
    if (open && saved) {
      setDraft(structuredClone(saved));
    }
  }, [open, saved]);

  const updateWidget = useCallback((id: string, patch: Partial<WeeklyDashboardWidget>) => {
    setDraft((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }, []);

  const removeWidget = (id: string) => {
    setDraft((prev) => ({ ...prev, widgets: prev.widgets.filter((w) => w.id !== id) }));
  };

  const moveWidget = (index: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev.widgets];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, widgets: next };
    });
  };

  const addWidget = (type: WeeklyDashboardWidgetType) => {
    const widget = defaultWidget(type);
    if (type === 'metricSeries' && metrics[0]) {
      (widget.config as { metricId: string }).metricId = metrics[0].id;
    }
    if (type === 'habitCompletion' && habits[0]) {
      (widget.config as { habitId: string }).habitId = habits[0].id;
    }
    setDraft((prev) => ({ ...prev, widgets: [...prev.widgets, widget] }));
  };

  const handleSave = async () => {
    await save.mutateAsync(draft);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customize dashboard
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <label className="block text-sm">
            <span className={FIELD_LABEL_CLASS}>Default Comparison Window (Weeks)</span>
            <input
              type="number"
              min={1}
              max={26}
              value={draft.comparisonWeeks}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  comparisonWeeks: Math.max(1, Math.min(26, Number(e.target.value) || 5)),
                }))
              }
              className={FIELD_INPUT_CLASS}
            />
          </label>

          <div className="space-y-4">
            {draft.widgets.map((widget, index) => (
              <div
                key={widget.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {WIDGET_TYPE_LABELS[widget.type]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveWidget(index, -1)}
                      disabled={index === 0}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWidget(index, 1)}
                      disabled={index === draft.widgets.length - 1}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWidget(widget.id)}
                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="Remove widget"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {widget.type === 'velocity' && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className={FIELD_LABEL_CLASS}>Comparison Window (Weeks)</span>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        value={(widget.config as { comparisonWeeks?: number }).comparisonWeeks ?? 5}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: {
                              ...widget.config,
                              comparisonWeeks: Number(e.target.value) || 5,
                            },
                          })
                        }
                        className={FIELD_INPUT_CLASS}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className={FIELD_LABEL_CLASS}>Rolling Window</span>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        value={(widget.config as { rollingWindow?: number }).rollingWindow ?? 4}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: {
                              ...widget.config,
                              rollingWindow: Number(e.target.value) || 4,
                            },
                          })
                        }
                        className={FIELD_INPUT_CLASS}
                      />
                    </label>
                  </div>
                )}

                {widget.type === 'statTiles' && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {(Object.keys(STAT_TILE_LABELS) as StatTileKey[]).map((key) => {
                      const tiles = (widget.config as { tiles: StatTileKey[] }).tiles ?? [];
                      const active = tiles.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            const next = active ? tiles.filter((t) => t !== key) : [...tiles, key];
                            if (next.length === 0) return;
                            updateWidget(widget.id, { config: { tiles: next } });
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                            active
                              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800/60'
                          )}
                        >
                          {active ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                          {STAT_TILE_LABELS[key]}
                        </button>
                      );
                    })}
                  </div>
                )}

                {widget.type === 'metricSeries' && (
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className={FIELD_LABEL_CLASS}>Metric</span>
                      <select
                        value={(widget.config as { metricId: string }).metricId}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: { ...widget.config, metricId: e.target.value },
                          })
                        }
                        className={cn(FIELD_INPUT_CLASS, 'text-sm')}
                      >
                        <option value="">Select metric…</option>
                        {metrics.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className={FIELD_LABEL_CLASS}>Comparison Window (Weeks)</span>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        value={(widget.config as { comparisonWeeks?: number }).comparisonWeeks ?? 5}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: {
                              ...widget.config,
                              comparisonWeeks: Number(e.target.value) || 5,
                            },
                          })
                        }
                        className={FIELD_INPUT_CLASS}
                      />
                    </label>
                  </div>
                )}

                {widget.type === 'habitCompletion' && (
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className={FIELD_LABEL_CLASS}>Habit</span>
                      <select
                        value={(widget.config as { habitId: string }).habitId}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: { ...widget.config, habitId: e.target.value },
                          })
                        }
                        className={cn(FIELD_INPUT_CLASS, 'text-sm')}
                      >
                        <option value="">Select habit…</option>
                        {habits.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className={FIELD_LABEL_CLASS}>Comparison Window (Weeks)</span>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        value={(widget.config as { comparisonWeeks?: number }).comparisonWeeks ?? 5}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: {
                              ...widget.config,
                              comparisonWeeks: Number(e.target.value) || 5,
                            },
                          })
                        }
                        className={FIELD_INPUT_CLASS}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(WIDGET_TYPE_LABELS) as WeeklyDashboardWidgetType[]).map((type) => (
              <Button
                key={type}
                variant="secondary"
                onClick={() => addWidget(type)}
                className="inline-flex items-center gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                {WIDGET_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void handleSave()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save layout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
