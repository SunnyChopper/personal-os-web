import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import type { Project } from '@/types/growth-system';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import {
  getDateUrgency,
  getProjectCardAccentBarClasses,
  type ProjectDisplayModel,
} from '@/utils/project-summary';
import { formatDateString } from '@/utils/date-formatters';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'timeline';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  taskCount?: number;
  completedTaskCount?: number;
  hasHealthData?: boolean;
  isHealthLoading?: boolean;
  viewMode?: ViewMode;
  /** When set, drives status badge, progress ring value, overdue hiding, and completion accent. */
  display?: ProjectDisplayModel;
  linkedGoalCount?: number;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0, filter: 'blur(4px)' },
  show: { y: 0, opacity: 1, filter: 'blur(0px)' },
};

// Mobile: Tactile feedback variants
const mobileTapVariants = {
  tap: { scale: 0.97 },
  hover: { scale: 1.01 },
};

// Desktop: Subtle hover variants
const desktopHoverVariants = {
  hover: { scale: 1.01, y: -2 },
  tap: { scale: 0.99 },
};

export function ProjectCard({
  project,
  onClick,
  taskCount = 0,
  completedTaskCount = 0,
  hasHealthData: _hasHealthData = false,
  isHealthLoading: _isHealthLoading = false,
  viewMode = 'grid',
  display,
  linkedGoalCount = 0,
}: ProjectCardProps) {
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
    startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'No target date';

  const handleClick = () => {
    onClick(project);
  };

  // Grid View: Simplified card layout with lower information density
  if (viewMode === 'grid') {
    return (
      <motion.div
        variants={itemVariants}
        layoutId={`project-card-${project.id}`}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          'group relative flex flex-col h-full',
          'bg-white dark:bg-gray-800',
          'rounded-xl border border-gray-200 dark:border-gray-700',
          'p-4 md:p-5',
          'cursor-pointer text-left overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'dark:focus:ring-offset-gray-900',
          // Mobile: Compact height
          'min-h-[160px]',
          // Desktop: Hover effects
          'lg:hover:shadow-lg lg:hover:border-blue-500 dark:lg:hover:border-blue-400',
          'lg:transition-all lg:duration-200'
        )}
        role="button"
        tabIndex={0}
        aria-label={`View project details: ${project.name}`}
        {...(typeof window !== 'undefined' && window.innerWidth >= 1024
          ? { whileHover: desktopHoverVariants.hover, whileTap: desktopHoverVariants.tap }
          : { whileHover: mobileTapVariants.hover, whileTap: mobileTapVariants.tap })}
      >
        {showBar && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3 }}
            className={cn('absolute left-0 top-0 bottom-0 w-1', barBgClass)}
          />
        )}

        {/* Header Section - Priority, Title, Status, Progress */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <PriorityIndicator priority={project.priority} size="sm" variant="badge" />
            <div className="flex-1 min-w-0">
              <motion.h3
                className={cn(
                  'font-semibold text-gray-900 dark:text-white',
                  'text-base',
                  'line-clamp-2 mb-2',
                  'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                  'transition-colors duration-200'
                )}
              >
                {project.name}
              </motion.h3>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={effectiveStatus} size="sm" />
                <AreaBadge area={project.area} size="sm" />
              </div>
            </div>
          </div>
          {/* Progress Ring */}
          <div className="shrink-0">
            {showProgressRing ? (
              <ProgressRing
                progress={progress}
                size="sm"
                className="shrink-0"
                color={progress >= 80 ? 'green' : progress >= 50 ? 'orange' : 'red'}
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                --
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Date only */}
        <div className="mt-auto flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{dateLabel}</span>
          {dateUrgency && dateUrgency.text && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
                dateUrgency.color,
                dateUrgency.animate
              )}
            >
              {dateUrgency.text}
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  }

  // List View: Horizontal layout optimized for desktop, compact for mobile
  if (viewMode === 'list') {
    return (
      <motion.div
        variants={itemVariants}
        layoutId={`project-list-${project.id}`}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          'group relative flex flex-col sm:flex-row sm:items-center',
          'bg-white dark:bg-gray-800',
          'rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700',
          'p-3 sm:p-4 lg:p-5',
          'gap-3 sm:gap-4',
          'cursor-pointer text-left',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'dark:focus:ring-offset-gray-900',
          // Mobile: Full width, vertical stack
          // Desktop: Horizontal layout with hover
          'lg:hover:shadow-md lg:hover:border-blue-500 dark:lg:hover:border-blue-400',
          'lg:transition-all lg:duration-200'
        )}
        role="button"
        tabIndex={0}
        aria-label={`View project details: ${project.name}`}
        {...(typeof window !== 'undefined' && window.innerWidth >= 1024
          ? { whileHover: desktopHoverVariants.hover, whileTap: desktopHoverVariants.tap }
          : { whileHover: mobileTapVariants.hover, whileTap: mobileTapVariants.tap })}
      >
        {showBar && <div className={cn('absolute left-0 top-0 bottom-0 w-1', barBgClass)} />}

        {/* Left: Priority + Title + Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <PriorityIndicator priority={project.priority} size="sm" variant="badge" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate mb-1">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={effectiveStatus} size="sm" />
              <AreaBadge area={project.area} size="sm" />
            </div>
          </div>
        </div>

        {/* Center: Progress (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {showProgressRing && (
            <div className="flex items-center gap-2">
              <ProgressRing progress={progress} size="sm" />
              <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                {progress}%
              </span>
            </div>
          )}
          <div className="text-xs text-gray-600 dark:text-gray-400 min-w-[120px]">{dateLabel}</div>
        </div>

        {/* Right: Chevron (desktop only) */}
        <div className="hidden lg:block shrink-0">
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
        </div>
      </motion.div>
    );
  }

  // Timeline View: Compact horizontal bar (used in ProjectTimelineView)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'group relative flex items-center justify-between',
        'h-14 sm:h-16',
        'px-3 sm:px-4',
        'rounded-lg',
        'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
        'border border-blue-600 dark:border-blue-500',
        'shadow-md hover:shadow-lg',
        'cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-shadow duration-200',
        (effectiveStatus === 'Completed' || isWorkComplete) &&
          'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-green-600 dark:border-green-500',
        effectiveStatus === 'On Hold' &&
          'from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 border-yellow-600 dark:border-yellow-500',
        effectiveStatus === 'Cancelled' &&
          'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 border-gray-600 dark:border-gray-500',
        effectiveStatus === 'Planning' &&
          'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-purple-600 dark:border-purple-500'
      )}
      role="button"
      tabIndex={0}
      aria-label={`View project: ${project.name}`}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <PriorityIndicator priority={project.priority} size="sm" variant="badge" />
        <span className="text-xs sm:text-sm font-medium text-white truncate">{project.name}</span>
      </div>
      <StatusBadge status={effectiveStatus} size="sm" />
      {/* Progress indicator */}
      {showProgressRing && (
        <div className="absolute left-2 right-2 bottom-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-white/80"
            aria-hidden="true"
          />
        </div>
      )}
    </motion.div>
  );
}

export default ProjectCard;
