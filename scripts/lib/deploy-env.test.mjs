import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildViteBuildEnv } from './deploy-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function mkWebRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-env-'));
  fs.mkdirSync(path.join(root, 'apps', 'web'), { recursive: true });
  return root;
}

test('buildViteBuildEnv layers base then stage then deploy', () => {
  const webRoot = mkWebRoot();
  fs.writeFileSync(
    path.join(webRoot, 'apps', 'web', '.env'),
    'VITE_API_BASE_URL=https://base.example\nVITE_SHARED=base\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(webRoot, 'apps', 'web', '.env.prod'),
    'VITE_SHARED=stage\nVITE_AWS_REGION=us-east-1\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(webRoot, '.env.deploy.prod'),
    'SPA_BUCKET=my-bucket\nVITE_SHARED=deploy\n',
    'utf8',
  );

  const env = buildViteBuildEnv(webRoot, 'prod');
  assert.equal(env.VITE_API_BASE_URL, 'https://base.example');
  assert.equal(env.VITE_AWS_REGION, 'us-east-1');
  assert.equal(env.VITE_SHARED, 'deploy');
  assert.equal(env.SPA_BUCKET, 'my-bucket');
});

test('buildViteBuildEnv works without apps/web/.env', () => {
  const webRoot = mkWebRoot();
  fs.writeFileSync(path.join(webRoot, 'apps', 'web', '.env.dev'), 'VITE_API_BASE_URL=https://dev.example\n', 'utf8');
  fs.writeFileSync(path.join(webRoot, '.env.deploy.dev'), 'SPA_BUCKET=dev-bucket\n', 'utf8');

  const env = buildViteBuildEnv(webRoot, 'dev');
  assert.equal(env.VITE_API_BASE_URL, 'https://dev.example');
  assert.equal(env.SPA_BUCKET, 'dev-bucket');
});
