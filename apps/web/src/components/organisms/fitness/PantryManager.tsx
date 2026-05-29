import { useState } from 'react';
import {
  useCreatePantryItemMutation,
  useDeletePantryItemMutation,
  useFitnessPantryList,
} from '@/hooks/useFitness';
import { cn } from '@/lib/utils';

interface PantryManagerProps {
  className?: string;
}

export function PantryManager({ className }: PantryManagerProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  const { data, isLoading } = useFitnessPantryList(1, 100);
  const createMut = useCreatePantryItemMutation();
  const deleteMut = useDeletePantryItemMutation();

  const items = data?.success ? (data.data?.data ?? []) : [];

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const qty = quantity.trim() ? Number(quantity) : undefined;
    await createMut.mutateAsync({
      name: trimmed,
      quantity: qty !== undefined && !Number.isNaN(qty) ? qty : undefined,
      unit: unit.trim() || undefined,
    });
    setName('');
    setQuantity('');
    setUnit('');
  };

  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pantry</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ingredients you have at home. Used by the meal planner to suggest meals.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[140px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          placeholder="Ingredient name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd();
          }}
        />
        <input
          type="number"
          className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <input
          className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          placeholder="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={createMut.isPending || !name.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {createMut.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading pantry…</p>}
      {!isLoading && items.length === 0 && (
        <p className="text-sm text-gray-500">No ingredients yet. Add some to generate meals.</p>
      )}
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-900/40"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {item.name}
              {item.quantity != null && (
                <span className="ml-1 font-normal text-gray-500">
                  ({item.quantity}
                  {item.unit ? ` ${item.unit}` : ''})
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => deleteMut.mutate(item.id)}
              disabled={deleteMut.isPending}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              aria-label={`Remove ${item.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
