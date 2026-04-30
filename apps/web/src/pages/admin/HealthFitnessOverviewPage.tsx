import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  Coffee,
  Dumbbell,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ROUTES } from '@/routes';
import { localCalendarDate } from '@/lib/date/local-calendar';
import {
  useFitnessRecoveryRange,
  useUpsertRecoveryMutation,
} from '@/hooks/useFitness';
import { useState, useEffect } from 'react';

export default function HealthFitnessOverviewPage() {
  const today = localCalendarDate();
  const { data: recoveryRes } = useFitnessRecoveryRange(today, today);
  const upsert = useUpsertRecoveryMutation();

  const recoveryPage =
    recoveryRes?.success && recoveryRes.data ? recoveryRes.data : undefined;
  const existing = recoveryPage?.data?.[0];

  const [sleepHours, setSleepHours] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existing) {
      setSleepHours(existing.sleepHours != null ? String(existing.sleepHours) : '');
      setSleepQuality(existing.sleepQuality != null ? String(existing.sleepQuality) : '');
      setEnergyLevel(existing.energyLevel != null ? String(existing.energyLevel) : '');
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const saveRecovery = async () => {
    const body: Record<string, unknown> = {};
    if (sleepHours !== '') body.sleepHours = Number(sleepHours);
    if (sleepQuality !== '') body.sleepQuality = Number(sleepQuality);
    if (energyLevel !== '') body.energyLevel = Number(energyLevel);
    if (notes !== '') body.notes = notes;
    await upsert.mutateAsync({ date: today, body });
  };

  const cards = [
    {
      title: 'Nutrition',
      desc: 'Quick-add meals with AI parse or manual macros.',
      icon: <Coffee className="h-8 w-8" />,
      to: ROUTES.admin.healthFitnessNutrition,
    },
    {
      title: 'Workouts',
      desc: 'Templates, sessions, sets, and overload suggestions.',
      icon: <Dumbbell className="h-8 w-8" />,
      to: ROUTES.admin.healthFitnessWorkouts,
    },
    {
      title: 'Aura',
      desc: 'Recovery vs story points — join with Growth System velocity.',
      icon: <Sparkles className="h-8 w-8" />,
      to: ROUTES.admin.healthFitnessAura,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <LayoutGrid className="h-6 w-6" />
          <span className="text-sm font-medium">Health & Fitness</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Recovery, nutrition, and training stay in <strong>/fitness</strong>; story points remain
          in Growth System for Aura correlations.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900/40">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Today&apos;s recovery ({today})
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Saved to DailyRecovery (not logbook) for Aura and analytics.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Sleep hours
            <input
              type="number"
              step="0.25"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-950"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g. 7.5"
            />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Sleep quality (1–10)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-950"
              value={sleepQuality}
              onChange={(e) => setSleepQuality(e.target.value)}
            />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Energy (1–10)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-950"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-4 block text-sm text-gray-700 dark:text-gray-300">
          Notes
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-950"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={saveRecovery}
          disabled={upsert.isPending}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {upsert.isPending ? 'Saving…' : 'Save recovery'}
        </button>
        {existing?.recoveryScore != null && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Recovery score:{' '}
            <span className="font-mono font-semibold">{existing.recoveryScore.toFixed(0)}</span>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
          <ExternalLink className="h-4 w-4" />
          Household Meal Planner (future)
        </h3>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
          Nutrition entries support <code className="rounded bg-white/80 px-1 dark:bg-black/30">sourceMealPlanId</code>,{' '}
          <code className="rounded bg-white/80 px-1 dark:bg-black/30">sourceMealSlotId</code>,{' '}
          <code className="rounded bg-white/80 px-1 dark:bg-black/30">sourceRecipeId</code> so the planner can reuse the
          same model without a second log table.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-blue-500"
          >
            <div className="mb-3 text-blue-600 dark:text-blue-400">{c.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{c.title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
