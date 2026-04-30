import { useState, useCallback, useEffect } from 'react';
import { ToastContainer } from '@/components/molecules/Toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

/** Imperative toast for use outside React components (e.g. React Query mutation callbacks). */
export function pushToastNotification(toast: Omit<Toast, 'id'>): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const newToast = { ...toast, id };
  toasts = [...toasts, newToast];
  notifyListeners();

  const duration = toast.duration ?? 5000;
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, duration);
  return id;
}

export function useToast() {
  const [toastState, setToastState] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToastState(newToasts);
    toastListeners.push(listener);
    listener(toasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };
    toasts = [...toasts, newToast];
    notifyListeners();

    const duration = toast.duration || 5000;
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, duration);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  const clearToasts = useCallback(() => {
    toasts = [];
    notifyListeners();
  }, []);

  return {
    showToast,
    dismissToast,
    clearToasts,
    ToastContainer: () => <ToastContainer toasts={toastState} onDismiss={dismissToast} />,
  };
}
