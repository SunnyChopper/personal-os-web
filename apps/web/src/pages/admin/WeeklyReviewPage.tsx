import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ListChecks,
  Loader2,
  Lock,
  PenLine,
  Radio,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { CelebrationEffect } from '@/components/atoms/CelebrationEffect';
import { VelocityChart } from '@/components/molecules/VelocityChart';
import { AISuggestedTasks } from '@/components/organisms/AISuggestedTasks';
import { BlockerResolution } from '@/components/organisms/BlockerResolution';
import { QuarantineZone } from '@/components/organisms/QuarantineZone';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import {
  useWeeklyReviewCurrent,
  useWeeklyReviewList,
  useWeeklyReviewMutations,
  useWeeklyReviewSnapshot,
} from '@/hooks/useWeeklyReview';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import type {
  WeeklyReviewBlockerResolution,
  WeeklyReviewQuarantineDecision,
  WeeklyReviewAcceptedTask,
  WeeklyReviewSuggestedTask,
  WeeklyReviewCurrentDashboard,
} from '@/types/growth-system';

type Step = 'review' | 'plan' | 'complete';

const cardClass =
  'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';

function shellClass(isHistorical: boolean) {
  return cn(
    'rounded-xl border transition-colors',
    isHistorical
      ? 'border-slate-200/90 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/40'
      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-none'
  );
}

