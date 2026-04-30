/**
 * Load `.env.deploy.{stage}` from the personal-os-web workspace root.
 * Also load `apps/web/.env.dev` or `apps/web/.env.prod` for Vite (VITE_*) build-time
 * defaults — the deploy file overrides when both define the same key.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function deployEnvFileName(stage) {
  return stage === 'prod' ? '.env.deploy.prod' : '.env.deploy.dev';
}

function parseEnvFile(p) {
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function loadDeployEnvFile(webRoot, stage) {
  return parseEnvFile(join(webRoot, deployEnvFileName(stage)));
}

/**
 * Vite `build` (Cognito, API, WS) lives in `apps/web/.env.{dev|prod}`; deploy scripts
 * historically only read `.env.deploy.*` (S3, CloudFront). Merge so `bun run build` via
 * deploy-frontend always gets VITE_* without duplicating them in .env.deploy.
 */
export function loadWebAppViteEnvFile(webRoot, stage) {
  const name = stage === 'prod' ? '.env.prod' : '.env.dev';
  return parseEnvFile(join(webRoot, 'apps', 'web', name));
}

/**
 * @param {Record<string, string | undefined>} [overrides] - e.g. deploy file on top of web app
 */
export function mergeProcessEnv(overrides) {
  return { ...process.env, ...overrides };
}

/** Full env for Vite: process → apps/web/.env.(dev|prod) → .env.deploy.* (highest wins). */
export function buildViteBuildEnv(webRoot, stage) {
  const webApp = loadWebAppViteEnvFile(webRoot, stage);
  const deploy = loadDeployEnvFile(webRoot, stage);
  return { ...process.env, ...webApp, ...deploy };
}
