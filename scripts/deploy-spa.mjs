/**
 * Local SPA deploy: build `apps/web` then sync to S3 + invalidate CloudFront (same as CI).
 * Requires AWS CLI (`aws`) on PATH and credentials (e.g. `aws configure` or `AWS_PROFILE`).
 *
 * Usage:
 *   bun run deploy:frontend:personal-os:dev
 *   node scripts/deploy-spa.mjs dev
 *
 * Config: copy `.env.deploy.example` → `.env.deploy.dev` (or `.env.deploy.prod`) and set
 * `SPA_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`. Vite `VITE_*` also loaded from
 * `apps/web/.env.dev` / `apps/web/.env.prod` (overridable in `.env.deploy.*`).
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildViteBuildEnv } from './lib/deploy-env.mjs';
import {
  buildSpa,
  syncSpaDistToS3,
  invalidateCloudFrontPaths,
} from './lib/deploy-spa-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const stage = process.argv[2] === 'prod' ? 'prod' : 'dev';
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

buildSpa(root, env);
syncSpaDistToS3(root, env);
invalidateCloudFrontPaths(env, ['/admin/index.html', '/admin/*']);

console.log('[deploy-spa] Done.');
