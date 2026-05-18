import { apiClient } from '@/lib/api-client';
import type { WalletBalance, WalletDetailPayload, WalletTransaction } from '@/types/rewards';
import type { ApiResponse } from '@/types/api-contracts';

interface WalletResponse {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  recentTransactions: WalletTransaction[];
}

function mapWalletPayload(response: ApiResponse<WalletResponse>): ApiResponse<WalletDetailPayload> {
  if (response.success && response.data) {
    const balance: WalletBalance = {
      userId: '',
      totalPoints: response.data.balance,
      lifetimeEarned: response.data.lifetimeEarned,
      lifetimeSpent: response.data.lifetimeSpent,
      updatedAt: new Date().toISOString(),
    };
    return {
      success: true,
      data: {
        balance,
        transactions: response.data.recentTransactions,
      },
    };
  }
  return {
    success: false,
    error: response.error || { message: 'Failed to fetch wallet', code: 'FETCH_ERROR' },
  };
}

export const walletService = {
  /** One HTTP GET `/wallet` — use for shell + React Query `wallet.detail` key */
  async fetchWalletDetail(): Promise<ApiResponse<WalletDetailPayload>> {
    const response = await apiClient.get<WalletResponse>('/wallet');
    return mapWalletPayload(response);
  },

  async getBalance(): Promise<ApiResponse<WalletBalance>> {
    const detail = await this.fetchWalletDetail();
    if (detail.success && detail.data) {
      return { success: true, data: detail.data.balance };
    }
    return {
      error: detail.error || { message: 'Failed to fetch wallet balance', code: 'FETCH_ERROR' },
      success: false,
    };
  },

  async getTransactions(limit?: number): Promise<ApiResponse<WalletTransaction[]>> {
    const detail = await this.fetchWalletDetail();
    if (detail.success && detail.data) {
      const transactions = limit
        ? detail.data.transactions.slice(0, limit)
        : detail.data.transactions;
      return { data: transactions, success: true };
    }
    return {
      error: detail.error || { message: 'Failed to fetch transactions', code: 'FETCH_ERROR' },
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
    return this.addPoints(amount, 'system', description, sourceEntityType, sourceEntityId);
  },

  async adjustPoints(
    amount: number,
    description: string
  ): Promise<ApiResponse<{ balance: WalletBalance; transaction: WalletTransaction }>> {
    return this.addPoints(amount, 'manual', description);
  },
};
