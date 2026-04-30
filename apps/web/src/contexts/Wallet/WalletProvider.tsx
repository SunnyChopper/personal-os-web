import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { useWallet, useWalletMutations } from '@/hooks/useWallet';
import { useQueryClient } from '@tanstack/react-query';
import { WalletContext, type WalletContextType, type WalletTransaction } from './types';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { balance, transactions, loading, isRefreshing, error } = useWallet();
  const { addPoints: addPointsMutation, spendPoints: spendPointsMutation } = useWalletMutations();
  const queryClient = useQueryClient();

  const refreshWallet = useCallback(async () => {
    // Invalidate queries to trigger refetch
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
  }, [queryClient]);

  const addPoints = useCallback(
    async (
      amount: number,
      source: WalletTransaction['source'],
      description: string,
      sourceEntityType?: 'task' | 'reward' | null,
      sourceEntityId?: string | null
    ) => {
      await addPointsMutation({
        amount,
        source,
        description,
        sourceEntityType,
        sourceEntityId,
      });
    },
    [addPointsMutation]
  );

  const spendPoints = useCallback(
    async (
      amount: number,
      source: WalletTransaction['source'],
      description: string,
      sourceEntityType?: 'task' | 'reward' | null,
      sourceEntityId?: string | null
    ) => {
      await spendPointsMutation({
        amount,
        source,
        description,
        sourceEntityType,
        sourceEntityId,
      });
    },
    [spendPointsMutation]
  );

  const value: WalletContextType = {
    balance,
    transactions,
    loading,
    isRefreshing,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refreshWallet,
    addPoints,
    spendPoints,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
