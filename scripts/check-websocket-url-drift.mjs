/**
 * Fail if committed / env WebSocket URLs drift from the live API Gateway WebSocket API
 * named personal-os-api-<stage>-ws (service prefix overridable via LAMBDA_SERVICE_NAME).
 *
 * Usage:
 *   node scripts/check-websocket-url-drift.mjs dev [--web-root <dir>]
 *   CHECK_WS_URL_EXPECTED=wss://... node scripts/check-websocket-url-drift.mjs prod [--web-root <dir>]
 *   node scripts/check-websocket-url-drift.mjs prod --expected-url wss://...
 *
 * Requires: aws CLI, credentials (same account/region as stack). Region: AWS_REGION (default us-east-1).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

function spawnAws(args) {
  const r = spawnSync('aws', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(r.stderr?.trim() || r.stdout?.trim() || `aws exited ${r.status}`);
    process.exit(1);
  }
  return r.stdout || '';
}

function awsJson(args) {
  return JSON.parse(spawnAws(args));
}

function normalizeWsUrl(u) {
  return String(u || '')
    .trim()
    .replace(/\/$/, '');
}

/** Normalize WSS connect URLs for comparison (hostname case, trailing slash). */
function normalizeWsConnectUrl(u) {
  const s = normalizeWsUrl(u);
  try {
    const url = new URL(s);
    url.hostname = url.hostname.toLowerCase();
    let path = url.pathname.replace(/\/$/, '');
    if (path === '/') path = '';
    const host = url.host.toLowerCase(); // includes port if present
    return `${url.protocol}//${host}${path}`;
  } catch {
    return s.toLowerCase();
  }
}

function getDeployedWsStageName(apiId, region, preferredStage) {
  const stages = awsJson([
    'apigatewayv2',
    'get-stages',
    '--region',
    region,
    '--api-id',
    apiId,
    '--output',
    'json',
  ]);
  const items = stages.Items || [];
  const match = items.find((x) => x.StageName === preferredStage);
  if (match) return match.StageName;
  if (items.length === 1) return items[0].StageName;
  console.error(
    `WebSocket API ${apiId}: no stage named "${preferredStage}". Available: ${items.map((x) => x.StageName).join(', ')}`,
  );
  process.exit(1);
}

function stripQuotes(s) {
  return s.replace(/^['"]|['"]$/g, '').trim();
}

function resolveWebRoot() {
  const idx = process.argv.indexOf('--web-root');
  if (idx !== -1 && process.argv[idx + 1]) {
    const dir = process.argv[idx + 1];
    if (!existsSync(join(dir, 'apps/web/.env.ci-dev'))) {
      console.error(`--web-root ${dir} missing apps/web/.env.ci-dev`);
      process.exit(1);
    }
    return dir;
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const parentOfScripts = dirname(scriptDir);
  if (existsSync(join(parentOfScripts, 'apps/web/.env.ci-dev'))) {
    return parentOfScripts;
  }

  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'apps/web/.env.ci-dev'))) return dir;
    if (existsSync(join(dir, 'personal-os-web', 'apps/web/.env.ci-dev'))) {
      return join(dir, 'personal-os-web');
    }
    const p = dirname(dir);
    if (p === dir) break;
    dir = p;
  }

  console.error(
    'Could not find apps/web/.env.ci-dev (pass --web-root <path-to-personal-os-web checkout>)',
  );
  process.exit(1);
}

function parseEnvFile(path, key) {
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    const m = trimmed.match(new RegExp(`^${key}\\s*=\\s*(.*)$`));
    if (m) return stripQuotes(m[1].split('#')[0].trim());
  }
  return null;
}

