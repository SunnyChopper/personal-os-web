import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import type { Project } from '@/types/growth-system';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import {
  getDateUrgency,
  resolveProjectBadgeStatus,
  getProjectCardAccentBarClasses,
  projectProgressRingColor,
  type ProjectDisplayModel,
} from '@/utils/project-summary';
import { formatDateString } from '@/utils/date-formatters';
import { getProjectTimelineBarColorClasses } from '@/utils/timeline-bar-colors';
import { SUBCATEGORY_LABELS } from '@/constants/growth-system';
import { cn } from '@/lib/utils';
import { EntityExplainButton } from '@/components/molecules/EntityExplainButton';
import { useEntityExplainChatOptional } from '@/contexts/EntityExplainChatContext';
import {
  getGridProjectAccentBarClass,
  projectGridAccentBarClassName,
  projectGridCardShellClassName,
} from '@/lib/growth-system/project-card-surfaces';

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

// Mobile: Tactile feedback variants
const mobileTapVariants = {
  tap: { scale: 0.97 },
  hover: { scale: 1.01 },
};

// Desktop: Subtle hover variants (no vertical translate — dense grid scannability)
const desktopHoverVariants = {
  hover: { scale: 1.01 },
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
  const badgeStatus = resolveProjectBadgeStatus(project, display);
  const isStale = badgeStatus === 'Stale';
  const progressRingColor = projectProgressRingColor(badgeStatus);
  const listAccent = getProjectCardAccentBarClasses(project, isWorkComplete);
  const gridAccentBgClass = getGridProjectAccentBarClass({
    priority: project.priority,
    isWorkComplete,
    status: project.status,
  });
  const gridAccentBarClassName = projectGridAccentBarClassName({
    accentBgClass: gridAccentBgClass,
  });
  const dateUrgency = getDateUrgency(project.targetEndDate, {
    hideWhenComplete: isWorkComplete || project.status === 'Cancelled',
  });
  const cardOpacity = dateUrgency?.dimCard ? 0.75 : 1;
  const gridItemVariants = {
    hidden: { y: 20, opacity: 0, filter: 'blur(4px)' },
    show: { y: 0, opacity: cardOpacity, filter: 'blur(0px)' },
  };
  const explainChat = useEntityExplainChatOptional();

  const openProjectExplain = () => {
    explainChat?.open({
      entityType: 'project',
      entity: project,
      projectEnrichment: {
        taskCount,
        completedTaskCount,
        linkedGoalCount,
        progressPercent: progress,
      },
    });
  };

  const explainButton =
    explainChat != null ? (
      <EntityExplainButton
        entityType="project"
        entityTitle={project.name}
        onClick={openProjectExplain}
      />
    ) : null;

  const progressAnchor = (
    <ProgressRing progress={progress} size="sm" className="shrink-0" color={progressRingColor} />
  );

  const quietMetaRow = (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={badgeStatus} size="sm" appearance="quiet" />
      <AreaBadge area={project.area} size="sm" appearance="quiet" />
      {project.subCategory && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {SUBCATEGORY_LABELS[project.subCategory]}
        </span>
      )}
    </div>
  );

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
        initial="hidden"
        animate="show"
        variants={gridItemVariants}
        layoutId={`project-card-${project.id}`}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
        className={projectGridCardShellClassName()}
        role="button"
        tabIndex={0}
        aria-label={`View project details: ${project.name}`}
        {...(typeof window !== 'undefined' && window.innerWidth >= 1024
          ? { whileHover: desktopHoverVariants.hover, whileTap: desktopHoverVariants.tap }
          : { whileHover: mobileTapVariants.hover, whileTap: mobileTapVariants.tap })}
      >
        {gridAccentBarClassName ? <div className={gridAccentBarClassName} aria-hidden /> : null}

        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-start gap-1.5">
              <PriorityIndicator
                priority={project.priority}
                size="sm"
                variant="badge"
                className="mt-0.5 shrink-0"
              />
              <motion.h3
                className={cn(
                  'min-w-0 flex-1 line-clamp-2 font-semibold text-gray-900 dark:text-white',
                  'text-base',
                  'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                  'transition-colors duration-200'
                )}
              >
                {project.name}
              </motion.h3>
            </div>
            {quietMetaRow}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {explainButton}
            {progressAnchor}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-1.5">
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
        initial="hidden"
        animate="show"
        variants={gridItemVariants}
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
          'p-3 sm:p-4',
          'gap-3 sm:gap-4',
          'cursor-pointer text-left',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'dark:focus:ring-offset-gray-900',
          'lg:hover:border-blue-500 dark:lg:hover:border-blue-400',
          'lg:transition-colors lg:duration-200'
        )}
        role="button"
        tabIndex={0}
        aria-label={`View project details: ${project.name}`}
        {...(typeof window !== 'undefined' && window.innerWidth >= 1024
          ? { whileHover: desktopHoverVariants.hover, whileTap: desktopHoverVariants.tap }
          : { whileHover: mobileTapVariants.hover, whileTap: mobileTapVariants.tap })}
      >
        {listAccent.showBar && (
          <div className={cn('absolute left-0 top-0 bottom-0 w-1', listAccent.barBgClass)} />
        )}

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <PriorityIndicator priority={project.priority} size="sm" variant="badge" />
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {project.name}
            </h3>
            {quietMetaRow}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {explainButton}
          <div className="hidden items-center gap-2 md:flex">
            <ProgressRing progress={progress} size="sm" color={progressRingColor} />
            <span className="w-12 text-right text-sm font-medium text-gray-900 dark:text-white">
              {progress}%
            </span>
          </div>
          <div className="hidden text-xs text-gray-600 dark:text-gray-400 md:block min-w-[120px]">
            {dateLabel}
          </div>
          <div className="hidden shrink-0 lg:block">
            <ChevronRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-400" />
          </div>
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
        'group relative flex items-center justify-between gap-2',
        'h-14 sm:h-16',
        'px-3 sm:px-4',
        'rounded-lg',
        'bg-gradient-to-r',
        getProjectTimelineBarColorClasses(effectiveStatus, { isWorkComplete, isStale }),
        'shadow-md hover:shadow-lg',
        'cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-shadow duration-200'
      )}
      role="button"
      tabIndex={0}
      aria-label={`View project: ${project.name}`}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <PriorityIndicator priority={project.priority} size="sm" variant="badge" />
        <span className="truncate text-xs font-medium text-white sm:text-sm">{project.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {explainChat != null ? (
          <EntityExplainButton
            entityType="project"
            entityTitle={project.name}
            alwaysVisible
            className="text-white/90 hover:bg-white/15 hover:text-white"
            onClick={openProjectExplain}
          />
        ) : null}
        <StatusBadge status={badgeStatus} size="sm" appearance="onSolid" />
      </div>
      {/* Progress indicator */}
      <div className="absolute left-2 right-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-white/80"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

export default ProjectCard;
