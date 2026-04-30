import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { aiCourseGeneratorService } from '@/services/knowledge-vault';
import { vaultPrimitivesService } from '@/services/knowledge-vault/vault-primitives.service';
import type { PreAssessmentQuestion, DifficultyLevel } from '@/types/knowledge-vault';
import type { CourseGenerationProgress } from '@/services/knowledge-vault/course-generation/types';
import { ROUTES } from '@/routes';

type Step = 'topic' | 'assessment' | 'generating' | 'review';

const DIFFICULTIES: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

const WIZARD_STEPS = [
  { index: 1, label: 'Choose topic' },
  { index: 2, label: 'Take quiz' },
  { index: 3, label: 'Create course' },
] as const;

const SKELETON_PHASE_ORDER: CourseGenerationProgress['phase'][] = [
  'preparing',
  'streaming',
  'validating',
  'persisting',
  'done',
];

function wizardStepIndex(step: Step): 1 | 2 | 3 {
  if (step === 'topic') return 1;
  if (step === 'assessment') return 2;
  return 3;
}

export default function CourseGeneratorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [knowledgeSource, setKnowledgeSource] = useState<'global' | 'vault'>('global');

  useEffect(() => {
    const t = searchParams.get('topic');
    const d = searchParams.get('difficulty') as DifficultyLevel | null;
    if (t) setTopic(t);
    if (d && DIFFICULTIES.includes(d)) setDifficulty(d);
  }, [searchParams]);
  const [assessmentQuestions, setAssessmentQuestions] = useState<PreAssessmentQuestion[]>([]);
  const [assessmentResponses, setAssessmentResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<CourseGenerationProgress | null>(
    null
  );

  const buildAugmentedTopic = async (): Promise<{
    topic: string;
    knowledgeSource: 'global' | 'vault';
  }> => {
    const base = topic.trim();
    if (knowledgeSource === 'global') {
      return { topic: base, knowledgeSource: 'global' };
    }
    const jit = await vaultPrimitivesService.jitSearch(base);
    const hits =
      jit.success && jit.data?.hits
        ? (jit.data.hits as Array<{ title?: string; summary?: string | null }>)
        : [];
    const blob = hits
      .slice(0, 15)
      .map((h) => `### ${h.title ?? 'Note'}\n${h.summary ?? ''}`)
      .join('\n\n');
    const topicBlock = blob
      ? `${base}\n\n---\nMY_VAULT_ONLY — Use ONLY the following vault notes as factual sources. Do not invent beyond them.\n\n${blob}`
      : `${base}\n\n---\nMY_VAULT_ONLY — No vault snippets matched this topic; stay conservative and avoid hallucinating sources.`;
    return { topic: topicBlock, knowledgeSource: 'vault' };
  };

  const handleTopicSubmit = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await buildAugmentedTopic();
      const response = await aiCourseGeneratorService.generatePreAssessment({
        topic: payload.topic,
        targetDifficulty: difficulty,
        knowledgeSource: payload.knowledgeSource,
      });

      if (response.success && response.data) {
        setAssessmentQuestions(response.data.questions);
        setStep('assessment');
      } else {
        setError(response.error || 'Failed to generate assessment');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentSubmit = async () => {
    if (Object.keys(assessmentResponses).length < assessmentQuestions.length) {
      setError('Please answer all questions');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('generating');
    setGenerationProgress(null);

    const handleProgress = (progress: CourseGenerationProgress) => {
      setGenerationProgress(progress);
    };

    try {
      const payload = await buildAugmentedTopic();
      const completedAt = new Date().toISOString();
      const preAssessment = {
        questions: assessmentQuestions,
        userResponses: assessmentResponses,
        completedAt,
      };

      const skeletonResponse = await aiCourseGeneratorService.generateCourseSkeleton({
        topic: payload.topic,
        preAssessment,
        targetDifficulty: difficulty,
        knowledgeSource: payload.knowledgeSource,
        onProgress: handleProgress,
      });

      if (skeletonResponse.success && skeletonResponse.data) {
        const courseResponse = await aiCourseGeneratorService.createCourseFromSkeleton(
          skeletonResponse.data,
          {
            cleanTopic: topic.trim(),
            knowledgeSource: payload.knowledgeSource,
            aiGenerationContext: payload.knowledgeSource === 'vault' ? payload.topic : undefined,
            preAssessment,
          }
        );

        if (courseResponse.success && courseResponse.data) {
          setGeneratedCourseId(courseResponse.data.id);
          setStep('review');
        } else {
          setError(courseResponse.error || 'Failed to create course');
          setStep('assessment');
        }
      } else {
        const errorMsg = skeletonResponse.error || 'Failed to generate course';
        console.error('Course generation error:', errorMsg);
        setError(errorMsg);
        setStep('assessment');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      console.error('Unexpected error during course generation:', err);
      setError(errorMsg);
      setStep('assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAssessmentResponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const activeWizardStep = wizardStepIndex(step);

  const handleHeaderBack = () => {
    if (step === 'assessment') setStep('topic');
    else if (step === 'review') navigate(ROUTES.admin.knowledgeVaultCourses);
  };

  const showHeaderBack = step === 'assessment' || step === 'review';

  const handleCancelGeneration = () => {
    aiCourseGeneratorService.cancelInFlightCourseSkeleton();
    setStep('assessment');
    setError('Generation was cancelled.');
    setLoading(false);
    setGenerationProgress(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        {showHeaderBack ? (
          <button
            type="button"
            onClick={handleHeaderBack}
            aria-label={step === 'assessment' ? 'Back to choose topic' : 'Back to courses list'}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-10" aria-hidden />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Course Generator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a personalized learning course tailored to your needs
          </p>
        </div>
      </div>

      <nav
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        aria-label="Course creation steps"
      >
        {WIZARD_STEPS.map((s, i) => {
          const isCurrent = activeWizardStep === s.index;
          const isDone = activeWizardStep > s.index;
          return (
            <div key={s.index} className="flex items-center gap-2">
              <div
                className={`flex flex-col items-center gap-1 ${isCurrent ? 'font-semibold' : ''}`}
              >
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isDone || isCurrent
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {s.index}
                </div>
                <span
                  className={`text-xs text-center max-w-[7rem] ${
                    isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className="hidden sm:block w-12 h-1 bg-gray-300 dark:bg-gray-700 mx-1"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </nav>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {step === 'topic' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            What do you want to learn?
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., React Hooks, Python Data Science, AWS Lambda"
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Knowledge source
              </label>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setKnowledgeSource('global')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    knowledgeSource === 'global'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Global Web
                </button>
                <button
                  type="button"
                  onClick={() => setKnowledgeSource('vault')}
                  className={`flex-1 px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 ${
                    knowledgeSource === 'vault'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  My Vault Only
                </button>
              </div>
              {knowledgeSource === 'vault' && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Course prompts will include retrieved vault notes only (semantic JIT); stay within
                  that material.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Target Difficulty Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DIFFICULTIES.map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-3 rounded-lg border-2 transition capitalize ${
                      difficulty === level
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTopicSubmit}
              disabled={loading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition text-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Generating Assessment...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'assessment' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Quick Assessment
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Help us understand your current knowledge level to personalize your course
          </p>

          <div className="space-y-6 mb-8">
            {assessmentQuestions.map((question, index) => (
              <div key={question.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white mb-3">
                  {index + 1}. {question.questionText}
                </p>

                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={assessmentResponses[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('topic')}
              aria-label="Back to choose topic"
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Back
            </button>
            <button
              onClick={handleAssessmentSubmit}
              disabled={
                loading || Object.keys(assessmentResponses).length < assessmentQuestions.length
              }
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
            >
              <Sparkles size={20} />
              <span>Generate My Course</span>
            </button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <Sparkles size={32} className="text-green-600 dark:text-green-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Generating Your Course
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AI is creating a personalized learning path just for you...
            </p>
            <button
              type="button"
              onClick={handleCancelGeneration}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
            >
              Cancel generation
            </button>
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

              {/* Phase Indicators (backend-driven: preparing → streaming → validating → persisting → done) */}
              <div className="space-y-3">
                {[
                  { phase: 'preparing' as const, label: 'Preparing', icon: '⚙️' },
                  { phase: 'streaming' as const, label: 'Generating outline', icon: '✨' },
                  { phase: 'validating' as const, label: 'Validating structure', icon: '✓' },
                  { phase: 'persisting' as const, label: 'Saving to cache', icon: '💾' },
                  { phase: 'done' as const, label: 'Complete', icon: '✅' },
                ].map((phaseInfo, index) => {
                  const isActive = generationProgress.phase === phaseInfo.phase;
                  const currentIdx = SKELETON_PHASE_ORDER.indexOf(generationProgress.phase);
                  const isCompleted = currentIdx > index;

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
                      {isCompleted && <div className="text-green-600 dark:text-green-400">✓</div>}
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
      )}

      {step === 'review' && generatedCourseId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <Sparkles size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Your Course is Ready!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We've created a personalized {topic} course tailored to your knowledge level
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(ROUTES.admin.knowledgeVaultCourses)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Back to Courses
            </button>
            <button
              onClick={() => navigate(`${ROUTES.admin.knowledgeVaultCourses}/${generatedCourseId}`)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
            >
              Start Learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
