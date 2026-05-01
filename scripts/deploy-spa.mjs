/**
 * Local SPA deploy: build `apps/web` then sync to S3 + invalidate CloudFront (same as CI).
 * Requires AWS CLI (`aws`) on PATH and credentials (e.g. `aws configure` or `AWS_PROFILE`).
 *
 * Usage:
 *   bun run deploy:frontend:personal-os:dev
 *   node scripts/deploy-spa.mjs dev
 *   node scripts/deploy-spa.mjs prod --no-build    # CI: after `bun run --filter web build`
 *
 * Config: copy `.env.deploy.example` → `.env.deploy.dev` (or `.env.deploy.prod`) and set
 * `SPA_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`. Vite `VITE_*` also loaded from
 * `apps/web/.env.dev` / `apps/web/.env.prod` (overridable in `.env.deploy.*`).
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildViteBuildEnv } from './lib/deploy-env.mjs';
import {
  buildSpa,
  syncSpaDistToS3,
  invalidateCloudFrontPaths,
  assertSpaDist,
} from './lib/deploy-spa-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const pos = argv.filter((a) => !a.startsWith('--'));
  const stage = pos[0] === 'prod' ? 'prod' : 'dev';
  return { stage, noBuild: flags.has('--no-build') };
}

const { stage, noBuild } = parseArgs(process.argv.slice(2));
const envFileName = stage === 'prod' ? '.env.deploy.prod' : '.env.deploy.dev';

const env = buildViteBuildEnv(root, stage);

const bucket = env.SPA_BUCKET;
const distId = env.CLOUDFRONT_DISTRIBUTION_ID;
const region = env.AWS_REGION || 'us-east-1';

if (!bucket || !distId) {
  console.error(
    `[deploy-spa] Missing SPA_BUCKET or CLOUDFRONT_DISTRIBUTION_ID.\n` +
      `  Add them to ${envFileName} in ${root} (see .env.deploy.example), or export them in your shell.`,
  );
  process.exit(1);
}

console.log(`[deploy-spa] stage=${stage} bucket=${bucket} region=${region}`);

if (!noBuild) {
  buildSpa(root, env);
} else {
  console.log('[deploy-spa] --no-build: using existing apps/web/dist');
  try {
    assertSpaDist(root);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

syncSpaDistToS3(root, env);
invalidateCloudFrontPaths(env, ['/admin/index.html', '/admin/*']);

console.log('[deploy-spa] Done.');
