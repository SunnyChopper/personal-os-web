/**
 * Shared Vite admin SPA: build, S3 sync, CloudFront invalidation (CI parity).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';

export function aws(args, env) {
  const region = env.AWS_REGION || 'us-east-1';
  const awsBin = env.AWS_BIN || process.env.AWS_BIN || 'aws';
  const r = spawnSync(awsBin, args, {
    env: { ...process.env, ...env, AWS_DEFAULT_REGION: region, AWS_REGION: region },
    stdio: 'inherit',
    shell: false,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}

export function buildSpa(webRoot, env) {
  execSync('bun run --filter web build', {
    cwd: webRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
}

export function assertSpaDist(webRoot) {
  const distRoot = join(webRoot, 'apps', 'web', 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) {
    const err = new Error(`[deploy-spa] No build at ${distRoot}. Build failed or output moved.`);
    err.code = 'SPA_DIST_MISSING';
    throw err;
  }
  return distRoot;
}

export function syncSpaDistToS3(webRoot, env) {
  const bucket = env.SPA_BUCKET;
  const region = env.AWS_REGION || 'us-east-1';
  const distRoot = assertSpaDist(webRoot);
  const distAssets = join(distRoot, 'assets');

  aws(
    [
      's3',
      'sync',
      distAssets,
      `s3://${bucket}/admin/assets/`,
      '--delete',
      '--region',
      region,
      '--cache-control',
      'public, max-age=31536000, immutable',
    ],
    env,
  );

  aws(
    [
      's3',
      'sync',
      distRoot,
      `s3://${bucket}/admin/`,
      '--delete',
      '--exclude',
      'assets/*',
      '--region',
      region,
      '--cache-control',
      'public, max-age=60',
    ],
    env,
  );
}

export function invalidateCloudFrontPaths(env, paths) {
  const distId = env.CLOUDFRONT_DISTRIBUTION_ID;
  if (!distId) {
    console.error('[deploy-spa] Missing CLOUDFRONT_DISTRIBUTION_ID.');
    process.exit(1);
  }
  aws(
    ['cloudfront', 'create-invalidation', '--distribution-id', distId, '--paths', ...paths],
    env,
  );
}
