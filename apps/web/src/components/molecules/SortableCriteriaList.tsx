import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, X, Calendar, Link2 } from 'lucide-react';
import type { SuccessCriterion } from '@/types/growth-system';

interface SortableCriterionItemProps {
  criterion: SuccessCriterion;
  onToggleComplete?: (criterionId: string, isCompleted: boolean) => void;
  onUpdateCriterion?: (criterionId: string, updates: Partial<SuccessCriterion>) => void;
  onRemoveCriterion?: (criterionId: string) => void;
  editable: boolean;
}

function SortableCriterionItem({
  criterion,
  onToggleComplete,
  onUpdateCriterion,
  onRemoveCriterion,
  editable,
}: SortableCriterionItemProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: criterion.id,
    disabled: !editable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggle = () => {
    if (!editable) return;
    onToggleComplete?.(criterion.id, !criterion.isCompleted);
  };

  const handleStartEdit = () => {
    if (!editable) return;
    setEditingId(criterion.id);
    setEditText(criterion.description);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdateCriterion?.(criterion.id, { description: editText.trim() });
    }
    setEditingId(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditText('');
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-start gap-3 p-3 rounded-lg transition-colors ${
          criterion.isCompleted
            ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
        }`}
      >
        {/* Drag Handle */}
        {editable && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          >
            <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={!editable}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 ${
            criterion.isCompleted
              ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
              : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:border-green-500 dark:hover:border-green-600'
          } ${!editable ? 'cursor-default' : 'cursor-pointer'} flex items-center justify-center`}
        >
          {criterion.isCompleted && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editingId === criterion.id ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          ) : editable ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className={`text-sm text-left w-full ${
                criterion.isCompleted
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              } cursor-text`}
              aria-label="Edit criterion"
            >
              {criterion.description}
            </button>
          ) : (
            <div
              className={`text-sm ${
                criterion.isCompleted
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {criterion.description}
            </div>
          )}

          {/* Meta information */}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            {criterion.targetDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(criterion.targetDate).toLocaleDateString()}</span>
              </div>
            )}
            {criterion.linkedMetricId && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Link2 className="w-3 h-3" />
                <span>Metric linked</span>
              </div>
            )}
            {criterion.completedAt && (
              <span className="text-green-600 dark:text-green-400">
                Completed {new Date(criterion.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Remove button */}
        {editable && onRemoveCriterion && (
          <button
            onClick={() => onRemoveCriterion(criterion.id)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
          >
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}

interface SortableCriteriaListProps {
  criteria: SuccessCriterion[];
  onReorder?: (reorderedCriteria: SuccessCriterion[]) => void;
  onToggleComplete?: (criterionId: string, isCompleted: boolean) => void;
  onUpdateCriterion?: (criterionId: string, updates: Partial<SuccessCriterion>) => void;
  onRemoveCriterion?: (criterionId: string) => void;
  editable?: boolean;
}

export function SortableCriteriaList({
  criteria,
  onReorder,
  onToggleComplete,
  onUpdateCriterion,
  onRemoveCriterion,
  editable = true,
}: SortableCriteriaListProps) {
  const [items, setItems] = useState(criteria);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex).map(
        (item: SuccessCriterion, index: number) => ({
          ...item,
          order: index,
        })
      );

      setItems(reordered);
      onReorder?.(reordered);
    }
  };

  if (criteria.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No success criteria defined yet</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((criterion) => (
            <SortableCriterionItem
              key={criterion.id}
              criterion={criterion}
              onToggleComplete={onToggleComplete}
              onUpdateCriterion={onUpdateCriterion}
              onRemoveCriterion={onRemoveCriterion}
              editable={editable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
