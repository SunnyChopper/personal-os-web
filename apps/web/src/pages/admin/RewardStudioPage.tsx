import { useMemo, useState } from 'react';
import { Palette, Plus, Trash2, Sparkles, Lightbulb } from 'lucide-react';
import { useRewards } from '@/contexts/Rewards';
import { RewardCard } from '@/components/molecules/RewardCard';
import Dialog from '@/components/molecules/Dialog';
import { taskPointsAIService } from '@/services/ai/task-points.service';
import { llmConfig } from '@/lib/llm';
import type {
  RewardWithRedemptions,
  CreateRewardInput,
  UpdateRewardInput,
  RewardCategory,
  RewardSuggestionItem,
  RewardSuggestionPayload,
} from '@/types/rewards';

const categories: RewardCategory[] = ['Quick Treat', 'Daily Delight', 'Big Unlock', 'Custom'];

/** Studio grid: three main tiers first, then Custom. Within each section, lowest point cost first. */
const STUDIO_SECTION_ORDER: RewardCategory[] = [
  'Quick Treat',
  'Daily Delight',
  'Big Unlock',
  'Custom',
];

const SECTION_ACCENT: Record<RewardCategory, string> = {
  'Quick Treat': 'border-l-emerald-500 dark:border-l-emerald-400',
  'Daily Delight': 'border-l-sky-500 dark:border-l-sky-400',
  'Big Unlock': 'border-l-violet-500 dark:border-l-violet-400',
  Custom: 'border-l-amber-500 dark:border-l-amber-400',
};

function cloneRewardSuggestionPayload(p: RewardSuggestionPayload): RewardSuggestionPayload {
  return {
    title: p.title,
    description: p.description ?? '',
    category: p.category,
    pointCost: p.pointCost,
    icon: p.icon ?? '🎁',
    cooldownHours: p.cooldownHours ?? undefined,
    maxRedemptionsPerDay: p.maxRedemptionsPerDay ?? undefined,
  };
}

function payloadsEqual(a: RewardSuggestionPayload, b: RewardSuggestionPayload): boolean {
  return (
    a.title === b.title &&
    String(a.description ?? '') === String(b.description ?? '') &&
    a.category === b.category &&
    a.pointCost === b.pointCost &&
    String(a.icon ?? '') === String(b.icon ?? '') &&
    (a.cooldownHours ?? null) === (b.cooldownHours ?? null) &&
    (a.maxRedemptionsPerDay ?? null) === (b.maxRedemptionsPerDay ?? null)
  );
}

