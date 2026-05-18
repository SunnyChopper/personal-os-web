import { motion } from 'framer-motion';
import { Calendar, Pencil, Trash2, ChevronRight } from 'lucide-react';
import type { Project } from '@/types/growth-system';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import Button from '@/components/atoms/Button';
import { formatDateString } from '@/utils/date-formatters';
import {
  getDateUrgency,
  getProjectCardAccentBarClasses,
  type ProjectDisplayModel,
} from '@/utils/project-summary';
import { cn } from '@/lib/utils';

interface ProjectListItemProps {
  project: Project;
  onClick: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  taskCount?: number;
  completedTaskCount?: number;
  hasHealthData?: boolean;
  isHealthLoading?: boolean;
  display?: ProjectDisplayModel;
  linkedGoalCount?: number;
}

export function ProjectListItem({
  project,
  onClick,
  onEdit,
  onDelete,
  taskCount = 0,
  completedTaskCount = 0,
  hasHealthData: _hasHealthData = false,
  isHealthLoading: _isHealthLoading = false,
  display,
  linkedGoalCount = 0,
}: ProjectListItemProps) {
  const handleClick = () => {
    onClick(project);
  };

  const progress =
    display?.progressPercent ??
    (taskCount > 0 ? Math.round(((completedTaskCount || 0) / taskCount) * 100) : 0);
  const effectiveStatus = display?.effectiveStatus ?? project.status;
  const isWorkComplete = display?.isWorkComplete ?? project.status === 'Completed';
  const { showBar, barBgClass } = getProjectCardAccentBarClasses(project, isWorkComplete);
  const dateUrgency = getDateUrgency(project.targetEndDate, {
    hideWhenComplete: isWorkComplete || project.status === 'Cancelled',
  });
  const showProgressRing = taskCount > 0 || linkedGoalCount > 0;
  const startDate = project.startDate ? formatDateString(project.startDate) : null;
  const endDate = project.targetEndDate ? formatDateString(project.targetEndDate) : null;
  const dateLabel =
    startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'No date';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden"
      onClick={(e) => {
        // Don't trigger click if clicking on action buttons
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        handleClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View project details: ${project.name}`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-4 w-full">
        {showBar && <div className={cn('absolute left-0 top-0 bottom-0 w-1', barBgClass)} />}
        {/* Left: Priority + Title + Status + Area */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <PriorityIndicator priority={project.priority} size="sm" variant="badge" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate mb-1">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={effectiveStatus} size="sm" />
              <AreaBadge area={project.area} size="sm" />
            </div>
          </div>
        </div>

        {/* Center: Progress */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {showProgressRing ? (
            <>
              <ProgressRing progress={progress} size="sm" />
              <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                {progress}%
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">--</span>
          )}
        </div>

        {/* Center-Right: Date */}
        <div className="hidden lg:flex items-center gap-2 shrink-0 min-w-[140px]">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-600 dark:text-gray-400">{dateLabel}</span>
            {dateUrgency && dateUrgency.text && (
              <span
                className={cn(
                  'text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block w-fit',
                  dateUrgency.color
                )}
              >
                {dateUrgency.text}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="group"
            aria-label="Project actions"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(project)}
              className="!p-2 hover:!bg-blue-50 hover:!text-blue-600 dark:hover:!bg-blue-900/20 dark:hover:!text-blue-400"
              aria-label={`Edit project: ${project.name}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(project)}
              className="!p-2 hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-900/20 dark:hover:!text-red-400"
              aria-label={`Delete project: ${project.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
