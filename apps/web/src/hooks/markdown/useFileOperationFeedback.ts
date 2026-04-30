import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

/**
 * Hook for managing file operation feedback (success/error messages)
 */
export function useFileOperationFeedback() {
  const navigate = useNavigate();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const showSuccessAndNavigate = (message: string, delay = 1000): void => {
    setSaveSuccess(message);
    setTimeout(() => {
      navigate(ROUTES.admin.markdownViewer);
      setSaveSuccess(null);
    }, delay);
  };

  const showError = (message: string): void => {
    setSaveError(message);
  };

  const clearMessages = (): void => {
    setSaveError(null);
    setSaveSuccess(null);
  };

  return {
    saveError,
    saveSuccess,
    showSuccessAndNavigate,
    showError,
    clearMessages,
    setSaveError,
    setSaveSuccess,
  };
}