const RewardStudioPage = () => {
  const { rewards, loading, createReward, updateReward, deleteReward, refreshRewards } =
    useRewards();

  const rewardsBySection = useMemo(() => {
    const buckets = new Map<RewardCategory, RewardWithRedemptions[]>();
    for (const cat of STUDIO_SECTION_ORDER) {
      buckets.set(cat, []);
    }
    for (const reward of rewards) {
      const cat = buckets.has(reward.category) ? reward.category : 'Custom';
      buckets.get(cat)!.push(reward);
    }
    for (const list of buckets.values()) {
      list.sort(
        (a, b) =>
          a.pointCost - b.pointCost ||
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      );
    }
    return STUDIO_SECTION_ORDER.map((category) => ({
      category,
      rewards: buckets.get(category)!,
    })).filter((s) => s.rewards.length > 0);
  }, [rewards]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardWithRedemptions | null>(null);
  const [saving, setSaving] = useState(false);
  const [calculatingPoints, setCalculatingPoints] = useState(false);

  const [formData, setFormData] = useState<CreateRewardInput | UpdateRewardInput>({
    title: '',
    description: '',
    category: 'Quick Treat',
    pointCost: 100,
    icon: '🎁',
    cooldownHours: undefined,
    maxRedemptionsPerDay: undefined,
  });

  const [brainstormDialogOpen, setBrainstormDialogOpen] = useState(false);
  const [brainstorming, setBrainstorming] = useState(false);
  const [suggestionItems, setSuggestionItems] = useState<RewardSuggestionItem[]>([]);
  const [draftById, setDraftById] = useState<Record<string, RewardSuggestionPayload>>({});
  const [rejectTextById, setRejectTextById] = useState<Record<string, string>>({});
  const [busySuggestionId, setBusySuggestionId] = useState<string | null>(null);
  const [brainstormModelLabel, setBrainstormModelLabel] = useState<string | null>(null);

  const isAIConfigured = llmConfig.isConfigured();

  const openCreateDialog = () => {
    setEditingReward(null);
    setFormData({
      title: '',
      description: '',
      category: 'Quick Treat',
      pointCost: 100,
      icon: '🎁',
      cooldownHours: undefined,
      maxRedemptionsPerDay: undefined,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (reward: RewardWithRedemptions) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description || '',
      category: reward.category,
      pointCost: reward.pointCost,
      icon: reward.icon || '🎁',
      cooldownHours: reward.cooldownHours ?? undefined,
      maxRedemptionsPerDay: reward.maxRedemptionsPerDay ?? undefined,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingReward) {
        await updateReward(editingReward.id, formData as UpdateRewardInput);
      } else {
        await createReward(formData as CreateRewardInput);
      }
      setIsDialogOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save reward');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reward: RewardWithRedemptions) => {
    const confirmed = confirm(`Delete "${reward.title}"?`);
    if (!confirmed) return;

    try {
      await deleteReward(reward.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete reward');
    }
  };

  const handleCalculatePointCost = async () => {
    if (!isAIConfigured) {
      alert('AI is not configured. Please configure an LLM provider in Settings.');
      return;
    }

    if (!formData.title) {
      alert('Please enter a reward title first');
      return;
    }

    try {
      setCalculatingPoints(true);
      const result = await taskPointsAIService.calculateRewardPointCost({
        title: formData.title,
        description: formData.description,
        category: formData.category || 'Quick Treat',
        existingRewards: rewards.map((r) => ({
          title: r.title,
          pointCost: r.pointCost,
          category: r.category,
        })),
      });

      setFormData({ ...formData, pointCost: result.pointCost });
    } catch (error) {
      console.error('Failed to calculate point cost:', error);
      alert(error instanceof Error ? error.message : 'Failed to calculate point cost');
    } finally {
      setCalculatingPoints(false);
    }
  };

  const removeSuggestion = (id: string) => {
    setSuggestionItems((prev) => prev.filter((s) => s.id !== id));
    setDraftById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setRejectTextById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const patchDraft = (id: string, patch: Partial<RewardSuggestionPayload>) => {
    setDraftById((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, ...patch } };
    });
  };

  const handleBrainstorm = async () => {
    if (!isAIConfigured) {
      alert('AI is not configured. Please configure an LLM provider in Settings.');
      return;
    }

    try {
      setBrainstorming(true);
      setBrainstormDialogOpen(true);
      const data = await taskPointsAIService.brainstormRewards({ count: 8 });
      setBrainstormModelLabel(data.model);
      setSuggestionItems(data.suggestions);
      const drafts: Record<string, RewardSuggestionPayload> = {};
      for (const s of data.suggestions) {
        drafts[s.id] = cloneRewardSuggestionPayload(s.proposedReward);
      }
      setDraftById(drafts);
      setRejectTextById({});
    } catch (error) {
      console.error('Failed to brainstorm rewards:', error);
      alert(error instanceof Error ? error.message : 'Failed to brainstorm rewards');
      setBrainstormDialogOpen(false);
    } finally {
      setBrainstorming(false);
    }
  };

  const acceptById = async (id: string) => {
    const s = suggestionItems.find((x) => x.id === id);
    const draft = draftById[id];
    if (!s || !draft) return;
    const baseline = cloneRewardSuggestionPayload(s.proposedReward);
    const edited = !payloadsEqual(draft, baseline);
    try {
      setBusySuggestionId(id);
      await taskPointsAIService.resolveRewardSuggestion(id, {
        approve: true,
        resolvedReward: edited ? draft : undefined,
      });
      removeSuggestion(id);
      await refreshRewards();
    } catch (error) {
      console.error('Accept suggestion failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to accept suggestion');
    } finally {
      setBusySuggestionId(null);
    }
  };

  const rejectById = async (id: string) => {
    const fb = (rejectTextById[id] || '').trim();
    if (!fb) {
      alert('Please enter feedback explaining why this reward was rejected.');
      return;
    }
    try {
      setBusySuggestionId(id);
      await taskPointsAIService.resolveRewardSuggestion(id, {
        approve: false,
        feedback: fb,
      });
      removeSuggestion(id);
      await refreshRewards();
    } catch (error) {
      console.error('Reject suggestion failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject suggestion');
    } finally {
      setBusySuggestionId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Palette size={32} className="text-blue-600 dark:text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reward Studio</h1>
          </div>
          <div className="flex gap-2">
            {isAIConfigured && (
              <button
                onClick={handleBrainstorm}
                disabled={brainstorming}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Lightbulb size={20} />
                {brainstorming ? 'Brainstorming...' : 'Brainstorm Rewards'}
              </button>
            )}
            <button
              onClick={openCreateDialog}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={20} />
              Create Reward
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Design and manage your custom reward system
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-12">
          <Palette size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Rewards Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first reward to get started
          </p>
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Create Reward
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {rewardsBySection.map(({ category, rewards: sectionRewards }) => (
            <section key={category} aria-labelledby={`reward-section-${category}`}>
              <div
                id={`reward-section-${category}`}
                className={`mb-4 pl-4 border-l-4 py-1 ${SECTION_ACCENT[category]}`}
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  {category}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {category === 'Quick Treat' && 'Small wins you can redeem often.'}
                  {category === 'Daily Delight' && 'Meaningful day-to-day treats.'}
                  {category === 'Big Unlock' && 'Major milestones and splurges.'}
                  {category === 'Custom' && 'Personalized or one-off rewards.'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionRewards.map((reward) => (
                  <div key={reward.id} className="relative group">
                    <RewardCard reward={reward} onEdit={openEditDialog} showEditButton />
                    <button
                      type="button"
                      onClick={() => handleDelete(reward)}
                      className="absolute top-2 left-2 p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete reward"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingReward ? 'Edit Reward' : 'Create Reward'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as RewardCategory })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Point Cost
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.pointCost}
                  onChange={(e) =>
                    setFormData({ ...formData, pointCost: parseInt(e.target.value) })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {isAIConfigured && (
                  <button
                    type="button"
                    onClick={handleCalculatePointCost}
                    disabled={calculatingPoints}
                    className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                    title="Calculate with AI"
                  >
                    <Sparkles size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icon
            </label>
            <input
              type="text"
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🎁"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cooldown Hours
              </label>
              <input
                type="number"
                min="0"
                value={formData.cooldownHours ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cooldownHours: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Daily Redemptions
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxRedemptionsPerDay ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxRedemptionsPerDay: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingReward ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={brainstormDialogOpen}
        onClose={() => setBrainstormDialogOpen(false)}
        title="AI-Generated Reward Ideas"
      >
        {brainstorming ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Brainstorming creative rewards...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {brainstormModelLabel ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Model: {brainstormModelLabel}
              </p>
            ) : null}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Edit fields if needed, then Accept to save to your studio, or Reject with feedback so
              future ideas improve.
            </p>
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {suggestionItems.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                  No new suggestions returned. Try again or add a short hint in Settings about what
                  you enjoy.
                </p>
              ) : (
                suggestionItems.map((item) => {
                  const d = draftById[item.id];
                  if (!d) return null;
                  const busy = busySuggestionId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Suggestion
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                          {item.id}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={d.title}
                            onChange={(e) => patchDraft(item.id, { title: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Description
                          </label>
                          <textarea
                            value={String(d.description ?? '')}
                            onChange={(e) => patchDraft(item.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Category
                          </label>
                          <select
                            value={d.category}
                            onChange={(e) =>
                              patchDraft(item.id, {
                                category: e.target.value as RewardCategory,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Point cost
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={d.pointCost}
                            onChange={(e) =>
                              patchDraft(item.id, { pointCost: parseInt(e.target.value, 10) })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Cooldown (hours)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={d.cooldownHours ?? ''}
                            onChange={(e) =>
                              patchDraft(item.id, {
                                cooldownHours: e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined,
                              })
                            }
                            placeholder="—"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Max / day
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={d.maxRedemptionsPerDay ?? ''}
                            onChange={(e) =>
                              patchDraft(item.id, {
                                maxRedemptionsPerDay: e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined,
                              })
                            }
                            placeholder="—"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Icon
                          </label>
                          <input
                            type="text"
                            value={String(d.icon ?? '')}
                            onChange={(e) => patchDraft(item.id, { icon: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="text-xs space-y-1 rounded-md bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-100 dark:border-gray-700">
                        <p className="font-medium text-gray-700 dark:text-gray-300">Why (AI)</p>
                        <p>
                          <span className="text-gray-500 dark:text-gray-400">Points: </span>
                          {item.reasons.pointCostReason}
                        </p>
                        <p>
                          <span className="text-gray-500 dark:text-gray-400">Category: </span>
                          {item.reasons.categoryReason}
                        </p>
                        <p>
                          <span className="text-gray-500 dark:text-gray-400">Cooldown: </span>
                          {item.reasons.cooldownHoursReason}
                        </p>
                        <p>
                          <span className="text-gray-500 dark:text-gray-400">Max/day: </span>
                          {item.reasons.maxRedemptionsPerDayReason}
                        </p>
                        {item.reasons.overall ? (
                          <p>
                            <span className="text-gray-500 dark:text-gray-400">Overall: </span>
                            {item.reasons.overall}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Rejection feedback (required to reject)
                        </label>
                        <textarea
                          value={rejectTextById[item.id] ?? ''}
                          onChange={(e) =>
                            setRejectTextById((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="If rejecting, explain what felt wrong or what to avoid next time…"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => acceptById(item.id)}
                          className="flex-1 min-w-[120px] px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          {busy ? 'Working…' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => rejectById(item.id)}
                          className="flex-1 min-w-[120px] px-3 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default RewardStudioPage;
