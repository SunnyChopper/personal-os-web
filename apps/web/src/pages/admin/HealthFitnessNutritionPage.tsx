import { Coffee } from 'lucide-react';
import { NutritionQuickAdd } from '@/components/organisms/fitness/NutritionQuickAdd';
import { useFitnessNutritionList } from '@/hooks/useFitness';
import { localCalendarDate, addCalendarDays } from '@/lib/date/local-calendar';

export default function HealthFitnessNutritionPage() {
  const end = localCalendarDate();
  const start = addCalendarDays(end, -14);
  const { data, isLoading } = useFitnessNutritionList({
    startDate: start,
    endDate: end,
    pageSize: 30,
  });

  const rows = data?.success ? (data.data?.data ?? []) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Coffee className="h-6 w-6" />
          <span className="text-sm font-medium">Nutrition</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quick add</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Parse free text with{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
            POST /ai/fitness/nutrition/parse
          </code>
          , edit, then save to{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">POST /fitness/nutrition</code>
          .
        </p>
      </div>

      <NutritionQuickAdd plannerQueryExample="?mealPlanId=&mealSlotId=&recipeId=" />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Recent (14d)</h2>
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-gray-500">No entries yet.</p>
        )}
        <ul className="space-y-2">
          {rows.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/40"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {e.foodName || 'Meal'}{' '}
                <span className="font-normal text-gray-500">· {e.mealType}</span>
              </span>
              <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                {Math.round(e.calories)} kcal · P{e.proteinGrams.toFixed(0)} C
                {e.carbGrams.toFixed(0)} F{e.fatGrams.toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
