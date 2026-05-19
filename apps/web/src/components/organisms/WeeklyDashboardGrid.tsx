import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { HabitCompletionWidget } from '@/components/widgets/weekly/HabitCompletionWidget';
import { MetricSeriesWidget } from '@/components/widgets/weekly/MetricSeriesWidget';
import { StatTilesWidget } from '@/components/widgets/weekly/StatTilesWidget';
import { VelocityWidget } from '@/components/widgets/weekly/VelocityWidget';
import type { WeeklyReviewCurrentDashboard } from '@/types/growth-system';
import type { WeeklyDashboardConfig, WeeklyDashboardWidget } from '@/types/weekly-dashboard';
import { cn } from '@/lib/utils';

interface WeeklyDashboardGridProps {
  config: WeeklyDashboardConfig;
  data: WeeklyReviewCurrentDashboard;
  onEdit: () => void;
  editable?: boolean;
  onReorder?: (widgets: WeeklyDashboardWidget[]) => void;
}

function SortableWidgetShell({
  widget,
  children,
  editable,
}: {
  widget: WeeklyDashboardWidget;
  children: React.ReactNode;
  editable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {editable && (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 rounded-md border border-gray-200 bg-white/90 p-1 text-gray-500 hover:text-gray-800 dark:border-gray-600 dark:bg-gray-800/90 dark:hover:text-gray-200"
          aria-label={`Drag to reorder ${widget.type} widget`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

function renderWidget(widget: WeeklyDashboardWidget, data: WeeklyReviewCurrentDashboard) {
  switch (widget.type) {
    case 'velocity':
      return <VelocityWidget widget={widget} data={data} />;
    case 'statTiles':
      return <StatTilesWidget widget={widget} data={data} />;
    case 'metricSeries':
      return <MetricSeriesWidget widget={widget} />;
    case 'habitCompletion':
      return <HabitCompletionWidget widget={widget} />;
    default:
      return null;
  }
}

export function WeeklyDashboardGrid({
  config,
  data,
  onEdit,
  editable = false,
  onReorder,
}: WeeklyDashboardGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = config.widgets.findIndex((w) => w.id === active.id);
    const newIndex = config.widgets.findIndex((w) => w.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(config.widgets, oldIndex, newIndex));
  };

  const body = (
    <SortableContext items={config.widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-6">
        {config.widgets.map((widget) => (
          <SortableWidgetShell key={widget.id} widget={widget} editable={editable}>
            {renderWidget(widget, data)}
          </SortableWidgetShell>
        ))}
      </div>
    </SortableContext>
  );

  return (
    <div className={cn('space-y-4', editable && 'rounded-xl border border-dashed border-blue-300/60 p-4')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Week {data.weekStart} → {data.weekEnd}
          {editable ? ' · drag widgets to reorder' : ''}
        </p>
        <Button variant="secondary" onClick={onEdit} className="inline-flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Customize
        </Button>
      </div>
      {editable && onReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {body}
        </DndContext>
      ) : (
        body
      )}
    </div>
  );
}
