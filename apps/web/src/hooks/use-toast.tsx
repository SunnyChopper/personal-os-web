import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
}

function resolveToastDuration(toast: Omit<Toast, 'id'>): number {
  if (toast.duration != null) return toast.duration;
  return toast.action ? 8000 : 5000;
}

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

function createToastId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function scheduleToastDismiss(id: string, duration: number) {
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, duration);
}

/** Imperative toast for use outside React components (e.g. React Query mutation callbacks). */
export function pushToastNotification(toast: Omit<Toast, 'id'>): string {
  const id = createToastId();
  const newToast = { ...toast, id };
  toasts = [...toasts, newToast];
  notifyListeners();

  scheduleToastDismiss(id, resolveToastDuration(toast));
  return id;
}

export function dismissToastNotification(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function clearToastNotifications() {
  toasts = [];
  notifyListeners();
}

/** Subscribes to the shared toast store for the single admin-shell host. */
export function useToastSnapshot() {
  const [toastState, setToastState] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToastState(newToasts);
    toastListeners.push(listener);
    listener(toasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismissToast = useCallback((id: string) => dismissToastNotification(id), []);

  return { toasts: toastState, dismissToast };
}

export function useToast() {
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => pushToastNotification(toast), []);

  const dismissToast = useCallback((id: string) => dismissToastNotification(id), []);

  const clearToasts = useCallback(() => clearToastNotifications(), []);

  return {
    showToast,
    dismissToast,
    clearToasts,
  };
}