function parseHostedDevWsUrl(tsPath) {
  const text = readFileSync(tsPath, 'utf8');
  const m = text.match(/HOSTED_DEV_WS_URL\s*=\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

function parseTfvarsExample(path) {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8');
  const m = text.match(/^\s*ws_url\s*=\s*["']([^"']+)["']/m);
  return m ? m[1] : null;
}

function liveWsUrlForStage(stage, region) {
  const service = process.env.LAMBDA_SERVICE_NAME || 'personal-os-api';
  const apiName = `${service}-${stage}-ws`;
  const apis = awsJson(['apigatewayv2', 'get-apis', '--region', region, '--output', 'json']);
  const item = apis.Items?.find(
    (a) => a.Name === apiName && a.ProtocolType === 'WEBSOCKET',
  );
  if (!item) {
    console.error(`No WebSocket API named ${apiName} in ${region}`);
    process.exit(1);
  }
  const stageName = getDeployedWsStageName(item.ApiId, region, stage);
  const endpoint = item.ApiEndpoint || '';
  const wssBase = endpoint.replace(/^https:\/\//i, 'wss://');
  const expected = `${normalizeWsUrl(wssBase)}/${stageName}`;
  return { expected, apiId: item.ApiId, apiName, stageName };
}

/**
 * True if CHECK_WS_URL / VITE_WS_URL matches the live execute-api WSS URL.
 * Allows hostname case differences and a candidate that omits the stage path
 * (we append the deployed stage name once).
 */
function prodCandidateMatchesLive(candidate, expected, stageName) {
  const expN = normalizeWsConnectUrl(expected);
  if (normalizeWsConnectUrl(candidate) === expN) return true;
  try {
    const base = normalizeWsUrl(candidate);
    const u = new URL(base);
    const p = (u.pathname || '').replace(/\/$/, '');
    if (!p || p === '') {
      return normalizeWsConnectUrl(`${base}/${stageName}`) === expN;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function main() {
  const stage = process.argv[2];
  if (stage !== 'dev' && stage !== 'prod') {
    console.error(
      'Usage: node check-websocket-url-drift.mjs <dev|prod> [--web-root <dir>] [--expected-url <url>]\n' +
        '  prod: set CHECK_WS_URL_EXPECTED or pass --expected-url (value is compared, not printed)',
    );
    process.exit(1);
  }

  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const { expected, apiId, apiName, stageName } = liveWsUrlForStage(stage, region);

  if (stage === 'dev') {
    const webRoot = resolveWebRoot();
    const envCi = join(webRoot, 'apps/web/.env.ci-dev');
    const viteEnv = join(webRoot, 'apps/web/src/lib/vite-public-env.ts');
    const tfExample = join(webRoot, 'infrastructure/terraform.tfvars.example');

    const checks = [
      ['apps/web/.env.ci-dev VITE_WS_URL', parseEnvFile(envCi, 'VITE_WS_URL')],
      ['vite-public-env.ts HOSTED_DEV_WS_URL', parseHostedDevWsUrl(viteEnv)],
    ];
    const tfUrl = parseTfvarsExample(tfExample);
    if (tfUrl) checks.push(['infrastructure/terraform.tfvars.example ws_url', tfUrl]);

    let ok = true;
    for (const [label, val] of checks) {
      if (!val) {
        console.error(`MISSING ${label}`);
        ok = false;
        continue;
      }
      if (normalizeWsConnectUrl(val) !== normalizeWsConnectUrl(expected)) {
        console.error(
          `DRIFT ${label}:\n  repo:  ${val}\n  aws:   ${expected}\n  (${apiName} ApiId=${apiId})`,
        );
        ok = false;
      }
    }
    if (!ok) process.exit(1);
    console.log(`OK dev WebSocket URL matches ${apiName} (ApiId=${apiId}): ${expected}`);
    process.exit(0);
  }

  let candidate = (process.env.CHECK_WS_URL_EXPECTED || '').trim();
  const expIdx = process.argv.indexOf('--expected-url');
  if (expIdx !== -1 && process.argv[expIdx + 1]) {
    candidate = process.argv[expIdx + 1].trim();
  }
  if (!candidate) {
    console.error('prod mode requires CHECK_WS_URL_EXPECTED env or --expected-url <url>');
    process.exit(1);
  }

  if (!prodCandidateMatchesLive(candidate, expected, stageName)) {
    console.error(
      `DRIFT prod WebSocket URL:\n  candidate (GitHub VITE_WS_URL / CHECK_WS_URL_EXPECTED): ${candidate}\n` +
        `  aws (live ${apiName}, stage "${stageName}"): ${expected}\n` +
        `  ApiId=${apiId}\n` +
        `\nFix: In GitHub Environment **prod**, set secret **VITE_WS_URL** exactly to the aws line above.\n` +
        `Common mistake: using the **dev** WebSocket URL (…/dev) or an old API id — must match this prod API and stage.`,
    );
    process.exit(1);
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const webRootFromScript = dirname(scriptDir);
  const envProd = join(webRootFromScript, 'apps/web/.env.production');
  if (existsSync(envProd)) {
    const committed = parseEnvFile(envProd, 'VITE_WS_URL');
    if (committed && !prodCandidateMatchesLive(committed, expected, stageName)) {
      console.error(
        `DRIFT apps/web/.env.production VITE_WS_URL:\n  repo:  ${committed}\n  aws:   ${expected}\n  (${apiName} ApiId=${apiId})`,
      );
      process.exit(1);
    }
  }

  console.log(`OK prod WebSocket URL matches ${apiName} (ApiId=${apiId})`);
  process.exit(0);
}

main();
