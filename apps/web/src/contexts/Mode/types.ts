import { createContext } from 'react';

export interface ModeContextType {
  isLeisureMode: boolean;
  toggleMode: () => void;
}

export const ModeContext = createContext<ModeContextType | undefined>(undefined);
