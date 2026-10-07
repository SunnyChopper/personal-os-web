import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  event,
  GA_SURFACE,
  initDeferredAnalytics,
  pageview,
  trackAssistantMessageSend,
  trackDomainEvent,
} from '@/lib/analytics';

describe('analytics', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
    document.getElementById('ga-loader')?.remove();
    delete window.gtag;
    delete window.dataLayer;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    document.getElementById('ga-loader')?.remove();
  });

  it('no-ops pageview when gtag is not loaded', () => {
    pageview('/admin/tasks');
    expect(window.gtag).toBeUndefined();
  });

  it('sends pathname-only pageview when gtag is available', () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    pageview('/admin/tasks');

    expect(gtag).toHaveBeenCalledWith('config', 'G-TEST123', {
      send_page_view: false,
      anonymize_ip: true,
      surface: GA_SURFACE,
      page_path: '/admin/tasks',
    });
  });

  it('no-ops event when gtag is missing', () => {
    event('task_completed', { domain: 'tasks' });
    expect(window.gtag).toBeUndefined();
  });

  it('includes surface on custom events', () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackDomainEvent('tasks', 'completed');

    expect(gtag).toHaveBeenCalledWith(
      'event',
      'task_completed',
      expect.objectContaining({
        surface: GA_SURFACE,
        domain: 'tasks',
        action: 'completed',
      })
    );
  });

  it('tracks assistant message send with canonical event name', () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackAssistantMessageSend();

    expect(gtag).toHaveBeenCalledWith(
      'event',
      'assistant_message_send',
      expect.objectContaining({ domain: 'assistant', action: 'message_send' })
    );
  });

  it('initDeferredAnalytics no-ops without measurement id', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    initDeferredAnalytics();
    expect(document.getElementById('ga-loader')).toBeNull();
  });

  it('initDeferredAnalytics schedules script when id is set', () => {
    const idle = vi.fn((cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
    });
    vi.stubGlobal('requestIdleCallback', idle);

    initDeferredAnalytics();

    expect(idle).toHaveBeenCalled();
    expect(document.getElementById('ga-loader')).not.toBeNull();
  });
});
