import { useMemo } from 'react';
import { Calendar, Star, TrendingUp } from 'lucide-react';
import type { Project } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { SUBCATEGORY_LABELS } from '@/constants/growth-system';
import { cn } from '@/lib/utils';
import { formatDateString } from '@/utils/date-formatters';
import { getDateUrgency, getImpactColors, getScheduleHealth } from '@/utils/project-summary';

interface ProjectSummaryBaseProps {
  project: Project;
  taskCount?: number;
  completedTaskCount?: number;
  hasHealthData?: boolean;
  isHealthLoading?: boolean;
  className?: string;
}

interface ProjectSummaryDetailsProps extends ProjectSummaryBaseProps {
  showDescription?: boolean;
  descriptionClampLines?: 1 | 2;
}

interface ProjectProgressRowProps extends ProjectSummaryBaseProps {
  showScheduleHealth?: boolean;
  showProgressBar?: boolean;
  showProgressLabel?: boolean;
}

export const ProjectImpactStars = ({ impact }: { impact: number }) => {
  const impactColors = getImpactColors(impact);
  const isMaxImpact = impact === 5;

  return (
    <div className="flex items-center gap-2" aria-label={`Impact: ${impactColors.label}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <Star
            key={starValue}
            className={cn(
              'w-3.5 h-3.5 transition-colors',
              starValue <= (impact || 0)
                ? `fill-current ${impactColors.stars}`
                : 'fill-none text-gray-300 dark:text-gray-600'
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{impact}/5</span>
        {isMaxImpact && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 leading-none">
            Max
          </span>
        )}
      </div>
    </div>
  );
};

export const ProjectMetaRow = ({ project, className = '' }: ProjectSummaryBaseProps) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <AreaBadge area={project.area} size="sm" />
      {project.subCategory && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {SUBCATEGORY_LABELS[project.subCategory]}
        </span>
      )}
      {project.impact > 0 && <ProjectImpactStars impact={project.impact} />}
    </div>
  );
};

export const ScheduleHealthBadge = ({
  project,
  progressPercent,
  hasHealthData,
}: {
  project: Project;
  progressPercent: number;
  hasHealthData?: boolean;
}) => {
  const health = getScheduleHealth(project, progressPercent, hasHealthData);
  if (!health) return null;
  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', health.className)}>
      {health.label}
    </span>
  );
};

export const ProjectProgressRow = ({
  project,
  taskCount,
  completedTaskCount,
  hasHealthData,
  isHealthLoading,
  showScheduleHealth = true,
  showProgressBar = true,
  showProgressLabel = true,
  className = '',
}: ProjectProgressRowProps) => {
  const hasTasks = !!taskCount && taskCount > 0;
  const progressLabel = hasTasks
    ? `${completedTaskCount || 0}/${taskCount} tasks`
    : hasHealthData
      ? 'No tasks linked'
      : isHealthLoading
        ? 'Progress loading'
        : 'Progress unavailable';

  const progressValue =
    taskCount && taskCount > 0 ? Math.round(((completedTaskCount || 0) / taskCount) * 100) : 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{progressLabel}</span>
        </div>
        {showProgressLabel && hasTasks && (
          <span className="text-gray-900 dark:text-white font-medium">{progressValue}%</span>
        )}
      </div>
      {showProgressBar && hasTasks && (
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              progressValue >= 80
                ? 'bg-green-500 dark:bg-green-600'
                : progressValue >= 50
                  ? 'bg-yellow-500 dark:bg-yellow-600'
                  : 'bg-red-500 dark:bg-red-600'
            )}
            style={{ width: `${Math.min(100, progressValue)}%` }}
            aria-label={`${progressValue}% complete`}
          />
        </div>
      )}
      {showScheduleHealth && hasTasks && (
        <ScheduleHealthBadge
          project={project}
          progressPercent={progressValue}
          hasHealthData={hasHealthData}
        />
      )}
    </div>
  );
};

export const ProjectDueRow = ({ project, className = '' }: ProjectSummaryBaseProps) => {
  const startDate = useMemo(() => formatDateString(project.startDate), [project.startDate]);
  const endDate = useMemo(() => formatDateString(project.targetEndDate), [project.targetEndDate]);
  const dateUrgency = useMemo(() => getDateUrgency(project.targetEndDate), [project.targetEndDate]);

  const dateLabel =
    startDate || endDate
      ? startDate && endDate
        ? `${startDate} - ${endDate}`
        : startDate || endDate
      : 'No target date';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400">{dateLabel}</span>
        {dateUrgency && dateUrgency.text && (
          <span
            className={cn(
              'text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block w-fit',
              dateUrgency.color,
              dateUrgency.animate
            )}
          >
            {dateUrgency.text}
          </span>
        )}
      </div>
    </div>
  );
};

export const ProjectSummaryDetails = ({
  project,
  taskCount,
  completedTaskCount,
  hasHealthData,
  isHealthLoading,
  showDescription = true,
  descriptionClampLines = 2,
  className = '',
}: ProjectSummaryDetailsProps) => {
  const descriptionClass = descriptionClampLines === 1 ? 'line-clamp-1' : 'line-clamp-2';

  return (
    <div className={cn('flex flex-col flex-1 space-y-2', className)}>
      {showDescription && project.description && (
        <p className={cn('text-xs text-gray-600 dark:text-gray-400', descriptionClass)}>
          {project.description}
        </p>
      )}
      <div className="mt-auto space-y-2">
        <ProjectProgressRow
          project={project}
          taskCount={taskCount}
          completedTaskCount={completedTaskCount}
          hasHealthData={hasHealthData}
          isHealthLoading={isHealthLoading}
          showScheduleHealth
        />
        <ProjectMetaRow project={project} />
        <ProjectDueRow project={project} />
      </div>
    </div>
  );
};
