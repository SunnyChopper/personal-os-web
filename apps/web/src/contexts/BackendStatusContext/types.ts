import { createContext } from 'react';
import type { ApiError } from '@/types/api-contracts';

export interface BackendStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastError: ApiError | null;
  errorCount: number;
}

export interface BackendStatusContextValue {
  status: BackendStatus;
  checkConnection: () => Promise<boolean>;
  resetErrorCount: () => void;
  recordError: (error: ApiError) => void;
  recordSuccess: () => void;
}

export const BackendStatusContext = createContext<BackendStatusContextValue | undefined>(undefined);
