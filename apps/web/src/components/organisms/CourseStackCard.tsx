import { BookOpen, CheckCircle2, Clock, Layers } from 'lucide-react';
import type { Course, CourseLesson } from '@/types/knowledge-vault';

interface CourseStackCardProps {
  course: Course;
  lessons: CourseLesson[];
  onClick?: () => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CourseStackCard({ course, lessons, onClick }: CourseStackCardProps) {
  const completedLessons = lessons.filter((l) => l.completedAt).length;
  const totalLessons = lessons.length;
  const completionPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const totalMinutes = lessons.reduce((sum, lesson) => sum + (lesson.estimatedMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const mostRecentUpdate = lessons.reduce((latest, lesson) => {
    const lessonDate = new Date(lesson.updatedAt);
    return lessonDate > latest ? lessonDate : latest;
  }, new Date(0));

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View course: ${course.title}` : undefined}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Layers size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{course.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
        </div>
        {course.isAiGenerated && (
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
            AI Generated
          </span>
        )}
      </div>

      {course.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {course.description}
        </p>
      )}

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen size={14} />
            {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
          </span>
          {totalHours > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {totalHours}h
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {completedLessons} of {totalLessons} completed
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            {Math.round(completionPercentage)}%
          </span>
        </div>
      </div>

      {/* Lesson Preview */}
      {lessons.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {lessons.slice(0, 3).map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
              >
                {lesson.completedAt ? (
                  <CheckCircle2
                    size={14}
                    className="text-green-600 dark:text-green-400 flex-shrink-0"
                  />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                )}
                <span className="truncate">
                  Lesson {lesson.lessonIndex + 1}: {lesson.title}
                </span>
              </div>
            ))}
            {lessons.length > 3 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 pl-5">
                +{lessons.length - 3} more lesson{lessons.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Updated {formatDate(mostRecentUpdate.toISOString())}</span>
        <span className="capitalize">{course.difficulty}</span>
      </div>
    </div>
  );
}
