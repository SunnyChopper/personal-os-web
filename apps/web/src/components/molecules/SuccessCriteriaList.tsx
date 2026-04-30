import { useState } from 'react';
import { Check, Calendar, Link2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SuccessCriterion } from '@/types/growth-system';

interface SuccessCriteriaListProps {
  criteria: SuccessCriterion[];
  onToggleComplete?: (criterionId: string, isCompleted: boolean) => void;
  onUpdateCriterion?: (criterionId: string, updates: Partial<SuccessCriterion>) => void;
  onRemoveCriterion?: (criterionId: string) => void;
  editable?: boolean;
  showMetricLink?: boolean;
  showTaskLink?: boolean;
}

export function SuccessCriteriaList({
  criteria,
  onToggleComplete,
  onUpdateCriterion,
  onRemoveCriterion,
  editable = true,
  showMetricLink = true,
  showTaskLink = true,
}: SuccessCriteriaListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleToggle = (criterion: SuccessCriterion) => {
    if (!editable) return;
    onToggleComplete?.(criterion.id, !criterion.isCompleted);
  };

  const handleStartEdit = (criterion: SuccessCriterion) => {
    if (!editable) return;
    setEditingId(criterion.id);
    setEditText(criterion.description);
  };

  const handleSaveEdit = (criterionId: string) => {
    if (editText.trim()) {
      onUpdateCriterion?.(criterionId, { description: editText.trim() });
    }
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, criterionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(criterionId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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
    <div className="space-y-2">
      {criteria.map((criterion, index) => (
        <motion.div
          key={criterion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`group flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
            criterion.isCompleted
              ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
        >
          {/* Checkbox */}
          <motion.button
            onClick={() => handleToggle(criterion)}
            disabled={!editable}
            whileTap={{ scale: 0.9 }}
            whileHover={editable ? { scale: 1.05 } : {}}
            className={`flex-shrink-0 w-4 h-4 rounded border-2 transition-all duration-200 ${
              criterion.isCompleted
                ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
                : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:border-green-500 dark:hover:border-green-600'
            } ${!editable ? 'cursor-default' : 'cursor-pointer'} flex items-center justify-center`}
            aria-label={criterion.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {criterion.isCompleted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {editingId === criterion.id ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => handleSaveEdit(criterion.id)}
                onKeyDown={(e) => handleKeyDown(e, criterion.id)}
                autoFocus
                className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            ) : (
              <button
                type="button"
                onClick={() => handleStartEdit(criterion)}
                onKeyDown={(e) => {
                  if (editable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleStartEdit(criterion);
                  }
                }}
                disabled={!editable}
                aria-label={editable ? 'Edit criterion' : undefined}
                className={`text-sm text-left w-full ${
                  criterion.isCompleted
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                } ${editable ? 'cursor-text' : 'cursor-default'}`}
              >
                {criterion.description}
              </button>
            )}

            {/* Meta information */}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
              {criterion.targetDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(criterion.targetDate).toLocaleDateString()}</span>
                </div>
              )}
              {showMetricLink && criterion.linkedMetricId && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Link2 className="w-3 h-3" />
                  <span>Metric linked</span>
                </div>
              )}
              {showTaskLink && criterion.linkedTaskId && (
                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <Link2 className="w-3 h-3" />
                  <span>Task linked</span>
                </div>
              )}
              {criterion.completedAt && (
                <span className="text-green-600 dark:text-green-400">
                  Completed {new Date(criterion.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Remove button (visible on hover if editable) */}
          {editable && onRemoveCriterion && (
            <motion.button
              onClick={() => onRemoveCriterion(criterion.id)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 -m-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Remove criterion"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" strokeWidth={2} />
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  );
}
