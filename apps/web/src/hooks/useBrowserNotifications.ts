import { useCallback, useEffect, useState } from 'react';

export type BrowserNotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function readPermission(): BrowserNotificationPermission {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  const p = Notification.permission;
  if (p === 'default' || p === 'granted' || p === 'denied') return p;
  return 'unsupported';
}

/**
 * SSR-safe helpers for the Web Notifications API (Chrome / Edge on Windows surfaces these in Action Center).
 */
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<BrowserNotificationPermission>(() =>
    readPermission()
  );

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  const requestPermission = useCallback(async (): Promise<
    NotificationPermission | 'unsupported'
  > => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'default');
      return result;
    } catch {
      const next = readPermission();
      setPermission(next);
      return next === 'unsupported' ? 'unsupported' : Notification.permission;
    }
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions): Notification | null => {
      if (typeof window === 'undefined' || !('Notification' in window)) return null;
      if (Notification.permission !== 'granted') return null;

      try {
        return new Notification(title, {
          icon: '/favicon.ico',
          silent: false,
          ...options,
        });
      } catch {
        return null;
      }
    },
    []
  );

  return { permission, requestPermission, notify };
}
