import { useContext } from 'react';
import { KnowledgeVaultContext } from './types';

export const useKnowledgeVault = () => {
  const context = useContext(KnowledgeVaultContext);
  if (!context) {
    throw new Error('useKnowledgeVault must be used within KnowledgeVaultProvider');
  }
  return context;
};
