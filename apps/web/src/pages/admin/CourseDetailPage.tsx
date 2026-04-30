import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CircleCheck as CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Play,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import {
  coursesService,
  vaultItemsService,
  aiCourseGeneratorService,
} from '@/services/knowledge-vault';
import type { CourseWithDetails } from '@/services/knowledge-vault/courses.service';
import type { CourseLesson } from '@/types/knowledge-vault';
import type { LessonGenerationProgress } from '@/services/knowledge-vault/course-generation/types';
import { ROUTES } from '@/routes';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';

export default function CourseDetailPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<CourseWithDetails | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<LessonGenerationProgress | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [preQuizOpen, setPreQuizOpen] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    if (lessonId && courseData) {
      const lesson = courseData.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
      if (lesson) {
        loadLessonContent(lesson);
      }
    }
  }, [lessonId, courseData]);

  const loadCourseData = async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await coursesService.getCourseWithModulesAndLessons(courseId);

      if (response.success && response.data) {
        setCourseData(response.data);
      } else {
        setError(response.error || 'Failed to load course');
      }
    } catch {
      setError('An error occurred while loading the course');
    } finally {
      setLoading(false);
    }
  };

  const loadLessonContent = async (lesson: CourseLesson) => {
    setSelectedLesson(lesson);
    await vaultItemsService.markAccessed(lesson.id);

    if (!lesson.content) {
      await generateLessonContent(lesson);
    }
  };

  const generateLessonContent = async (lesson: CourseLesson) => {
    if (!courseData) return;

    setGeneratingContent(true);
    setGenerationProgress(null);

    const handleProgress = (progress: LessonGenerationProgress) => {
      setGenerationProgress(progress);
    };

    try {
      const module = courseData.modules.find((m) => m.lessons.some((l) => l.id === lesson.id));

      if (!module) return;

      const response = await aiCourseGeneratorService.generateLessonContent({
        courseId: courseId!,
        lessonId: lesson.id,
        onProgress: handleProgress,
      });

      if (response.success && response.data) {
        const bcRes = await coursesService.getById(courseId!);
        if (bcRes.success && bcRes.data) {
          const lessons = bcRes.data.lessons.map((l) =>
            l.id === lesson.id ? { ...l, content: response.data as string } : l
          );
          await coursesService.update(courseId!, { lessons });
        }

        setSelectedLesson((prev) => (prev ? { ...prev, content: response.data } : null));

        const updatedCourseData = await coursesService.getCourseWithModulesAndLessons(courseId!);
        if (updatedCourseData.success && updatedCourseData.data) {
          setCourseData(updatedCourseData.data);
        }
      }
    } catch (err) {
      console.error('Error generating lesson content:', err);
    } finally {
      setGeneratingContent(false);
      setGenerationProgress(null);
    }
  };

  const handleLessonClick = (lesson: CourseLesson) => {
    navigate(`${ROUTES.admin.knowledgeVaultCourses}/${courseId}/${lesson.id}`);
  };

  const handleMarkComplete = async () => {
    if (!selectedLesson) return;

    await vaultItemsService.markLessonComplete(courseId!, selectedLesson.id);
    await loadCourseData();

    const currentModuleLessons =
      courseData?.modules.find((m) => m.lessons.some((l) => l.id === selectedLesson.id))?.lessons ||
      [];

    const currentIndex = currentModuleLessons.findIndex((l) => l.id === selectedLesson.id);
    const nextLesson = currentModuleLessons[currentIndex + 1];

    if (nextLesson) {
      handleLessonClick(nextLesson);
    }
  };

  const getTotalLessons = () => {
    return courseData?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
  };

  const getCompletedLessons = () => {
    return (
      courseData?.modules.reduce(
        (acc, m) => acc + m.lessons.filter((l) => l.completedAt).length,
        0
      ) || 0
    );
  };

  const getProgressPercentage = () => {
    const total = getTotalLessons();
    const completed = getCompletedLessons();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getAllLessons = (): CourseLesson[] => {
    if (!courseData) return [];
    return courseData.modules.flatMap((m) => m.lessons);
  };

  const getPreviousLesson = (): CourseLesson | null => {
    if (!selectedLesson || !courseData) return null;
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex((l) => l.id === selectedLesson.id);
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  };

  const getNextLesson = (): CourseLesson | null => {
    if (!selectedLesson || !courseData) return null;
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex((l) => l.id === selectedLesson.id);
    return currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  };

  const handleCopyToMarkdown = async () => {
    if (!selectedLesson?.content) return;

    try {
      // Create a formatted markdown document with lesson metadata
      const markdown = `# ${selectedLesson.title}\n\n${
        selectedLesson.estimatedMinutes
          ? `**Duration:** ${selectedLesson.estimatedMinutes} minutes\n\n`
          : ''
      }${selectedLesson.content}`;

      await navigator.clipboard.writeText(markdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'Course not found'}</p>
        <button
          onClick={() => navigate(ROUTES.admin.knowledgeVaultCourses)}
          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();

  // Shared animation config for synchronized movement
  const springConfig = { type: 'spring' as const, damping: 30, stiffness: 300, mass: 0.8 };

  return (
    <div className="relative pb-20">
      {/* iTunes-style Media Player Bar (shown when sidebar is collapsed) */}
      <AnimatePresence mode="sync">
        {sidebarCollapsed && selectedLesson && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={springConfig}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center gap-4">
                {/* Left: Course/Lesson Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => navigate(ROUTES.admin.knowledgeVaultCourses)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                    title="Back to Courses"
                  >
                    <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {selectedLesson.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {courseData.course.title}
                    </p>
                  </div>
                </div>

                {/* Center: Playback Controls */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => previousLesson && handleLessonClick(previousLesson)}
                      disabled={!previousLesson}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={previousLesson?.title || 'No previous lesson'}
                    >
                      <SkipBack size={20} className="text-gray-700 dark:text-gray-300" />
                    </button>

                    <button
                      onClick={() => nextLesson && handleLessonClick(nextLesson)}
                      disabled={!nextLesson}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={nextLesson?.title || 'No next lesson'}
                    >
                      <SkipForward size={20} className="text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-64 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {getCompletedLessons()}/{getTotalLessons()}
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-green-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {getProgressPercentage()}%
                    </span>
                  </div>
                </div>

                {/* Right: Additional Controls - Removed collapse button per user request */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Sidebar with animation - pure slide, no fade */}
          <AnimatePresence mode="sync">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={springConfig}
                className="lg:col-span-1 space-y-6 min-w-0"
              >
                <div>
                  <button
                    onClick={() => navigate(ROUTES.admin.knowledgeVaultCourses)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                  >
                    <ArrowLeft size={20} />
                    <span>Back to Courses</span>
                  </button>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {courseData.course.title}
                    </h1>
                    {courseData.course.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {courseData.course.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen size={16} />
                        {getTotalLessons()} lessons
                      </span>
                      {courseData.course.estimatedHours && (
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {courseData.course.estimatedHours}h
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {getProgressPercentage()}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${getProgressPercentage()}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getCompletedLessons()} of {getTotalLessons()} lessons completed
                    </p>

                    {courseData.preAssessment && courseData.preAssessment.questions.length > 0 && (
                      <div className="mt-4 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPreQuizOpen((o) => !o)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900"
                          aria-expanded={preQuizOpen}
                          aria-controls="pre-course-quiz-panel"
                        >
                          <span>Pre-course quiz — your starting point</span>
                          <ChevronDown
                            size={18}
                            className={`flex-shrink-0 transition-transform ${preQuizOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {preQuizOpen && (
                          <div
                            id="pre-course-quiz-panel"
                            className="px-3 py-3 space-y-3 text-sm border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                          >
                            {courseData.preAssessment.questions.map((q, idx) => (
                              <div key={q.id}>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {idx + 1}. {q.questionText}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                  <span className="text-gray-500 dark:text-gray-500">
                                    Your answer:{' '}
                                  </span>
                                  {courseData.preAssessment?.userResponses[q.id] ?? '—'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 max-h-[600px] overflow-y-auto">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Course Content
                  </h2>

                  <div className="space-y-4">
                    {courseData.modules.map((moduleData, moduleIndex) => (
                      <div key={moduleData.module.id}>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          Module {moduleIndex + 1}: {moduleData.module.title}
                        </h3>

                        <div className="space-y-1">
                          {moduleData.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonClick(lesson)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                                selectedLesson?.id === lesson.id
                                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {lesson.completedAt ? (
                                <CheckCircle2
                                  size={20}
                                  className="text-green-600 dark:text-green-400 flex-shrink-0"
                                />
                              ) : (
                                <Circle size={20} className="text-gray-400 flex-shrink-0" />
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {lesson.title}
                                </p>
                                {lesson.estimatedMinutes && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {lesson.estimatedMinutes} min
                                  </p>
                                )}
                              </div>

                              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Area with smooth width transition - no fade, just layout */}
          <motion.div
            layout
            className={sidebarCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'}
            transition={springConfig}
            style={{ minWidth: 0 }}
          >
            {selectedLesson ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedLesson.title}
                      </h2>
                      {selectedLesson.estimatedMinutes && (
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock size={16} />
                          {selectedLesson.estimatedMinutes} minutes
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedLesson.content && (
                        <button
                          onClick={handleCopyToMarkdown}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition font-medium"
                          title="Copy lesson content as Markdown"
                        >
                          {copySuccess ? (
                            <>
                              <Check size={16} className="text-green-600 dark:text-green-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              <span>Copy to Markdown</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                      >
                        {sidebarCollapsed ? (
                          <PanelLeftOpen size={20} />
                        ) : (
                          <PanelLeftClose size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {generatingContent ? (
                  <div className="py-12">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                        <Sparkles
                          size={32}
                          className="text-green-600 dark:text-green-400 animate-pulse"
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Generating Lesson Content
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        AI is creating comprehensive content for this lesson...
                      </p>
                    </div>

                    {generationProgress && (
                      <div className="space-y-6">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {generationProgress.phaseName}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {generationProgress.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${generationProgress.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Phase Summary */}
                        {generationProgress.summary && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {generationProgress.summary}
                            </p>
                          </div>
                        )}

                        {/* Phase Indicators */}
                        <div className="space-y-3">
                          {[
                            { phase: 'analyzing', label: 'Analyzing Lesson Context', icon: '🔍' },
                            { phase: 'structuring', label: 'Structuring Content', icon: '📋' },
                            { phase: 'writing', label: 'Writing Lesson Content', icon: '✍️' },
                            { phase: 'polishing', label: 'Polishing Content', icon: '✨' },
                          ].map((phaseInfo, index) => {
                            const isActive = generationProgress.phase === phaseInfo.phase;
                            const isCompleted =
                              ['analyzing', 'structuring', 'writing', 'polishing'].indexOf(
                                generationProgress.phase
                              ) > index;

                            return (
                              <div
                                key={phaseInfo.phase}
                                className={`flex items-center gap-3 p-3 rounded-lg transition ${
                                  isActive
                                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                                    : isCompleted
                                      ? 'bg-gray-50 dark:bg-gray-900/50 opacity-60'
                                      : 'bg-gray-50 dark:bg-gray-900/30'
                                }`}
                              >
                                <div
                                  className={`text-xl ${
                                    isActive ? 'animate-pulse' : isCompleted ? 'opacity-50' : ''
                                  }`}
                                >
                                  {phaseInfo.icon}
                                </div>
                                <div className="flex-1">
                                  <p
                                    className={`text-sm font-medium ${
                                      isActive
                                        ? 'text-green-700 dark:text-green-300'
                                        : isCompleted
                                          ? 'text-gray-500 dark:text-gray-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                    }`}
                                  >
                                    {phaseInfo.label}
                                  </p>
                                </div>
                                {isActive && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                )}
                                {isCompleted && (
                                  <div className="text-green-600 dark:text-green-400">✓</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!generationProgress && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      </div>
                    )}
                  </div>
                ) : selectedLesson.content ? (
                  <>
                    <div className="mb-8">
                      <MarkdownRenderer content={selectedLesson.content} />
                    </div>

                    {!selectedLesson.completedAt && (
                      <button
                        onClick={handleMarkComplete}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                      >
                        <CheckCircle2 size={20} />
                        <span>Mark as Complete</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Play size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Content not yet generated
                    </p>
                    <button
                      onClick={() => generateLessonContent(selectedLesson)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      <Sparkles size={20} />
                      <span>Generate Lesson Content</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <BookOpen size={48} className="text-gray-400" />
                  {sidebarCollapsed && (
                    <button
                      onClick={() => setSidebarCollapsed(false)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Show sidebar"
                    >
                      <PanelLeftOpen size={24} />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {sidebarCollapsed
                    ? 'Use the button above to show the sidebar and select a lesson'
                    : 'Select a lesson from the sidebar to begin learning'}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
