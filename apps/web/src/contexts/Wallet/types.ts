import { createContext } from 'react';
import type { WalletBalance, WalletTransaction } from '@/types/rewards';

export interface WalletContextType {
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  loading: boolean;
  /** Wallet queries refetching after invalidation (e.g. task status → clawback). */
  isRefreshing: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  addPoints: (
    amount: number,
    source: WalletTransaction['source'],
    description: string,
    sourceEntityType?: 'task' | 'reward' | null,
    sourceEntityId?: string | null
  ) => Promise<void>;
  spendPoints: (
    amount: number,
    source: WalletTransaction['source'],
    description: string,
    sourceEntityType?: 'task' | 'reward' | null,
    sourceEntityId?: string | null
  ) => Promise<void>;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Re-export types for convenience
export type { WalletBalance, WalletTransaction };
