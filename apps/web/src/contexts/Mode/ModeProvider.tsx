import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ModeContext } from './types';
import { useModePreference, useModePreferenceMutations } from '@/hooks/useModePreference';

interface ModeProviderProps {
  children: ReactNode;
}

export const ModeProvider = ({ children }: ModeProviderProps) => {
  const { mode } = useModePreference();
  const { setModePreference } = useModePreferenceMutations();

  const isLeisureMode = mode === 'leisure';

  // Sync HTML class with current mode
  useEffect(() => {
    if (isLeisureMode) {
      document.documentElement.classList.add('leisure-mode');
    } else {
      document.documentElement.classList.remove('leisure-mode');
    }
  }, [isLeisureMode]);

  const toggleMode = async () => {
    const newMode = !isLeisureMode;
    try {
      await setModePreference(newMode ? 'leisure' : 'work');
    } catch (error) {
      console.error('Failed to save mode preference:', error);
      // React Query will handle rollback via optimistic updates
    }
  };

  const value = {
    isLeisureMode,
    toggleMode,
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};
