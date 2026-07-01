import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ClipboardList, HelpCircle, BookMarked } from 'lucide-react';
import { aiCoursePracticeService, practiceArtifactsService } from '@/services/knowledge-vault';
import type {
  HomeworkAssignment,
  PracticeQuestion,
  PracticeQuestionSet,
  QuizArtifact,
} from '@/types/knowledge-vault';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { Textarea } from '@/components/atoms/Textarea';

function errText(err: unknown, fallback: string): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

interface CoursePracticeSectionsProps {
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  lessonTitle: string;
  lessonContent: string;
  courseTitle: string;
  courseProgress: number;
  model?: string;
  disabled?: boolean;
}

function QuestionList({
  questions,
  responses,
  onChange,
  showAnswers,
}: {
  questions: PracticeQuestion[];
  responses: Record<string, string>;
  onChange: (qid: string, value: string) => void;
  showAnswers?: boolean;
}) {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div
          key={q.id}
          className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2"
        >
          <p className="font-medium text-gray-900 dark:text-white">
            {idx + 1}. {q.questionText}
          </p>
          {q.questionType === 'multiple_choice' || q.questionType === 'yes_no' ? (
            <div className="space-y-1">
              {(q.options.length ? q.options : ['Yes', 'No']).map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={responses[q.id] === opt}
                    onChange={() => onChange(q.id, opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <Textarea
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-sm"
              rows={2}
              value={responses[q.id] ?? ''}
              onChange={(e) => onChange(q.id, e.target.value)}
            />
          )}
          {showAnswers && q.correctAnswer && (
            <p className="text-xs text-gray-500">Answer: {q.correctAnswer}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function CoursePracticeSections({
  courseId,
  moduleId,
  lessonId,
  lessonTitle,
  lessonContent,
  courseTitle,
  courseProgress,
  model,
  disabled = false,
}: CoursePracticeSectionsProps) {
  const queryClient = useQueryClient();
  const filters = useMemo(
    () => ({ courseId, lessonId: lessonId ?? undefined, moduleId: moduleId ?? undefined }),
    [courseId, lessonId, moduleId]
  );

  const { data: listed } = useQuery({
    queryKey: queryKeys.knowledgeVault.practiceArtifacts(filters),
    queryFn: async () => {
      const res = await practiceArtifactsService.list({
        courseId,
        lessonId: lessonId ?? undefined,
        moduleId: moduleId ?? undefined,
        pageSize: 50,
      });
      if (!res.success || !res.data) return [];
      return res.data.data;
    },
  });

  const practiceSets = (listed ?? []).filter(
    (a): a is PracticeQuestionSet => a.artifactType === 'practice_question_set'
  );
  const quizzes = (listed ?? []).filter((a): a is QuizArtifact => a.artifactType === 'quiz');
  const homework = (listed ?? []).filter(
    (a): a is HomeworkAssignment => a.artifactType === 'homework_assignment'
  );

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizResponses, setQuizResponses] = useState<Record<string, string>>({});
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [lastAttemptScore, setLastAttemptScore] = useState<number | null>(null);

  const context = useMemo(
    () =>
      `Course: ${courseTitle}\nLesson: ${lessonTitle}\n\n${lessonContent || '(Generate lesson content first for richer practice.)'}`,
    [courseTitle, lessonTitle, lessonContent]
  );

  const sourceScope = useMemo(
    () => ({
      sourceType: lessonId
        ? ('lesson' as const)
        : moduleId
          ? ('module' as const)
          : ('course' as const),
      courseId,
      moduleId: moduleId ?? null,
      lessonId: lessonId ?? null,
      sourceItemIds: [] as string[],
    }),
    [courseId, moduleId, lessonId]
  );

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.practiceArtifacts() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.vaultItems() });
  }, [queryClient]);

  const generatePractice = async () => {
    setBusy('practice');
    setError(null);
    const gen = await aiCoursePracticeService.generatePracticeQuestions({
      context,
      sourceScope,
      model,
      count: 5,
    });
    if (!gen.success || !gen.data) {
      setError(gen.error || 'Failed to generate practice');
      setBusy(null);
      return;
    }
    const saved = await practiceArtifactsService.createPracticeSet({
      title: gen.data.title,
      questions: gen.data.questions,
      difficulty: gen.data.difficulty,
      sourceScope: gen.data.sourceScope,
    });
    if (!saved.success) setError(errText(saved.error, 'Failed to save practice set'));
    await invalidate();
    setBusy(null);
  };

  const generateQuiz = async () => {
    setBusy('quiz');
    setError(null);
    const gen = await aiCoursePracticeService.generateQuiz({
      context,
      sourceScope,
      model,
      count: 8,
      timeLimitMinutes: 30,
    });
    if (!gen.success || !gen.data) {
      setError(gen.error || 'Failed to generate quiz');
      setBusy(null);
      return;
    }
    const saved = await practiceArtifactsService.createQuiz({
      title: gen.data.title,
      questions: gen.data.questions,
      difficulty: gen.data.difficulty,
      adaptiveContextSummary: gen.data.adaptiveContextSummary,
      timeLimitMinutes: gen.data.timeLimitMinutes,
      sourceScope: gen.data.sourceScope,
    });
    if (!saved.success) setError(errText(saved.error, 'Failed to save quiz'));
    else if (saved.data) setActiveQuizId(saved.data.id);
    await invalidate();
    setBusy(null);
  };

  const generateHomework = async () => {
    setBusy('homework');
    setError(null);
    const gen = await aiCoursePracticeService.generateHomework({
      context,
      sourceScope,
      model,
      courseProgress,
      dueDays: 3,
    });
    if (!gen.success || !gen.data) {
      setError(gen.error || 'Failed to generate homework');
      setBusy(null);
      return;
    }
    const saved = await practiceArtifactsService.createHomework({
      title: gen.data.title,
      prompt: gen.data.prompt,
      deliverables: gen.data.deliverables,
      rubric: gen.data.rubric,
      dueDate: gen.data.suggestedDueDate,
      estimatedMinutes: gen.data.estimatedMinutes,
      sourceScope: gen.data.sourceScope,
    });
    if (!saved.success) setError(errText(saved.error, 'Failed to save homework'));
    await invalidate();
    setBusy(null);
  };

  const submitQuiz = async (quizId: string) => {
    setBusy('submit');
    const res = await practiceArtifactsService.submitQuizAttempt(quizId, quizResponses);
    if (res.success && res.data) {
      setLastAttemptScore(res.data.scorePercent);
      setQuizResponses({});
      setActiveQuizId(null);
    } else {
      setError(errText(res.error, 'Failed to submit quiz'));
    }
    await invalidate();
    setBusy(null);
  };

  const convertHomework = async (homeworkId: string) => {
    setBusy('task');
    const res = await practiceArtifactsService.convertHomeworkToTask(homeworkId, {
      createProjectForCourse: true,
    });
    if (!res.success) setError(errText(res.error, 'Failed to create task'));
    await invalidate();
    setBusy(null);
  };

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) ?? quizzes[0];

  useEffect(() => {
    if (!activeQuizId && quizzes.length > 0) setActiveQuizId(quizzes[0].id);
  }, [quizzes, activeQuizId]);

  return (
    <div className="mt-8 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Practice &amp; Assessment
      </h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-blue-600" />
            <h4 className="font-medium">Practice Questions</h4>
          </div>
          <button
            type="button"
            disabled={disabled || busy !== null}
            onClick={generatePractice}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            <Sparkles size={16} />
            {busy === 'practice' ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {practiceSets.length === 0 ? (
          <p className="text-sm text-gray-500">No practice sets yet for this scope.</p>
        ) : (
          practiceSets.map((set) => (
            <div key={set.id} className="space-y-2">
              <p className="text-sm font-medium">{set.title}</p>
              <QuestionList
                questions={set.questions}
                responses={{}}
                onChange={() => {}}
                showAnswers
              />
            </div>
          ))
        )}
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-amber-600" />
            <h4 className="font-medium">Quizzes</h4>
          </div>
          <button
            type="button"
            disabled={disabled || busy !== null}
            onClick={generateQuiz}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            <Sparkles size={16} />
            {busy === 'quiz' ? 'Generating…' : 'Generate Quiz'}
          </button>
        </div>
        {lastAttemptScore !== null && (
          <p className="text-sm text-green-700 dark:text-green-300">
            Last attempt score: {lastAttemptScore}%
          </p>
        )}
        {activeQuiz ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">{activeQuiz.title}</p>
            {activeQuiz.bestScorePercent != null && (
              <p className="text-xs text-gray-500">Best: {activeQuiz.bestScorePercent}%</p>
            )}
            <QuestionList
              questions={activeQuiz.questions}
              responses={quizResponses}
              onChange={(qid, val) => setQuizResponses((r) => ({ ...r, [qid]: val }))}
            />
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => submitQuiz(activeQuiz.id)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Submit Quiz
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No quizzes yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookMarked size={18} className="text-purple-600" />
            <h4 className="font-medium">Homework</h4>
          </div>
          <button
            type="button"
            disabled={disabled || busy !== null}
            onClick={generateHomework}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            <Sparkles size={16} />
            {busy === 'homework' ? 'Generating…' : 'Generate Homework'}
          </button>
        </div>
        {homework.length === 0 ? (
          <p className="text-sm text-gray-500">No homework assignments yet.</p>
        ) : (
          homework.map((hw) => (
            <div
              key={hw.id}
              className="rounded border border-gray-100 dark:border-gray-800 p-3 space-y-2"
            >
              <p className="font-medium text-sm">{hw.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {hw.prompt}
              </p>
              {hw.dueDate && <p className="text-xs text-gray-500">Due: {hw.dueDate}</p>}
              {hw.deliverables.length > 0 && (
                <ul className="text-xs list-disc pl-4 text-gray-600 dark:text-gray-400">
                  {hw.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy !== null || Boolean(hw.linkedTaskId)}
                  onClick={() => convertHomework(hw.id)}
                  className="px-3 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded disabled:opacity-50"
                >
                  {hw.linkedTaskId ? 'Linked to task' : 'Convert to Task'}
                </button>
                {hw.linkedTaskId && (
                  <a
                    href={`${ROUTES.admin.tasks}?highlight=${hw.linkedTaskId}`}
                    className="text-xs text-blue-600 underline"
                  >
                    View task
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
