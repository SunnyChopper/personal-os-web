import { Link } from 'react-router-dom';
import { LayoutGrid, Coffee, Dumbbell, Sparkles, Gift, ExternalLink } from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import { ROUTES } from '@/routes';
import { DailyRecoveryCard } from '@/components/organisms/fitness/DailyRecoveryCard';

export default function HealthFitnessOverviewPage() {
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
    {
      title: 'Rewards',
      desc: 'Configurable points for health actions — feeds your global wallet.',
      icon: <Gift className="h-8 w-8" />,
      to: ROUTES.admin.healthFitnessRewards,
    },
  ];

  return (
    <PageContainer className="space-y-8">
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

      <DailyRecoveryCard />

      <section className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
          <ExternalLink className="h-4 w-4" />
          Household Meal Planner (future)
        </h3>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
          Nutrition entries support{' '}
          <code className="rounded bg-white/80 px-1 dark:bg-black/30">sourceMealPlanId</code>,{' '}
          <code className="rounded bg-white/80 px-1 dark:bg-black/30">sourceMealSlotId</code>,{' '}
          <code className="rounded bg-white/80 px-1 dark:bg-black/30">sourceRecipeId</code> so the
          planner can reuse the same model without a second log table.
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
    </PageContainer>
  );
}
