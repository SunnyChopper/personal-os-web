import { useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { localCalendarDate, addCalendarDays } from '@/lib/date/local-calendar';
import {
  useFitnessExercises,
  useFitnessTemplates,
  useFitnessSessions,
  useFitnessSessionSets,
  useOverloadSuggestion,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useAddSetMutation,
  useUpdateSetMutation,
  useCreateExerciseMutation,
  useCreateTemplateMutation,
} from '@/hooks/useFitness';
import type { FitnessExercise, WorkoutSession, WorkoutSet, WorkoutTemplate } from '@/types/fitness';

export default function HealthFitnessWorkoutsPage() {
  const today = localCalendarDate();
  const start = addCalendarDays(today, -30);

  const { data: exRes, isLoading: exLoad } = useFitnessExercises(1, 100);
  const { data: tplRes, isLoading: tplLoad } = useFitnessTemplates(1, 50);
  const { data: sessRes, isLoading: sessLoad } = useFitnessSessions({
    page: 1,
    pageSize: 50,
    startDate: start,
    endDate: today,
  });

  const exercises = exRes?.success ? exRes.data?.data ?? [] : [];
  const templates = tplRes?.success ? tplRes.data?.data ?? [] : [];
  const sessions = sessRes?.success ? sessRes.data?.data ?? [] : [];

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) => (a.sessionDate < b.sessionDate ? 1 : a.sessionDate > b.sessionDate ? -1 : 0)),
    [sessions]
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const activeSession =
    selectedSessionId != null
      ? sortedSessions.find((s) => s.id === selectedSessionId) ?? null
      : sortedSessions.find((s) => s.sessionDate === today) ?? sortedSessions[0] ?? null;

  const sessionId = selectedSessionId ?? activeSession?.id ?? null;

  const { data: setsRes } = useFitnessSessionSets(sessionId);
  const sets = setsRes?.success ? setsRes.data?.data ?? [] : [];

  const createSession = useCreateSessionMutation();
  const updateSession = useUpdateSessionMutation();
  const addSet = useAddSetMutation(sessionId);
  const updateSet = useUpdateSetMutation(sessionId);
  const createExercise = useCreateExerciseMutation();
  const createTemplate = useCreateTemplateMutation();

  const [newExName, setNewExName] = useState('');
  const [tplName, setTplName] = useState('');
  const [tplExerciseIds, setTplExerciseIds] = useState<string[]>([]);
  const [startTemplateId, setStartTemplateId] = useState<string>('');

  const [addExerciseId, setAddExerciseId] = useState<string>('');
  const { data: overloadRes } = useOverloadSuggestion(addExerciseId || null);
  const overload = overloadRes?.success ? overloadRes.data : null;

  const exById = useMemo(() => {
    const m = new Map<string, FitnessExercise>();
    exercises.forEach((e) => m.set(e.id, e));
    return m;
  }, [exercises]);

  const setsByExercise = useMemo(() => {
    const m = new Map<string, WorkoutSet[]>();
    sets.forEach((s) => {
      const arr = m.get(s.exerciseId) ?? [];
      arr.push(s);
      m.set(s.exerciseId, arr);
    });
    m.forEach((arr, k) => {
      arr.sort((a, b) => a.setIndex - b.setIndex);
      m.set(k, arr);
    });
    return m;
  }, [sets]);

  const currentSession = sortedSessions.find((s) => s.id === sessionId);
  const sessionTpl: WorkoutTemplate | undefined = templates.find(
    (t) => t.id === currentSession?.templateId
  );

  const startFromTemplate = async () => {
    const res = await createSession.mutateAsync({
      templateId: startTemplateId || undefined,
      sessionDate: today,
    });
    if (res.success && res.data) {
      setSelectedSessionId(res.data.id);
    }
  };

  const nextSetIndexFor = (exerciseId: string) => {
    const cur = setsByExercise.get(exerciseId) ?? [];
    if (cur.length === 0) return 0;
    return Math.max(...cur.map((s) => s.setIndex)) + 1;
  };

  const submitSet = async () => {
    if (!sessionId || !addExerciseId) return;
    const ex = exById.get(addExerciseId);
    const targetReps = ex?.defaultRepRangeMax ?? 8;
    const weight = overload?.nextSuggestedWeight ?? 0;
    await addSet.mutateAsync({
      exerciseId: addExerciseId,
      setIndex: nextSetIndexFor(addExerciseId),
      targetReps,
      weight,
      completedReps: targetReps,
      isSuccessful: true,
      setType: 'working',
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-violet-600 dark:text-violet-400">
          <Dumbbell className="h-6 w-6" />
          <span className="text-sm font-medium">Workouts</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sessions & overload</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Progressive overload hints from your last successful working sets. Story points stay in Growth System.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Library</h2>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="flex flex-1 flex-wrap items-end gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              New exercise
              <input
                className="mt-1 block w-48 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-950"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Bench press"
              />
            </label>
            <button
              type="button"
              disabled={!newExName.trim() || createExercise.isPending}
              onClick={async () => {
                await createExercise.mutateAsync({ name: newExName.trim() });
                setNewExName('');
              }}
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
            >
              Add exercise
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">New template (toggle exercises)</span>
            <input
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-950"
              placeholder="Template name"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
            />
            <div className="max-h-28 overflow-y-auto rounded border border-gray-200 p-2 text-xs dark:border-gray-700">
              {exLoad && <span>Loading exercises…</span>}
              {!exLoad &&
                exercises.map((e) => (
                  <label key={e.id} className="flex cursor-pointer items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked={tplExerciseIds.includes(e.id)}
                      onChange={() =>
                        setTplExerciseIds((ids) =>
                          ids.includes(e.id) ? ids.filter((x) => x !== e.id) : [...ids, e.id]
                        )
                      }
                    />
                    {e.name}
                  </label>
                ))}
            </div>
            <button
              type="button"
              disabled={!tplName.trim() || tplExerciseIds.length === 0 || createTemplate.isPending}
              onClick={async () => {
                await createTemplate.mutateAsync({
                  name: tplName.trim(),
                  exerciseIds: tplExerciseIds,
                });
                setTplName('');
                setTplExerciseIds([]);
              }}
              className="w-fit rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Save template
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Session</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Template
            <select
              className="mt-1 block min-w-[200px] rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={startTemplateId}
              onChange={(e) => setStartTemplateId(e.target.value)}
            >
              <option value="">— none —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={startFromTemplate}
            disabled={createSession.isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            New session ({today})
          </button>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Active session
            <select
              className="mt-1 block min-w-[240px] rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-950"
              value={sessionId ?? ''}
              onChange={(e) => setSelectedSessionId(e.target.value || null)}
            >
              <option value="">— select —</option>
              {sortedSessions.map((s: WorkoutSession) => (
                <option key={s.id} value={s.id}>
                  {s.sessionDate} · {s.status}
                  {s.templateId ? ` · tpl` : ''}
                </option>
              ))}
            </select>
          </label>
          {sessionId && (
            <button
              type="button"
              onClick={() => updateSession.mutate({ id: sessionId, body: { status: 'completed' } })}
              disabled={updateSession.isPending}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
            >
              Mark completed
            </button>
          )}
        </div>
        {sessionTpl && sessionId && (
          <p className="mt-2 text-xs text-gray-500">
            Template order:{' '}
            {sessionTpl.exerciseIds.map((id) => exById.get(id)?.name ?? id).join(' → ')}
          </p>
        )}
      </section>

      {sessionId && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Log sets</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Exercise
              <select
                className="mt-1 block min-w-[200px] rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-950"
                value={addExerciseId}
                onChange={(e) => setAddExerciseId(e.target.value)}
              >
                <option value="">— choose —</option>
                {exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            {overload && addExerciseId && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div>Suggested weight: {overload.nextSuggestedWeight}</div>
                <div>Reps {overload.nextSuggestedTargetRepsMin}–{overload.nextSuggestedTargetRepsMax}</div>
                <div className="mt-1 max-w-md text-[11px]">{overload.recommendationReason}</div>
              </div>
            )}
            <button
              type="button"
              onClick={submitSet}
              disabled={!addExerciseId || addSet.isPending}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Add working set
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {sessLoad && <p className="text-sm text-gray-500">Loading…</p>}
            {Array.from(setsByExercise.entries()).map(([exId, row]) => (
              <div key={exId}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {exById.get(exId)?.name ?? exId}
                </h3>
                <ul className="mt-2 space-y-2">
                  {row.map((st) => (
                    <SetRow
                      key={st.id}
                      s={st}
                      onPatch={(patch) => updateSet.mutate({ setId: st.id, body: patch })}
                      disabled={updateSet.isPending}
                    />
                  ))}
                </ul>
              </div>
            ))}
            {sets.length === 0 && !sessLoad && (
              <p className="text-sm text-gray-500">No sets yet for this session.</p>
            )}
          </div>
        </section>
      )}

      {!sessionId && !sessLoad && sortedSessions.length === 0 && (
        <p className="text-sm text-gray-500">Create a session to start logging sets.</p>
      )}
      {(exLoad || tplLoad) && <p className="text-xs text-gray-400">Loading library…</p>}
    </div>
  );
}

function SetRow({
  s,
  onPatch,
  disabled,
}: {
  s: WorkoutSet;
  onPatch: (p: {
    completedReps?: number;
    weight?: number;
    rpe?: number;
    isSuccessful?: boolean;
  }) => void;
  disabled?: boolean;
}) {
  const [reps, setReps] = useState(String(s.completedReps ?? ''));
  const [weight, setWeight] = useState(String(s.weight));
  const [rpe, setRpe] = useState(s.rpe != null ? String(s.rpe) : '');
  const [ok, setOk] = useState(s.isSuccessful);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800/50">
      <span className="text-gray-500">Set {s.setIndex + 1}</span>
      <label className="flex items-center gap-1">
        Reps
        <input
          className="w-14 rounded border px-1 dark:border-gray-600 dark:bg-gray-950"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() =>
            onPatch({
              completedReps: reps === '' ? undefined : Number(reps),
            })
          }
        />
      </label>
      <label className="flex items-center gap-1">
        Weight
        <input
          className="w-16 rounded border px-1 dark:border-gray-600 dark:bg-gray-950"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => onPatch({ weight: Number(weight) })}
        />
      </label>
      <label className="flex items-center gap-1">
        RPE
        <input
          className="w-12 rounded border px-1 dark:border-gray-600 dark:bg-gray-950"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          onBlur={() => onPatch({ rpe: rpe === '' ? undefined : Number(rpe) })}
        />
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={ok}
          disabled={disabled}
          onChange={(e) => {
            setOk(e.target.checked);
            onPatch({ isSuccessful: e.target.checked });
          }}
        />
        OK
      </label>
    </li>
  );
}
