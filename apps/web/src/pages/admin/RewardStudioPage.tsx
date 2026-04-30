import { useState } from 'react';
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
} from '@/types/rewards';

const categories: RewardCategory[] = ['Quick Treat', 'Daily Delight', 'Big Unlock', 'Custom'];

interface BrainstormedReward {
  title: string;
  description: string;
  category: string;
  suggestedPointCost: number;
}

const RewardStudioPage = () => {
  const { rewards, loading, createReward, updateReward, deleteReward } = useRewards();
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
  const [brainstormedRewards, setBrainstormedRewards] = useState<BrainstormedReward[]>([]);

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

  const handleBrainstorm = async () => {
    if (!isAIConfigured) {
      alert('AI is not configured. Please configure an LLM provider in Settings.');
      return;
    }

    try {
      setBrainstorming(true);
      setBrainstormDialogOpen(true);
      const results = await taskPointsAIService.brainstormRewards({
        existingRewards: rewards.map((r) => ({
          title: r.title,
          category: r.category,
        })),
        count: 8,
      });
      setBrainstormedRewards(results);
    } catch (error) {
      console.error('Failed to brainstorm rewards:', error);
      alert(error instanceof Error ? error.message : 'Failed to brainstorm rewards');
      setBrainstormDialogOpen(false);
    } finally {
      setBrainstorming(false);
    }
  };

  const handleAddBrainstormedReward = (reward: BrainstormedReward) => {
    setFormData({
      title: reward.title,
      description: reward.description,
      category: reward.category as RewardCategory,
      pointCost: reward.suggestedPointCost,
      icon: '🎁',
      cooldownHours: undefined,
      maxRedemptionsPerDay: undefined,
    });
    setBrainstormDialogOpen(false);
    setIsDialogOpen(true);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div key={reward.id} className="relative group">
              <RewardCard reward={reward} onEdit={openEditDialog} showEditButton />
              <button
                onClick={() => handleDelete(reward)}
                className="absolute top-2 left-2 p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete reward"
              >
                <Trash2 size={16} />
              </button>
            </div>
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Click on any reward to add it to your reward studio. You can customize it before
              saving.
            </p>
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {brainstormedRewards.map((reward, index) => (
                <button
                  key={index}
                  onClick={() => handleAddBrainstormedReward(reward)}
                  className="w-full text-left p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 rounded-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{reward.title}</h3>
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-sm font-medium">
                      <Sparkles size={14} />
                      {reward.suggestedPointCost} pts
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {reward.description}
                  </p>
                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                    {reward.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default RewardStudioPage;
