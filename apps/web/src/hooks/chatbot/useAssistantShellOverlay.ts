import { useEffect } from 'react';

export function useAssistantShellOverlay(
  assistantChatsOpen: boolean,
  closeAssistantChats: () => void
) {
  useEffect(() => {
    if (!assistantChatsOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [assistantChatsOpen]);

  useEffect(() => {
    if (!assistantChatsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAssistantChats();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantChatsOpen, closeAssistantChats]);
}
