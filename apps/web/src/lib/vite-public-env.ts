/**
 * Build-time public env resolution for Vite.
 *
 * Production: use `VITE_API_BASE_URL` (see `apps/web/.env.production`, auto-loaded on `vite build`).
 * We do **not** default to same-origin `/api` for prod: edge `/api/*` is routed to the
 * public-garden app, not the Personal OS API — a missing env caused requests to the wrong
 * service and long timeouts. Fallback below matches that prod API.
 *
 * Local `vite` defaults to the hosted dev API so auth and `/auth/*` hit the dev stack.
 * Cognito `VITE_AWS_*` must match the user pool wired to that API stage.
 */
export const HOSTED_DEV_API_BASE_URL = 'https://dev-api.sunnysingh.tech';

/** When `VITE_API_BASE_URL` is unset in a production bundle (e.g. misconfigured CI). */
const CANONICAL_PROD_API_BASE_URL = 'https://api.sunnysingh.tech';

/** Dev WebSocket stage URL; override with `VITE_WS_URL` if your deploy uses a different API id. */
export const HOSTED_DEV_WS_URL =
  'wss://wqrazrszmb.execute-api.us-east-1.amazonaws.com/dev';

export function getResolvedApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL;
  if (explicit) return explicit;
  if (import.meta.env.DEV) return HOSTED_DEV_API_BASE_URL;
  if (import.meta.env.PROD) return CANONICAL_PROD_API_BASE_URL;
  return '/api';
}

export function getResolvedWsUrl(): string | undefined {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit;
  if (import.meta.env.DEV) return HOSTED_DEV_WS_URL;
  return undefined;
}
