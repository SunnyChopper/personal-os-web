import { useMemo, useState } from 'react';
import { Gift, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import { addCalendarDays, localCalendarDate } from '@/lib/date/local-calendar';
import {
  useFitnessRewardRules,
  useFitnessRewardClaims,
  useCreateRewardRuleMutation,
  useUpdateRewardRuleMutation,
  useDeleteRewardRuleMutation,
  useClaimRewardRuleMutation,
  useFitnessExercises,
} from '@/hooks/useFitness';
import type {
  CreateFitnessRewardRuleInput,
  FitnessRewardAutoMetric,
  FitnessRewardCategory,
  FitnessRewardRule,
  FitnessRewardTriggerType,
  UpdateFitnessRewardRuleInput,
} from '@/types/fitness';
import { Select } from '@/components/atoms/Select';

const CATEGORIES: FitnessRewardCategory[] = [
  'hydration',
  'nutrition',
  'workout',
  'recovery',
  'benchmark',
  'custom',
];

const AUTO_METRICS: FitnessRewardAutoMetric[] = [
  'workout_set_pr',
  'recovery_logged',
  'session_completed',
];

type RuleFormState = {
  name: string;
  description: string;
  category: FitnessRewardCategory;
  points: number;
  target: string;
  triggerType: FitnessRewardTriggerType;
  autoMetric: FitnessRewardAutoMetric | '';
  exerciseId: string;
  cooldownHours: string;
  maxClaimsPerDay: string;
  isActive: boolean;
};

const emptyForm = (): RuleFormState => ({
  name: '',
  description: '',
  category: 'custom',
  points: 10,
  target: '',
  triggerType: 'manual',
  autoMetric: '',
  exerciseId: '',
  cooldownHours: '',
  maxClaimsPerDay: '',
  isActive: true,
});

function formFromRule(rule: FitnessRewardRule): RuleFormState {
  return {
    name: rule.name,
    description: rule.description ?? '',
    category: rule.category,
    points: rule.points,
    target: rule.target ?? '',
    triggerType: rule.triggerType,
    autoMetric: rule.autoMetric ?? '',
    exerciseId: rule.exerciseId ?? '',
    cooldownHours: rule.cooldownHours != null ? String(rule.cooldownHours) : '',
    maxClaimsPerDay: rule.maxClaimsPerDay != null ? String(rule.maxClaimsPerDay) : '',
    isActive: rule.isActive,
  };
}

function buildPayload(form: RuleFormState): CreateFitnessRewardRuleInput {
  const body: CreateFitnessRewardRuleInput = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    category: form.category,
    points: form.points,
    target: form.target.trim() || undefined,
    triggerType: form.triggerType,
    isActive: form.isActive,
  };
  if (form.triggerType === 'auto') {
    body.autoMetric = form.autoMetric || undefined;
    if (form.autoMetric === 'workout_set_pr') {
      body.exerciseId = form.exerciseId || undefined;
    }
  }
  const ch = form.cooldownHours.trim();
  if (ch) body.cooldownHours = Number(ch);
  const md = form.maxClaimsPerDay.trim();
  if (md) body.maxClaimsPerDay = Number(md);
  return body;
}

