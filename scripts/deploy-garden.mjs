/**
 * Public garden (OpenNext): build, verify server bundle, sync assets to S3,
 * update Lambda code, invalidate CloudFront. Use from `personal-os-web` root
 * when CI does not have the monorepo `scripts/deploy-frontend.mjs`.
 *
 * Usage:
 *   node scripts/deploy-garden.mjs dev
 *   node scripts/deploy-garden.mjs prod --no-build
 */
import { existsSync, unlinkSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { buildViteBuildEnv } from './lib/deploy-env.mjs';
import { aws, invalidateCloudFrontPaths } from './lib/deploy-spa-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const spawnShell = process.platform === 'win32';

function cleanOpenNextDir() {
  const dir = join(root, 'apps', 'garden', '.open-next');
  if (!existsSync(dir)) return;
  console.log('[deploy-garden] Removing apps/garden/.open-next');
  rmSync(dir, { recursive: true, force: true, maxRetries: 12, retryDelay: 100 });
}

function filebParamFromPath(absPath) {
  const s = absPath.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(s)) return `fileb://${s}`;
  if (s.startsWith('/')) return `fileb://${s}`;
  return `fileb://${s}`;
}

function assertNextJestWorkerChildPresent() {
  const gardenPkg = join(root, 'apps', 'garden', 'package.json');
  if (!existsSync(gardenPkg)) {
    console.error(`[deploy-garden] Missing ${gardenPkg}`);
    process.exit(1);
  }
  const require = createRequire(gardenPkg);
  let processChild;
  try {
    const nextPkgJson = require.resolve('next/package.json');
    processChild = join(nextPkgJson, '..', 'dist', 'compiled', 'jest-worker', 'processChild.js');
  } catch {
    console.error('[deploy-garden] Cannot resolve next from apps/garden');
    process.exit(1);
  }
  if (!existsSync(processChild)) {
    console.error(`[deploy-garden] Incomplete Next install; missing ${processChild}`);
    process.exit(1);
  }
}

function zipServerBundle(serverFnDir, zipPath) {
  if (existsSync(zipPath)) unlinkSync(zipPath);
  const follow = process.platform === 'win32' || process.platform === 'darwin' ? ['-L'] : ['-h'];
  const r = spawnSync('tar', [...follow, '-a', '-c', '-f', zipPath, '.'], {
    cwd: serverFnDir,
    stdio: 'inherit',
    shell: false,
  });
  if (r.error || r.status !== 0) {
    console.error('[deploy-garden] tar failed creating Lambda zip');
    process.exit(1);
  }
}

function verifyGardenServerBundleResolve() {
  const script = join(root, 'apps', 'garden', 'scripts', 'verify-server-bundle-resolve.mjs');
  if (!existsSync(script)) {
    console.error(`[deploy-garden] Missing ${script}`);
    process.exit(1);
  }
  execSync(`node ${JSON.stringify(script)}`, { cwd: root, stdio: 'inherit', shell: spawnShell });
}

function gardenUploadToAws(env) {
  const bucket = env.GARDEN_ASSETS_BUCKET;
  const fnName = env.GARDEN_LAMBDA_NAME;
  const gardenApp = join(root, 'apps', 'garden');
  const assetsRoot = join(gardenApp, '.open-next', 'assets');
  const serverFnDir = join(gardenApp, '.open-next', 'server-functions', 'default');
  if (!existsSync(assetsRoot) || !existsSync(serverFnDir)) {
    console.error('[deploy-garden] OpenNext output missing; run build first');
    process.exit(1);
  }
  const region = env.AWS_REGION || 'us-east-1';

  aws(
    [
      's3',
      'sync',
      assetsRoot,
      `s3://${bucket}/`,
      '--delete',
      '--region',
      region,
      '--cache-control',
      'public, max-age=60',
    ],
    env,
  );

  const zipPath = join(gardenApp, '.open-next', 'server-function.zip');
  console.log('[deploy-garden] Zipping Lambda bundle');
  zipServerBundle(serverFnDir, zipPath);
  aws(
    [
      'lambda',
      'update-function-code',
      '--function-name',
      fnName,
      '--zip-file',
      filebParamFromPath(zipPath),
      '--region',
      region,
    ],
    env,
  );
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const pos = argv.filter((a) => !a.startsWith('--'));
  const stage = pos[0] === 'prod' ? 'prod' : 'dev';
  return { stage, noBuild: flags.has('--no-build') };
}

const { stage, noBuild } = parseArgs(process.argv.slice(2));
const env = buildViteBuildEnv(root, stage);

if (!env.GARDEN_ASSETS_BUCKET || !env.GARDEN_LAMBDA_NAME) {
  console.error('[deploy-garden] Missing GARDEN_ASSETS_BUCKET or GARDEN_LAMBDA_NAME');
  process.exit(1);
}
if (!env.CLOUDFRONT_DISTRIBUTION_ID) {
  console.error('[deploy-garden] Missing CLOUDFRONT_DISTRIBUTION_ID');
  process.exit(1);
}

const merged = { ...process.env, ...env };

if (!noBuild) {
  assertNextJestWorkerChildPresent();
  cleanOpenNextDir();
  execSync('bun run --filter garden build:opennext', {
    cwd: root,
    env: merged,
    stdio: 'inherit',
    shell: spawnShell,
  });
} else {
  console.log('[deploy-garden] --no-build: using existing .open-next');
}

verifyGardenServerBundleResolve();
gardenUploadToAws(merged);
invalidateCloudFrontPaths(merged, ['/_next/static/*', '/*']);
console.log('[deploy-garden] Done.');
