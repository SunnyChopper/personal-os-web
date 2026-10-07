import { getGaMeasurementId } from '@/lib/vite-public-env';

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

export const GA_SURFACE = 'admin' as const;

export type GaDomain = 'tasks' | 'habits' | 'assistant' | 'weekly_review' | 'auth' | 'planner';

let analyticsInitScheduled = false;

function measurementId(): string | undefined {
  return getGaMeasurementId();
}

function baseConfig(): Record<string, unknown> {
  return {
    send_page_view: false,
    anonymize_ip: true,
    surface: GA_SURFACE,
  };
}

/** Load Google Analytics after first paint / idle to keep cold start lean. */
export function initDeferredAnalytics(): void {
  const id = measurementId();
  if (!id || analyticsInitScheduled || typeof window === 'undefined') return;
  analyticsInitScheduled = true;

  const load = () => {
    if (document.getElementById('ga-loader')) return;
    const script = document.createElement('script');
    script.id = 'ga-loader';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) {
      window.dataLayer?.push([command, targetId, config]);
    };
    window.gtag('js', new Date());
    window.gtag('config', id, baseConfig());
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(load, { timeout: 3000 });
  } else {
    window.setTimeout(load, 1500);
  }
}

export const pageview = (pathname: string) => {
  const id = measurementId();
  if (!id || typeof window.gtag === 'undefined') return;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  window.gtag('config', id, {
    ...baseConfig(),
    page_path: path,
  });
};

export const event = (action: string, params?: Record<string, unknown>) => {
  const id = measurementId();
  if (!id || typeof window.gtag === 'undefined') return;
  window.gtag('event', action, {
    ...params,
    surface: GA_SURFACE,
  });
};

const CANONICAL_EVENT_NAMES: Partial<Record<GaDomain, Record<string, string>>> = {
  tasks: { completed: 'task_completed' },
  habits: { completed: 'habit_completed' },
  weekly_review: { finalized: 'weekly_review_finalize', finalize: 'weekly_review_finalize' },
  auth: { login_success: 'auth_login_success' },
  planner: { focus_session_start: 'focus_session_start' },
};

export function trackDomainEvent(domain: GaDomain, action: string) {
  const eventName = CANONICAL_EVENT_NAMES[domain]?.[action] ?? `${domain}_${action}`;
  event(eventName, {
    event_category: domain,
    event_action: action,
    domain,
    action,
  });
}

export function trackAuthLoginSuccess() {
  trackDomainEvent('auth', 'login_success');
}

export function trackFocusSessionStart() {
  trackDomainEvent('planner', 'focus_session_start');
}

export function trackAssistantMessageSend() {
  event('assistant_message_send', {
    event_category: 'assistant',
    event_action: 'message_send',
    domain: 'assistant',
    action: 'message_send',
  });
}
