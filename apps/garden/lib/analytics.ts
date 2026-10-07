export const GA_SURFACE = 'garden' as const;

export type GardenCtaId =
  | 'nav_home'
  | 'nav_skills'
  | 'nav_portfolio'
  | 'nav_blog'
  | 'nav_contact'
  | 'nav_insights'
  | 'nav_products';

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

export function getGardenGaMeasurementId(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return explicit || undefined;
}

function baseConfig(): Record<string, unknown> {
  return {
    send_page_view: false,
    anonymize_ip: true,
    surface: GA_SURFACE,
  };
}

export function gardenPageview(pathname: string) {
  const id = getGardenGaMeasurementId();
  if (!id || typeof window === 'undefined' || typeof window.gtag === 'undefined') return;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  window.gtag('config', id, {
    ...baseConfig(),
    page_path: path,
  });
}

export function gardenEvent(action: string, params?: Record<string, unknown>) {
  const id = getGardenGaMeasurementId();
  if (!id || typeof window === 'undefined' || typeof window.gtag === 'undefined') return;
  window.gtag('event', action, {
    ...params,
    surface: GA_SURFACE,
  });
}

export function trackGardenCtaClick(ctaId: GardenCtaId) {
  gardenEvent('garden_cta_click', { cta_id: ctaId });
}

export function trackAskSunnySubmit() {
  gardenEvent('ask_sunny_submit');
}

export function trackAskSunnyError() {
  gardenEvent('ask_sunny_error');
}

export function trackColliderSynthesize(outcome: 'success' | 'error') {
  gardenEvent('collider_synthesize', { outcome });
}

/** Validates event payloads exclude known PII keys (for tests). */
export function assertGardenEventParamsSafe(params: Record<string, unknown>): boolean {
  const forbidden = ['email', 'message', 'text', 'prompt', 'userId', 'nodeIds'];
  return forbidden.every((key) => !Object.prototype.hasOwnProperty.call(params, key));
}
