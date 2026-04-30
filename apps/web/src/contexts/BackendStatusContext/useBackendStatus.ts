import { useContext } from 'react';
import { BackendStatusContext, type BackendStatusContextValue } from './types';

export function useBackendStatus(): BackendStatusContextValue {
  const context = useContext(BackendStatusContext);
  if (!context) {
    throw new Error('useBackendStatus must be used within BackendStatusProvider');
  }
  return context;
}
