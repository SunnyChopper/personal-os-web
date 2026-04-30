/* Context modules conventionally export a hook alongside the provider. */
/* eslint-disable react-refresh/only-export-components -- provider + useAdminShell */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';

interface AdminShellContextValue {
  mainNavOpen: boolean;
  assistantChatsOpen: boolean;
  toggleMainNav: () => void;
  toggleAssistantChats: () => void;
  closeMainNav: () => void;
  closeAssistantChats: () => void;
  closeAll: () => void;
}

const AdminShellContext = createContext<AdminShellContextValue | undefined>(undefined);

interface AdminShellProviderProps {
  children: ReactNode;
}

export function AdminShellProvider({ children }: AdminShellProviderProps) {
  const location = useLocation();
  const [mainNavOpen, setMainNavOpen] = useState(false);
  const [assistantChatsOpen, setAssistantChatsOpen] = useState(false);

  const closeMainNav = useCallback(() => {
    setMainNavOpen(false);
  }, []);

  const closeAssistantChats = useCallback(() => {
    setAssistantChatsOpen(false);
  }, []);

  const closeAll = useCallback(() => {
    setMainNavOpen(false);
    setAssistantChatsOpen(false);
  }, []);

  const toggleMainNav = useCallback(() => {
    setAssistantChatsOpen(false);
    setMainNavOpen((prev) => !prev);
  }, []);

  const toggleAssistantChats = useCallback(() => {
    setMainNavOpen(false);
    setAssistantChatsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith(ROUTES.admin.assistant)) {
      setAssistantChatsOpen(false);
    }
  }, [location.pathname]);

  const value = useMemo(
    () => ({
      mainNavOpen,
      assistantChatsOpen,
      toggleMainNav,
      toggleAssistantChats,
      closeMainNav,
      closeAssistantChats,
      closeAll,
    }),
    [
      assistantChatsOpen,
      closeAll,
      closeAssistantChats,
      closeMainNav,
      mainNavOpen,
      toggleAssistantChats,
      toggleMainNav,
    ]
  );

  return <AdminShellContext.Provider value={value}>{children}</AdminShellContext.Provider>;
}

export function useAdminShell() {
  const context = useContext(AdminShellContext);
  if (!context) {
    throw new Error('useAdminShell must be used within AdminShellProvider');
  }
  return context;
}