export default function WeeklyReviewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const weekFromUrl = searchParams.get('week');
  const { showToast, ToastContainer } = useToast();

  const {
    data: current,
    isLoading: currentLoading,
    isError: currentIsError,
    error: currentErr,
    refetch: refetchCurrent,
  } = useWeeklyReviewCurrent();
  const { data: listData } = useWeeklyReviewList(1, 30);

  const effectiveWeekStart = useMemo(() => {
    if (weekFromUrl) return weekFromUrl;
    if (current?.hasGeneratedReview) return current.weekStart;
    return null;
  }, [weekFromUrl, current]);

  const liveWeekKey = useMemo(
    () => Boolean(current && effectiveWeekStart && effectiveWeekStart === current.weekStart),
    [current, effectiveWeekStart]
  );

  const {
    data: snapshot,
    isLoading: snapshotLoading,
    isError: snapshotIsError,
    error: snapshotErr,
    refetch: refetchSnapshot,
  } = useWeeklyReviewSnapshot(effectiveWeekStart, {
    refetchInterval: (query) => {
      if (!liveWeekKey) return false;
      const d = query.state.data;
      if (d != null && d.status === 'completed') return false;
      return 45_000;
    },
  });

  const isHistorical = useMemo(
    () => Boolean(snapshot && (!liveWeekKey || snapshot.status === 'completed')),
    [snapshot, liveWeekKey]
  );

  const { tasks } = useGrowthSystemDashboard({ includeCompleted: true });
  const blockedTasks = useMemo(() => tasks.filter((t) => t.status === 'Blocked'), [tasks]);

  const { generate, savePlan, complete, suggestTasks, discard } =
    useWeeklyReviewMutations(effectiveWeekStart);

  const derivedStep = useMemo((): Step => {
    if (!snapshot) return 'review';
    if (snapshot.status === 'completed') return 'complete';
    if (snapshot.status === 'planned') return 'plan';
    return 'review';
  }, [snapshot]);

  const [stepOverride, setStepOverride] = useState<Step | null>(null);
  const step = stepOverride ?? derivedStep;

  const [quarantineDecisions, setQuarantineDecisions] = useState<WeeklyReviewQuarantineDecision[]>(
    []
  );
  const [blockerResolutions, setBlockerResolutions] = useState<WeeklyReviewBlockerResolution[]>([]);
  const [suggestedAccepted, setSuggestedAccepted] = useState<WeeklyReviewAcceptedTask[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<WeeklyReviewSuggestedTask[]>([]);
  const [celebrateComplete, setCelebrateComplete] = useState(false);

  useEffect(() => {
    // Reset stepper when navigating to another week (server is source of truth for status).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on week key change
    setStepOverride(null);
  }, [snapshot?.weekStart]);

  useEffect(() => {
    if (!snapshot) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate planning UI from snapshot
    setAiSuggestions(snapshot.aiAnalysis.suggestedTasks ?? []);
    if (snapshot.planActions) {
      setQuarantineDecisions(snapshot.planActions.quarantineDecisions ?? []);
      setBlockerResolutions(snapshot.planActions.blockerResolutions ?? []);
      setSuggestedAccepted(snapshot.planActions.suggestedTasksAccepted ?? []);
    } else {
      setQuarantineDecisions([]);
      setBlockerResolutions([]);
      setSuggestedAccepted([]);
    }
  }, [snapshot]);

  const selectWeek = useCallback(
    (ws: string | null) => {
      if (!ws) {
        searchParams.delete('week');
      } else {
        searchParams.set('week', ws);
      }
      setSearchParams(searchParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleGenerate = async () => {
    const res = await generate.mutateAsync(undefined);
    selectWeek(res.weekStart);
    await refetchSnapshot();
  };

  const handleSavePlan = async () => {
    if (!effectiveWeekStart || isHistorical) return;
    await savePlan.mutateAsync({
      quarantineDecisions,
      blockerResolutions,
      suggestedTasksAccepted: suggestedAccepted,
    });
    setStepOverride('complete');
  };

  const handleComplete = async () => {
    if (!effectiveWeekStart || isHistorical) return;
    await complete.mutateAsync();
    await refetchSnapshot();
    setCelebrateComplete(true);
  };

  const refreshSuggestions = async () => {
    if (isHistorical) return;
    const next = await suggestTasks.mutateAsync(effectiveWeekStart ?? undefined);
    setAiSuggestions(next);
  };

  const handleDiscardDraft = async () => {
    if (!effectiveWeekStart) return;
    if (
      !confirm(
        'Remove this weekly review draft? Your tasks and habits stay as they are. You can run a fresh review later.'
      )
    ) {
      return;
    }
    try {
      await discard.mutateAsync(effectiveWeekStart);
      selectWeek(null);
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Could not remove the draft. Check your connection or try again.';
      showToast({
        type: 'error',
        title: 'Could not remove draft review',
        message,
        duration: 8000,
      });
    }
  };

  const showMidWeek =
    current && !weekFromUrl && !current.hasGeneratedReview && current.isMidWeek && !snapshot;

  const loading = currentLoading || (Boolean(effectiveWeekStart) && snapshotLoading);

  const showEmpty =
    Boolean(current) &&
    !loading &&
    !currentIsError &&
    !snapshotIsError &&
    !showMidWeek &&
    !snapshot;

  const pastReviewsSelect =
    listData && listData.reviews.length > 0 ? (
      <label className="flex flex-col gap-1.5 text-sm text-gray-600 dark:text-gray-400 sm:items-end">
        <span className="font-medium text-gray-700 dark:text-gray-300">Past reviews</span>
        <div className="relative">
          <select
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={weekFromUrl ?? ''}
            onChange={(e) => selectWeek(e.target.value || null)}
          >
            <option value="">Current / auto</option>
            {listData.reviews.map((r) => (
              <option key={r.weekStart} value={r.weekStart}>
                Week of {r.weekStart} ({r.status})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </label>
    ) : null;

  return (
    <div className="flex w-full justify-center px-3 sm:px-4">
      <ToastContainer />
      <CelebrationEffect
        show={celebrateComplete}
        type="criteria_completed"
        message="Week committed!"
        onComplete={() => setCelebrateComplete(false)}
      />
      <div className="w-full max-w-6xl text-gray-900 dark:text-gray-100">
        <header className="mb-6 flex flex-col gap-4 border-b border-gray-200/80 pb-6 dark:border-gray-800 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 text-center md:text-left">
            <div className="flex flex-col items-center gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                Weekly Review & Planning
              </h1>
              {snapshot && (
                <WeekContextBadge isHistorical={isHistorical} weekStart={snapshot.weekStart} />
              )}
              {!snapshot && current && (showMidWeek || showEmpty) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live week
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 md:text-base">
              Reflect on the past week and plan for success ahead
            </p>
          </div>
          {pastReviewsSelect && (
            <div className="flex shrink-0 justify-center md:justify-end">{pastReviewsSelect}</div>
          )}
        </header>

        {currentIsError && (
          <div
            className={`mb-6 flex flex-col items-center justify-center gap-4 p-8 text-center ${cardClass}`}
            role="alert"
          >
            <AlertCircle className="h-10 w-10 text-red-500" aria-hidden />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Could not load weekly review
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Check the technical details below if you need to debug.
              </p>
              {currentErr instanceof Error && currentErr.message && (
                <pre
                  className="mt-3 max-h-72 w-full max-w-2xl overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-left font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-950/80 dark:text-gray-300"
                  tabIndex={0}
                >
                  {currentErr.message}
                </pre>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => void refetchCurrent()}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {snapshotIsError && effectiveWeekStart && !currentIsError && (
          <div
            className={`mb-6 flex flex-col items-center justify-center gap-4 p-8 text-center ${cardClass}`}
            role="alert"
          >
            <AlertCircle className="h-10 w-10 text-red-500" aria-hidden />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Could not load this week</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Check the technical details below (often lists the exact field the API rejected).
              </p>
              {snapshotErr instanceof Error && snapshotErr.message && (
                <pre
                  className="mt-3 max-h-72 w-full max-w-2xl overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-left font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-950/80 dark:text-gray-300"
                  tabIndex={0}
                >
                  {snapshotErr.message}
                </pre>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => void refetchSnapshot()}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="secondary" onClick={() => selectWeek(null)}>
                Back to current
              </Button>
            </div>
          </div>
        )}

        {loading && !currentIsError && !(snapshotIsError && effectiveWeekStart) && (
          <div
            className={`flex min-h-[240px] flex-col items-center justify-center gap-4 p-10 ${cardClass}`}
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentLoading ? 'Loading your weekly review…' : 'Loading this week’s snapshot…'}
            </p>
          </div>
        )}

        {showMidWeek && current && !loading && (
          <div className="space-y-6">
            <div className={`p-6 ${cardClass}`}>
              <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                Current week progress
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Week {current.weekStart} → {current.weekEnd}. Your automated review will run on your
                scheduled day; you can also generate it now.
              </p>
              <VelocityChart weeks={current.velocityData} currentWeekStart={current.weekStart} />
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                <MetricWidget
                  label="Tasks done"
                  value={current.statsPartial.tasksCompleted}
                  accent="text-gray-900 dark:text-white"
                  icon={CheckCircle}
                  muted={false}
                />
                <MetricWidget
                  label="Habit logs"
                  value={current.statsPartial.habitCompletions}
                  accent="text-emerald-500 dark:text-emerald-400"
                  icon={Activity}
                  muted={false}
                />
                <MetricWidget
                  label="Goals active"
                  value={current.statsPartial.goalsActive}
                  accent="text-violet-500 dark:text-violet-400"
                  icon={Target}
                  muted={false}
                />
                <MetricWidget
                  label="Metrics"
                  value={current.statsPartial.metricsLogged}
                  accent="text-amber-500 dark:text-amber-400"
                  icon={BarChart2}
                  muted={false}
                />
                <MetricWidget
                  label="Journal"
                  value={current.statsPartial.journalEntries}
                  accent="text-cyan-500 dark:text-cyan-400"
                  icon={BookOpen}
                  muted={false}
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="primary" onClick={handleGenerate} disabled={generate.isPending}>
                  {generate.isPending ? 'Generating…' : 'Run weekly review now'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {snapshot && !loading && (
          <div className={cn('flex flex-col gap-8 lg:flex-row', isHistorical && 'opacity-[0.97]')}>
            <aside className="shrink-0 lg:w-56">
              <div className="lg:sticky lg:top-20">
                <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 lg:block">
                  Steps
                </p>
                <div className="hidden lg:block">
                  <Stepper
                    layout="vertical"
                    step={step}
                    onStep={setStepOverride}
                    archived={isHistorical}
                  />
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1 space-y-6">
              <div className="lg:hidden">
                <Stepper
                  layout="horizontal"
                  step={step}
                  onStep={setStepOverride}
                  archived={isHistorical}
                />
              </div>

              {isHistorical && (
                <div
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-100/80 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 md:flex-row md:items-center md:justify-between"
                  role="status"
                >
                  <div className="flex items-start gap-3">
                    <Lock
                      className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400"
                      aria-hidden
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {!liveWeekKey ? 'Historical week' : 'Week locked in'}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        {!liveWeekKey
                          ? 'This snapshot is read-only. Numbers and AI text reflect the saved review, not live task completion.'
                          : 'This week’s review is committed. Planning actions and sprint updates are closed.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {liveWeekKey && snapshot.status !== 'completed' && (
                <div
                  className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50/90 p-4 text-sm dark:border-blue-900/50 dark:bg-blue-950/35 md:flex-row md:items-center md:justify-between"
                  role="status"
                >
                  <div className="space-y-2 md:max-w-2xl">
                    <span className="inline-flex w-fit items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Week in progress
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">
                      The summary tiles and story-point velocity update as you complete tasks
                      (through today). AI insights are still from when you first generated this
                      review—run a new one later if you want them refreshed.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="inline-flex shrink-0 items-center gap-2 self-start md:self-center"
                    onClick={() => void handleDiscardDraft()}
                    disabled={discard.isPending}
                  >
                    {discard.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Remove draft review
                  </Button>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  role="tabpanel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 'review' && (
                    <div className="space-y-6">
                      <div className={`p-6 ${shellClass(isHistorical)}`}>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          Week summary
                        </h2>
                        <div className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-5">
                          <MetricWidget
                            label="Tasks done"
                            value={snapshot.stats.tasksCompleted}
                            accent="text-gray-900 dark:text-white"
                            icon={CheckCircle}
                            muted={isHistorical}
                          />
                          <MetricWidget
                            label="Habit logs"
                            value={snapshot.stats.habitCompletions}
                            accent="text-emerald-500 dark:text-emerald-400"
                            icon={Activity}
                            muted={isHistorical}
                          />
                          <MetricWidget
                            label="Goals active"
                            value={snapshot.stats.goalsActive}
                            accent="text-violet-500 dark:text-violet-400"
                            icon={Target}
                            muted={isHistorical}
                          />
                          <MetricWidget
                            label="Metrics"
                            value={snapshot.stats.metricsLogged}
                            accent="text-amber-500 dark:text-amber-400"
                            icon={BarChart2}
                            muted={isHistorical}
                          />
                          <MetricWidget
                            label="Journal"
                            value={snapshot.stats.journalEntries}
                            accent="text-cyan-500 dark:text-cyan-400"
                            icon={BookOpen}
                            muted={isHistorical}
                          />
                        </div>
                        <VelocityChart
                          weeks={snapshot.velocityData}
                          currentWeekStart={snapshot.weekStart}
                          className="mt-4 border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      <div className={`p-6 ${shellClass(isHistorical)}`}>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                          <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                          AI insights
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <InsightCard
                            title="Tasks & velocity"
                            body={snapshot.aiAnalysis.tasksSummary}
                            icon={ListChecks}
                            muted={isHistorical}
                          />
                          <InsightCard
                            title="Habits"
                            body={`${snapshot.aiAnalysis.habitsSummary}\n\n${snapshot.aiAnalysis.habitsAiMessage}`}
                            icon={Activity}
                            muted={isHistorical}
                          />
                          <InsightCard
                            title="Metrics"
                            body={snapshot.aiAnalysis.metricsSummary}
                            icon={BarChart2}
                            muted={isHistorical}
                          />
                          <InsightCard
                            title="Goals & projects"
                            body={snapshot.aiAnalysis.goalsSummary}
                            icon={Target}
                            muted={isHistorical}
                          />
                          <InsightCard
                            title="Logbook"
                            body={snapshot.aiAnalysis.logbookSummary}
                            icon={BookOpen}
                            muted={isHistorical}
                          />
                          {snapshot.aiAnalysis.reflectionPrompt && (
                            <InsightCard
                              title="Reflection"
                              body={snapshot.aiAnalysis.reflectionPrompt}
                              icon={PenLine}
                              muted={isHistorical}
                              className="md:col-span-2 xl:col-span-3"
                            />
                          )}
                        </div>
                        {snapshot.aiAnalysis.overdueTasks.length > 0 && (
                          <div className="mt-4 rounded-lg border border-rose-900/40 bg-rose-950/20 p-3 text-sm text-rose-100">
                            <p className="font-medium text-rose-200">Missed due dates</p>
                            <ul className="mt-1 list-disc pl-5">
                              {snapshot.aiAnalysis.overdueTasks.map((t) => (
                                <li key={t.taskId}>
                                  {t.title}: {t.note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button variant="primary" onClick={() => setStepOverride('plan')}>
                          Continue to planning
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 'plan' && (
                    <div className="space-y-8">
                      <section className={`p-6 ${shellClass(isHistorical)}`}>
                        <h3 className="text-md mb-3 font-semibold text-amber-800 dark:text-amber-200">
                          Quarantine zone
                        </h3>
                        <QuarantineZone
                          candidates={snapshot.aiAnalysis.quarantineCandidates}
                          decisions={quarantineDecisions}
                          onChange={setQuarantineDecisions}
                          readOnly={isHistorical}
                        />
                      </section>
                      <section className={`p-6 ${shellClass(isHistorical)}`}>
                        <h3 className="text-md mb-3 font-semibold text-gray-900 dark:text-white">
                          Blocker resolution
                        </h3>
                        <BlockerResolution
                          tasks={blockedTasks}
                          resolutions={blockerResolutions}
                          onChange={setBlockerResolutions}
                          readOnly={isHistorical}
                        />
                      </section>
                      <section className={`p-6 ${shellClass(isHistorical)}`}>
                        <AISuggestedTasks
                          suggestions={aiSuggestions}
                          accepted={suggestedAccepted}
                          onAdd={(t) => setSuggestedAccepted((s) => [...s, t])}
                          onRefresh={refreshSuggestions}
                          loading={suggestTasks.isPending}
                          readOnly={isHistorical}
                        />
                      </section>
                      <div className="flex justify-between">
                        <Button variant="secondary" onClick={() => setStepOverride('review')}>
                          Back
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => void handleSavePlan()}
                          disabled={savePlan.isPending || isHistorical}
                        >
                          {savePlan.isPending ? 'Saving…' : 'Save & finalize'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 'complete' && (
                    <div
                      className={`relative overflow-hidden p-8 text-center sm:p-10 ${shellClass(isHistorical)}`}
                    >
                      {!isHistorical && (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
                      )}
                      <div className="relative">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/30">
                          <CheckSquare className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900 dark:text-white">
                          {snapshot.status === 'completed' ? 'Locked in!' : 'Ready to commit'}
                        </h2>
                        <p className="mx-auto mb-4 max-w-lg text-gray-600 dark:text-gray-300">
                          {snapshot.completionSummary?.hypeMessage ||
                            snapshot.aiAnalysis.hypeSummary ||
                            "You're set for the week ahead."}
                        </p>
                        {snapshot.completionSummary?.sprintTaskIds &&
                          snapshot.completionSummary.sprintTaskIds.length > 0 && (
                            <p className="mb-6 text-sm text-gray-500 dark:text-gray-500">
                              {snapshot.completionSummary.sprintTaskIds.length} new tasks added to
                              your board.
                            </p>
                          )}
                        <div className="flex flex-wrap justify-center gap-3">
                          {!isHistorical && snapshot.status !== 'completed' && (
                            <Button
                              variant="primary"
                              onClick={() => void handleComplete()}
                              disabled={complete.isPending}
                            >
                              {complete.isPending ? 'Committing…' : 'Confirm & update sprint'}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => navigate(ROUTES.admin.dashboard)}
                          >
                            Dashboard
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {showEmpty && current && (
          <WeeklyReviewEmptyState
            current={current}
            hasPastReviews={Boolean(listData && listData.reviews.length > 0)}
            onGenerate={handleGenerate}
            generating={generate.isPending}
          />
        )}
      </div>
    </div>
  );
}

function WeekContextBadge({
  isHistorical,
  weekStart,
}: {
  isHistorical: boolean;
  weekStart: string;
}) {
  if (isHistorical) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-600/15 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-500/25 dark:text-slate-300">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Archived · {weekStart}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
      <span className="relative flex h-3.5 w-3.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <Radio className="relative h-3.5 w-3.5" />
      </span>
      Live week · {weekStart}
    </span>
  );
}

function WeeklyReviewEmptyState({
  current,
  hasPastReviews,
  onGenerate,
  generating,
}: {
  current: WeeklyReviewCurrentDashboard;
  hasPastReviews: boolean;
  onGenerate: () => Promise<void>;
  generating: boolean;
}) {
  const earlyWeek = !current.hasGeneratedReview && !current.isMidWeek;

  return (
    <div className={`p-8 ${cardClass}`}>
      <div className="mx-auto max-w-lg text-center">
        <Calendar className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          {earlyWeek ? 'Review opens mid-week' : 'No review to show yet'}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {earlyWeek ? (
            <>
              You&apos;re in{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                week starting {current.weekStart}
              </span>{' '}
              through {current.weekEnd}. The guided flow usually appears after mid-week; you can
              also run an on-demand review anytime. Set your preferred day (and email) in Settings.
            </>
          ) : (
            <>
              We couldn&apos;t load a snapshot for the current view. Run an on-demand review or
              choose another week
              {hasPastReviews ? ' from Past reviews' : ''}.
            </>
          )}
        </p>
        {!hasPastReviews && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            After your first run, completed weeks appear in the Past reviews menu.
          </p>
        )}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={() => void onGenerate()} disabled={generating}>
            {generating ? 'Generating…' : 'Run weekly review now'}
          </Button>
          <Link
            to={ROUTES.admin.settings}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Schedule &amp; email in Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricWidget({
  label,
  value,
  accent,
  icon: Icon,
  muted,
}: {
  label: string;
  value: number;
  accent: string;
  icon: ComponentType<{ className?: string }>;
  muted: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-left transition-colors',
        muted
          ? 'border-slate-200/90 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/35'
          : 'border-blue-200/60 bg-gradient-to-br from-white to-blue-50/50 dark:border-blue-900/45 dark:from-gray-800 dark:to-blue-950/25'
      )}
    >
      <Icon className={cn('h-5 w-5', accent)} aria-hidden />
      <div className={cn('mt-2 text-2xl font-bold tabular-nums', accent)}>{value}</div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function InsightCard({
  title,
  body,
  icon: Icon,
  muted,
  className,
}: {
  title: string;
  body: string;
  icon: ComponentType<{ className?: string }>;
  muted: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 shadow-sm',
        muted
          ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/35'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/90',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-700/80">
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            muted ? 'text-slate-500 dark:text-slate-400' : 'text-blue-600 dark:text-blue-400'
          )}
          aria-hidden
        />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{body}</p>
    </div>
  );
}

function Stepper({
  step,
  onStep,
  layout = 'horizontal',
  archived = false,
}: {
  step: Step;
  onStep: (s: Step) => void;
  layout?: 'horizontal' | 'vertical';
  archived?: boolean;
}) {
  const items: { id: Step; label: string }[] = [
    { id: 'review', label: 'Review' },
    { id: 'plan', label: 'Plan' },
    { id: 'complete', label: 'Complete' },
  ];

  const labelActive = archived
    ? 'text-slate-800 dark:text-slate-200'
    : 'text-blue-600 dark:text-blue-400';
  const labelIdle = 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200';
  const circleActive = archived
    ? 'bg-slate-600 text-white dark:bg-slate-500'
    : 'bg-blue-600 text-white';
  const circleIdle = 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300';

  if (layout === 'vertical') {
    return (
      <nav aria-label="Weekly review steps" className="flex flex-col">
        {items.map((it, idx) => (
          <div key={it.id} className="flex gap-3">
            <div className="flex w-8 shrink-0 flex-col items-center">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  step === it.id ? circleActive : circleIdle
                )}
              >
                {idx + 1}
              </span>
              {idx < items.length - 1 ? (
                <span
                  className={cn(
                    'my-1 min-h-[1.25rem] w-px grow basis-0',
                    archived ? 'bg-slate-300 dark:bg-slate-600' : 'bg-blue-200 dark:bg-blue-900/60'
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onStep(it.id)}
              className={cn(
                'mb-3 flex min-w-0 flex-1 items-center rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                step === it.id
                  ? archived
                    ? 'border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80'
                    : 'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/40'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50',
                step === it.id ? labelActive : labelIdle
              )}
            >
              {it.label}
            </button>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Weekly review steps"
      className="flex flex-wrap items-center justify-center gap-2 md:gap-4"
    >
      {items.map((it, idx) => (
        <div key={it.id} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onStep(it.id)}
            className={cn(
              'flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium transition',
              step === it.id ? labelActive : labelIdle
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm',
                step === it.id ? circleActive : circleIdle
              )}
            >
              {idx + 1}
            </span>
            {it.label}
          </button>
          {idx < items.length - 1 && (
            <ArrowRight className="hidden h-4 w-4 text-gray-400 dark:text-gray-600 sm:block" />
          )}
        </div>
      ))}
    </nav>
  );
}