export default function HealthFitnessRewardsPage() {
  const end = localCalendarDate();
  const start = addCalendarDays(end, -14);

  const { data: rulesRes, isLoading } = useFitnessRewardRules(1, 100);
  const { data: claimsRes } = useFitnessRewardClaims({
    startDate: start,
    endDate: end,
    pageSize: 30,
  });
  const { data: exRes } = useFitnessExercises(1, 100);

  const rules = rulesRes?.success ? (rulesRes.data?.data ?? []) : [];
  const claims = claimsRes?.success ? (claimsRes.data?.data ?? []) : [];
  const exercises = exRes?.success ? (exRes.data?.data ?? []) : [];

  const createRule = useCreateRewardRuleMutation();
  const updateRule = useUpdateRewardRuleMutation();
  const deleteRule = useDeleteRewardRuleMutation();
  const claimRule = useClaimRewardRuleMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormState>(emptyForm);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [lastBalance, setLastBalance] = useState<number | null>(null);

  const manualRules = useMemo(
    () => rules.filter((r) => r.triggerType === 'manual' && r.isActive),
    [rules]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (rule: FitnessRewardRule) => {
    setEditingId(rule.id);
    setForm(formFromRule(rule));
    setDialogOpen(true);
  };

  const saveRule = async () => {
    const payload = buildPayload(form);
    if (editingId) {
      await updateRule.mutateAsync({
        id: editingId,
        body: payload as UpdateFitnessRewardRuleInput,
      });
    } else {
      await createRule.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleClaim = async (ruleId: string) => {
    setClaimError(null);
    try {
      const res = await claimRule.mutateAsync(ruleId);
      if (res.success && res.data) {
        setLastBalance(res.data.walletBalance);
      }
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : 'Claim failed');
    }
  };

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Gift className="h-6 w-6" />
            <span className="text-sm font-medium">Health & Fitness</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reward points</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure rules and earn points into your global wallet (spend in Rewards Store).
          </p>
          {lastBalance != null && (
            <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Wallet balance: {lastBalance} pts
            </p>
          )}
          {claimError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{claimError}</p>
          )}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New rule
        </button>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Quick claim</h2>
        {manualRules.length === 0 ? (
          <p className="text-sm text-gray-500">No active manual rules yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {manualRules.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={claimRule.isPending}
                onClick={() => handleClaim(r.id)}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
              >
                {r.name} (+{r.points})
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Rules</h2>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-gray-500">No rules configured.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {r.name}{' '}
                    <span className="text-sm font-normal text-gray-500">
                      +{r.points} · {r.category} · {r.triggerType}
                      {r.autoMetric ? ` (${r.autoMetric})` : ''}
                    </span>
                  </p>
                  {r.target && <p className="text-xs text-gray-500">Target: {r.target}</p>}
                  {!r.isActive && <span className="text-xs text-amber-600">Inactive</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Edit rule"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRule.mutate(r.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Recent claims (14d)
        </h2>
        {claims.length === 0 ? (
          <p className="text-sm text-gray-500">No claims yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {claims.map((c) => (
              <li key={c.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>
                  {c.ruleName} <span className="text-gray-400">({c.source})</span>
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +{c.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit rule' : 'New rule'}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Name</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Points</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  value={form.points}
                  onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) || 0 }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Category</span>
                <Select
                  className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as FitnessRewardCategory,
                    }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Target (optional)</span>
                <input
                  className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  placeholder="e.g. 12oz water"
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Trigger</span>
                <Select
                  className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  value={form.triggerType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      triggerType: e.target.value as FitnessRewardTriggerType,
                    }))
                  }
                >
                  <option value="manual">Manual claim</option>
                  <option value="auto">Auto-detect</option>
                </Select>
              </label>
              {form.triggerType === 'auto' && (
                <>
                  <label className="block text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Auto metric</span>
                    <Select
                      className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                      value={form.autoMetric}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          autoMetric: e.target.value as FitnessRewardAutoMetric,
                        }))
                      }
                    >
                      <option value="">Select…</option>
                      {AUTO_METRICS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </label>
                  {form.autoMetric === 'workout_set_pr' && (
                    <label className="block text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Exercise</span>
                      <Select
                        className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                        value={form.exerciseId}
                        onChange={(e) => setForm((f) => ({ ...f, exerciseId: e.target.value }))}
                      >
                        <option value="">Select exercise…</option>
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cooldown (hours)</span>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                    value={form.cooldownHours}
                    onChange={(e) => setForm((f) => ({ ...f, cooldownHours: e.target.value }))}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Max / day</span>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                    value={form.maxClaimsPerDay}
                    onChange={(e) => setForm((f) => ({ ...f, maxClaimsPerDay: e.target.value }))}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!form.name.trim() || createRule.isPending || updateRule.isPending}
                onClick={saveRule}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
