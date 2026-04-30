import { Coins, Clock, Lock, CheckCircle2 } from 'lucide-react';
import type { RewardWithRedemptions } from '@/types/rewards';
import { useWallet } from '@/contexts/Wallet';

interface RewardCardProps {
  reward: RewardWithRedemptions;
  onRedeem?: (reward: RewardWithRedemptions) => void;
  onEdit?: (reward: RewardWithRedemptions) => void;
  showEditButton?: boolean;
}

export const RewardCard = ({ reward, onRedeem, onEdit, showEditButton }: RewardCardProps) => {
  const { balance } = useWallet();
  const canAfford = balance ? balance.totalPoints >= reward.pointCost : false;
  const canRedeem = reward.canRedeem && canAfford;

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 ${
        canRedeem
          ? 'border-green-300 dark:border-green-700'
          : 'border-gray-200 dark:border-gray-700'
      } overflow-hidden transition-all hover:shadow-lg`}
    >
      {!reward.canRedeem && reward.cooldownMessage && (
        <div className="absolute top-2 right-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock size={12} />
          {reward.cooldownMessage}
        </div>
      )}

      {!canAfford && reward.canRedeem && (
        <div className="absolute top-2 right-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Lock size={12} />
          Locked
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{reward.icon || '🎁'}</span>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {reward.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{reward.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-yellow-600 dark:text-yellow-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {reward.pointCost.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">points</span>
          </div>

          <div className="flex gap-2">
            {showEditButton && onEdit && (
              <button
                onClick={() => onEdit(reward)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
            {onRedeem && (
              <button
                onClick={() => onRedeem(reward)}
                disabled={!canRedeem}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  canRedeem
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {canRedeem ? 'Redeem' : !canAfford ? 'Insufficient Points' : 'Cooldown'}
              </button>
            )}
          </div>
        </div>

        {reward.redemptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 size={14} className="text-green-600 dark:text-green-500" />
              <span>
                Redeemed {reward.redemptions.length} time
                {reward.redemptions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
