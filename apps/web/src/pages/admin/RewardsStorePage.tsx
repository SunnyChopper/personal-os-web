import { useState } from 'react';
import { Store, Coins } from 'lucide-react';
import { useRewards } from '@/contexts/Rewards';
import { useWallet } from '@/contexts/Wallet';
import { RewardCard } from '@/components/molecules/RewardCard';
import type { RewardWithRedemptions, RewardCategory } from '@/types/rewards';

const categories: { name: RewardCategory; description: string }[] = [
  { name: 'Quick Treat', description: 'Small instant rewards' },
  { name: 'Daily Delight', description: 'Medium rewards for daily enjoyment' },
  { name: 'Big Unlock', description: 'Large rewards worth saving for' },
];

const RewardsStorePage = () => {
  const { rewards, loading, redeemReward } = useRewards();
  const { balance } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const filteredRewards = selectedCategory
    ? rewards.filter((r) => r.category === selectedCategory && r.status === 'Active')
    : rewards.filter((r) => r.status === 'Active');

  const handleRedeem = async (reward: RewardWithRedemptions) => {
    if (!reward.canRedeem) return;

    const confirmed = confirm(`Redeem "${reward.title}" for ${reward.pointCost} points?`);
    if (!confirmed) return;

    try {
      setRedeeming(true);
      await redeemReward(reward.id);
      alert(`Successfully redeemed: ${reward.title}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Store size={32} className="text-blue-600 dark:text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rewards Store</h1>
          </div>
          {balance && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Coins size={20} className="text-yellow-600 dark:text-yellow-500" />
              <span className="text-lg font-bold text-yellow-900 dark:text-yellow-300">
                {balance.totalPoints.toLocaleString()}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">points</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Redeem your hard-earned points for treats and experiences
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All Rewards
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.name
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredRewards.length === 0 ? (
        <div className="text-center py-12">
          <Store size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Rewards Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Check back later for new rewards</p>
        </div>
      ) : (
        <>
          {categories.map((category) => {
            const categoryRewards = rewards.filter(
              (r) => r.category === category.name && r.status === 'Active'
            );

            if (
              categoryRewards.length === 0 ||
              (selectedCategory && selectedCategory !== category.name)
            ) {
              return null;
            }

            return (
              <div key={category.name} className="mb-8">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryRewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      onRedeem={!redeeming ? handleRedeem : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default RewardsStorePage;
