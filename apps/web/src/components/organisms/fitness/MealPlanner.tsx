import { useState } from 'react';
import type { GeneratedMealAi, MealPlan, MealPlanMeal, MealType } from '@/types/fitness';
import {
  useCreateMealPlanMutation,
  useCreateNutritionMutation,
  useDeleteMealPlanMutation,
  useFitnessMealPlansList,
  useFitnessPantryList,
  useGenerateMealsMutation,
} from '@/hooks/useFitness';
import { cn } from '@/lib/utils';

function newMealId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 26);
}

function aiMealToPlanMeal(m: GeneratedMealAi): MealPlanMeal {
  return {
    id: newMealId(),
    name: m.name,
    mealType: m.mealType,
    ingredientsUsed: m.ingredientsUsed,
    calories: m.calories,
    proteinGrams: m.proteinGrams,
    carbGrams: m.carbGrams,
    fatGrams: m.fatGrams,
    recipeSteps: m.recipeSteps,
    confidence: m.confidence,
  };
}

interface MealPlannerProps {
  className?: string;
}

export function MealPlanner({ className }: MealPlannerProps) {
  const [mealsCount, setMealsCount] = useState(3);
  const [preferences, setPreferences] = useState('');
  const [preview, setPreview] = useState<{
    title: string;
    meals: MealPlanMeal[];
    assumptions: string[];
    confidence: number;
    provider: string;
    model: string;
    pantrySnapshot: string[];
  } | null>(null);

  const { data: pantryData } = useFitnessPantryList(1, 100);
  const { data: plansData, isLoading: plansLoading } = useFitnessMealPlansList(1, 20);
  const generateMut = useGenerateMealsMutation();
  const savePlanMut = useCreateMealPlanMutation();
  const deletePlanMut = useDeleteMealPlanMutation();
  const logNutritionMut = useCreateNutritionMutation();

  const pantryItems = pantryData?.success ? (pantryData.data?.data ?? []) : [];
  const pantryNames = pantryItems.map((p) => p.name);
  const savedPlans: MealPlan[] = plansData?.success ? (plansData.data?.data ?? []) : [];

  const handleGenerate = async () => {
    const res = await generateMut.mutateAsync({
      mealsCount,
      preferences: preferences.trim() || undefined,
      useCache: true,
    });
    if (res.success && res.data) {
      const { result, confidence, provider, model } = res.data;
      setPreview({
        title: result.title || 'Meal suggestions',
        meals: result.meals.map(aiMealToPlanMeal),
        assumptions: result.assumptions,
        confidence,
        provider,
        model,
        pantrySnapshot: pantryNames,
      });
    }
  };

  const handleSavePlan = async () => {
    if (!preview || preview.meals.length === 0) return;
    const res = await savePlanMut.mutateAsync({
      title: preview.title,
      pantrySnapshot: preview.pantrySnapshot,
      meals: preview.meals,
      provider: preview.provider,
      model: preview.model,
    });
    if (res.success) {
      setPreview(null);
    }
  };

  const handleLogMeal = async (plan: MealPlan, meal: MealPlanMeal) => {
    await logNutritionMut.mutateAsync({
      loggedAt: new Date().toISOString(),
      mealType: meal.mealType as MealType,
      foodName: meal.name,
      sourceText: meal.ingredientsUsed.length
        ? `From meal plan: ${meal.ingredientsUsed.join(', ')}`
        : undefined,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbGrams: meal.carbGrams,
      fatGrams: meal.fatGrams,
      confidence: meal.confidence ?? undefined,
      parseProvider: plan.provider ?? undefined,
      parseModel: plan.model ?? undefined,
      sourceMealPlanId: plan.id,
      sourceMealSlotId: meal.mealType,
      sourceRecipeId: meal.id,
    });
  };

  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Meal planner</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Generate meals from your pantry with AI, save a plan, and log individual meals to your
          nutrition history.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          Meals
          <input
            type="number"
            min={1}
            max={10}
            className="ml-2 w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
            value={mealsCount}
            onChange={(e) => setMealsCount(Number(e.target.value))}
          />
        </label>
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          placeholder="Preferences (optional): high protein, quick, etc."
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={generateMut.isPending || pantryNames.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {generateMut.isPending ? 'Generating…' : 'Generate from pantry'}
        </button>
      </div>

      {pantryNames.length === 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Add pantry ingredients above before generating meals.
        </p>
      )}

      {generateMut.isError && (
        <p className="text-sm text-red-600">Could not generate meals. Try again.</p>
      )}

      {preview && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {preview.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Confidence {Math.round(preview.confidence * 100)}%
            {preview.provider ? ` · ${preview.provider}` : ''}
          </p>
          <ul className="mt-3 space-y-3">
            {preview.meals.map((meal) => (
              <li
                key={meal.id}
                className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-600 dark:bg-gray-900/40"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {meal.name} <span className="font-normal text-gray-500">· {meal.mealType}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(meal.calories)} kcal · P{meal.proteinGrams.toFixed(0)} C
                  {meal.carbGrams.toFixed(0)} F{meal.fatGrams.toFixed(0)}
                </p>
                {meal.ingredientsUsed.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Uses: {meal.ingredientsUsed.join(', ')}
                  </p>
                )}
                {meal.recipeSteps.length > 0 && (
                  <ol className="mt-2 list-inside list-decimal text-xs text-gray-600 dark:text-gray-400">
                    {meal.recipeSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
          {preview.assumptions.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-xs text-gray-600 dark:text-gray-400">
              {preview.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSavePlan()}
              disabled={savePlanMut.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savePlanMut.isPending ? 'Saving…' : 'Save plan'}
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Saved plans</h3>
        {plansLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {!plansLoading && savedPlans.length === 0 && (
          <p className="text-sm text-gray-500">No saved meal plans yet.</p>
        )}
        <ul className="space-y-4">
          {savedPlans.map((plan) => (
            <li
              key={plan.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {plan.title || 'Meal plan'}
                  </span>
                  <p className="text-xs text-gray-500">
                    {new Date(plan.createdAt).toLocaleDateString()} · {plan.meals.length} meal
                    {plan.meals.length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deletePlanMut.mutate(plan.id)}
                  disabled={deletePlanMut.isPending}
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Delete plan
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {plan.meals.map((meal) => (
                  <li
                    key={meal.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/50"
                  >
                    <span>
                      {meal.name}{' '}
                      <span className="text-gray-500">
                        · {Math.round(meal.calories)} kcal · {meal.mealType}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleLogMeal(plan, meal)}
                      disabled={logNutritionMut.isPending}
                      className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Log to nutrition
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
