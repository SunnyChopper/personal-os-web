import { apiClient } from '@/lib/api-client';
import type { WalletBalance, WalletTransaction } from '@/types/rewards';
import type { ApiResponse } from '@/types/api-contracts';

interface WalletResponse {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  recentTransactions: WalletTransaction[];
}

export const walletService = {
  async getBalance(): Promise<ApiResponse<WalletBalance>> {
    const response = await apiClient.get<WalletResponse>('/wallet');
    if (response.success && response.data) {
      const balance: WalletBalance = {
        userId: '', // Will be set by backend
        totalPoints: response.data.balance,
        lifetimeEarned: response.data.lifetimeEarned,
        lifetimeSpent: response.data.lifetimeSpent,
        updatedAt: new Date().toISOString(),
      };
      return { data: balance, success: true };
    }
    return {
      error: response.error || { message: 'Failed to fetch wallet balance', code: 'FETCH_ERROR' },
      success: false,
    };
  },

  async getTransactions(limit?: number): Promise<ApiResponse<WalletTransaction[]>> {
    const response = await apiClient.get<WalletResponse>('/wallet');
    if (response.success && response.data) {
      const transactions = limit
        ? response.data.recentTransactions.slice(0, limit)
        : response.data.recentTransactions;
      return { data: transactions, success: true };
    }
    return {
      error: response.error || { message: 'Failed to fetch transactions', code: 'FETCH_ERROR' },
      success: false,
    };
  },

  async addPoints(
    amount: number,
    source: WalletTransaction['source'],
    description: string,
    sourceEntityType?: 'task' | 'reward' | null,
    sourceEntityId?: string | null
  ): Promise<ApiResponse<{ balance: WalletBalance; transaction: WalletTransaction }>> {
    const response = await apiClient.post<{
      balance: WalletBalance;
      transaction: WalletTransaction;
    }>('/wallet/add', {
      amount,
      source,
      description,
      sourceEntityType,
      sourceEntityId,
    });
    if (response.success && response.data) {
      return { data: response.data, success: true };
    }
    return {
      error: response.error || { message: 'Failed to add points', code: 'ADD_POINTS_ERROR' },
      success: false,
    };
  },

  async spendPoints(
    amount: number,
    _source: WalletTransaction['source'],
    _description: string,
    _sourceEntityType?: 'task' | 'reward' | null,
    _sourceEntityId?: string | null
  ): Promise<ApiResponse<{ balance: WalletBalance; transaction: WalletTransaction }>> {
    // Spending is handled via reward redemption endpoint
    // This method may need to call a different endpoint or be handled differently
    const balanceResponse = await this.getBalance();
    if (!balanceResponse.success || !balanceResponse.data) {
      return {
        error: { message: 'Failed to get current balance', code: 'BALANCE_ERROR' },
        success: false,
      };
    }

    if (balanceResponse.data.totalPoints < amount) {
      return {
        error: { message: 'Insufficient points', code: 'INSUFFICIENT_POINTS' },
        success: false,
      };
    }

    // Backend handles point deduction via redemption endpoint
    // This is a fallback - actual spending should go through reward redemption
    return {
      error: {
        message: 'Use reward redemption endpoint to spend points',
        code: 'USE_REDEMPTION_ENDPOINT',
      },
      success: false,
    };
  },

  async refundPoints(
    amount: number,
    description: string,
    sourceEntityType?: 'task' | 'reward' | null,
    sourceEntityId?: string | null
  ): Promise<ApiResponse<{ balance: WalletBalance; transaction: WalletTransaction }>> {
    // Refund via addPoints with source='system' (refunds are system-initiated)
    return this.addPoints(amount, 'system', description, sourceEntityType, sourceEntityId);
  },

  async adjustPoints(
    amount: number,
    description: string
  ): Promise<ApiResponse<{ balance: WalletBalance; transaction: WalletTransaction }>> {
    // Manual adjustment via addPoints
    return this.addPoints(amount, 'manual', description);
  },
};
