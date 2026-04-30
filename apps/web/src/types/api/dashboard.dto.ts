import type { Goal, Habit, LogbookEntry, Metric, Task } from '@/types/growth-system';
import type { RewardWithRedemptions, WalletBalance, WalletTransaction } from '@/types/rewards';
import type { ProjectDto } from './projects.dto';

export interface DashboardSummaryDto {
  tasks: Task[];
  goals: Goal[];
  projects: ProjectDto[];
  habits: Habit[];
  metrics: Metric[];
  logbookEntries: LogbookEntry[];
  rewards: RewardWithRedemptions[];
  wallet: {
    balance: WalletBalance;
    recentTransactions: WalletTransaction[];
  };
}
