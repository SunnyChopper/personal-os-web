import { useState } from 'react';
import type { MealType, NutritionParseAiData, ParsedNutritionResult } from '@/types/fitness';
import { useCreateNutritionMutation, useParseNutritionMutation } from '@/hooks/useFitness';
import { cn } from '@/lib/utils';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

function defaultParsed(): ParsedNutritionResult {
  return {
    foodItems: [],
    foodNameSummary: '',
    calories: 0,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
    assumptions: [],
    confidence: 0,
    needsUserConfirmation: true,
  };
}

interface NutritionQuickAddProps {
  /** Optional deep-link metadata for future Household Meal Planner mounts. */
  plannerQueryExample?: string;
  className?: string;
}

export function NutritionQuickAdd({ plannerQueryExample, className }: NutritionQuickAddProps) {
  const [text, setText] = useState('');
  const [mealType, setMealType] = useState<MealType>('other');
  const [preview, setPreview] = useState<ParsedNutritionResult | null>(null);
  const [aiEnvelope, setAiEnvelope] = useState<NutritionParseAiData | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const parseMut = useParseNutritionMutation();
  const saveMut = useCreateNutritionMutation();

  const effective = preview ?? defaultParsed();

  const handleParse = async () => {
    if (!text.trim()) return;
    const res = await parseMut.mutateAsync({ text: text.trim(), useCache: true });
    if (res.success && res.data) {
      setAiEnvelope(res.data);
      setPreview(res.data.result);
      setManualMode(false);
    }
  };

  const handleSave = async () => {
    const loggedAt = new Date().toISOString();
    const body = {
      loggedAt,
      mealType,
      foodName: effective.foodNameSummary || undefined,
      sourceText: text.trim() || undefined,
      calories: effective.calories,
      proteinGrams: effective.proteinGrams,
      carbGrams: effective.carbGrams,
      fatGrams: effective.fatGrams,
      fiberGrams: effective.fiberGrams || undefined,
      confidence: aiEnvelope?.confidence ?? effective.confidence,
      parseProvider: aiEnvelope?.provider ?? undefined,
      parseModel: aiEnvelope?.model || undefined,
    };
    const res = await saveMut.mutateAsync(body);
    if (res.success) {
      setText('');
      setPreview(null);
      setAiEnvelope(null);
    }
  };

  const updateField = <K extends keyof ParsedNutritionResult>(key: K, value: ParsedNutritionResult[K]) => {
    setPreview((prev) => ({
      ...(prev ?? defaultParsed()),
      [key]: value,
    }));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {plannerQueryExample && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Planner deep-link contract (future): open nutrition with query{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{plannerQueryExample}</code>{' '}
          to pre-fill <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">sourceMealPlanId</code>,{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">sourceMealSlotId</code>,{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">sourceRecipeId</code>.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          Meal
          <select
            className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
          >
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setManualMode(true);
            setPreview((p) => p ?? defaultParsed());
          }}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Manual entry
        </button>
      </div>

      <textarea
        className="min-h-[100px] w-full rounded-xl border border-gray-300 bg-white p-3 text-sm dark:border-gray-600 dark:bg-gray-900"
        placeholder="e.g. 8 oz chicken breast, rice, broccoli, olive oil"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleParse}
          disabled={parseMut.isPending || !text.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {parseMut.isPending ? 'Parsing…' : 'Parse with AI'}
        </button>
      </div>

      {parseMut.isError && (
        <p className="text-sm text-red-600">Could not parse. Try manual entry.</p>
      )}

      {(preview || manualMode) && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {manualMode && !preview ? 'Manual macros' : 'Editable preview'}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Label
              <input
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                value={effective.foodNameSummary}
                onChange={(e) => updateField('foodNameSummary', e.target.value)}
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Calories
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                value={effective.calories}
                onChange={(e) => updateField('calories', Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Protein (g)
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                value={effective.proteinGrams}
                onChange={(e) => updateField('proteinGrams', Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Carbs (g)
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                value={effective.carbGrams}
                onChange={(e) => updateField('carbGrams', Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Fat (g)
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                value={effective.fatGrams}
                onChange={(e) => updateField('fatGrams', Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Fiber (g)
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                value={effective.fiberGrams}
                onChange={(e) => updateField('fiberGrams', Number(e.target.value))}
              />
            </label>
          </div>

          {effective.assumptions.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-xs text-gray-600 dark:text-gray-400">
              {effective.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}

          {aiEnvelope && (
            <p className="mt-2 text-xs text-gray-500">
              Model confidence {Math.round((aiEnvelope.confidence ?? 0) * 100)}%
              {aiEnvelope.cached ? ' · cached' : ''}
              {effective.needsUserConfirmation ? ' · confirm macros if unsure' : ''}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saveMut.isPending}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saveMut.isPending ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      )}
    </div>
  );
}
