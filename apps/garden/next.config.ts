import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Glob cwd is the app directory (apps/garden). The workspace may hoist deps only to
// personal-os-web/node_modules, so "node_modules/foo/**" can match nothing.
// Include the workspace root as well (../../ = personal-os-web from this file).
// Keep aligned with `next` runtime deps (see node_modules/next/package.json →
// "dependencies" + anything you see in a Lambda ImportModuleError). Avoid
// `../../node_modules/@next/swc-*` (optional native) unless you need them—large
// and often platform-specific; OpenNext can filter wrong-arch binaries.
const traceIncludeGlobs = [
  'node_modules/@swc/counter/**',
  'node_modules/@swc/helpers/**',
  'node_modules/styled-jsx/**',
  'node_modules/@next/env/**',
  'node_modules/next/dist/compiled/jest-worker/**',
  // `pg` loads `pg-types` at runtime; file tracing can omit nested store deps (Lambda ERR).
  'node_modules/pg-types/**',
  'node_modules/pg-protocol/**',
  'node_modules/pgpass/**',
  '../../node_modules/@swc/counter/**',
  '../../node_modules/@swc/helpers/**',
  '../../node_modules/styled-jsx/**',
  '../../node_modules/@next/env/**',
  '../../node_modules/next/dist/compiled/jest-worker/**',
  '../../node_modules/pg-types/**',
  '../../node_modules/pg-protocol/**',
  '../../node_modules/pgpass/**',
  // pnpm / Bun store layout: target the package's own store entry only.
  // Avoid broad "**" — it descends into peer-isolation shadow dirs (EACCES) and
  // bloats the scan surface.
  '../../node_modules/.pnpm/pg-types@*/node_modules/pg-types/**',
  '../../node_modules/.pnpm/pg-protocol@*/node_modules/pg-protocol/**',
  '../../node_modules/.pnpm/pgpass@*/node_modules/pgpass/**',
  '../../node_modules/.bun/pg-types@*/node_modules/pg-types/**',
  '../../node_modules/.bun/pg-protocol@*/node_modules/pg-protocol/**',
  '../../node_modules/.bun/pgpass@*/node_modules/pgpass/**',
  '../../node_modules/.bun/@swc+counter@*/node_modules/@swc/counter/**',
  '../../node_modules/.bun/@swc+helpers@*/node_modules/@swc/helpers/**',
  '../../node_modules/.bun/styled-jsx@*/node_modules/styled-jsx/**',
  '../../node_modules/.bun/@next+env@*/node_modules/@next/env/**',
  '../../node_modules/.bun/next@*/node_modules/next/dist/compiled/jest-worker/**',
];

// Globs are relative to apps/garden/ (this file's directory).
// Exclude files that are never needed at Lambda runtime to reduce the tracer's
// working set and speed up "Collecting build traces".
const traceExcludeGlobs = [
  // Source maps — large, runtime irrelevant
  '**/*.map',
  // TypeScript declarations — compile-time only
  '**/*.d.ts',
  // Vite app — garden never imports from apps/web
  '../../apps/web/**',
  // Packages exclusive to apps/web that the tracer might still encounter
  // via the package store (e.g. transitive peer resolutions).
  '../../node_modules/.pnpm/@excalidraw+excalidraw*/node_modules/**',
  '../../node_modules/.pnpm/aws-amplify*/node_modules/**',
  '../../node_modules/.pnpm/@aws-amplify*/node_modules/**',
  '../../node_modules/.pnpm/vite@*/node_modules/**',
  '../../node_modules/.pnpm/vitest@*/node_modules/**',
  '../../node_modules/.pnpm/@playwright+test*/node_modules/**',
  '../../node_modules/.bun/@excalidraw+excalidraw*@*/node_modules/**',
  '../../node_modules/.bun/aws-amplify@*/node_modules/**',
  '../../node_modules/.bun/@aws+amplify*@*/node_modules/**',
  '../../node_modules/.bun/vite@*/node_modules/**',
  '../../node_modules/.bun/vitest@*/node_modules/**',
  '../../node_modules/.bun/@playwright+test@*/node_modules/**',
  // Bin shims / dev tooling at workspace root — never needed in Lambda
  '../../node_modules/.bin/**',
  '../../node_modules/eslint/**',
  '../../node_modules/eslint-*/**',
  '../../node_modules/@eslint/**',
  '../../node_modules/vite/**',
  '../../node_modules/vitest/**',
  '../../node_modules/@vitejs/**',
  '../../node_modules/@vitest/**',
  '../../node_modules/@playwright/**',
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Monorepo: trace so files under personal-os-web/node_modules and workspace packages
  // are visible to @vercel/nft (workspace packages, store layouts, etc.).
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: [
    '@personal-os-web/ui',
    '@personal-os-web/portfolio-types',
    '@personal-os-web/portfolio-data',
  ],
  // OpenNext + standalone: the tracer can miss packages Next still resolves at runtime
  // (require-hook, error overlay, styled-jsx, etc.). See:
  // https://opennext.js.org/aws/common_issues#include-a-missing-file
  //
  // Keys are picomatch route paths: `/*` is only one path segment, so add `/**` for
  // `/products/foo` and multi-segment API routes, plus explicit `/api` patterns.
  outputFileTracingIncludes: {
    '/': traceIncludeGlobs,
    '/*': traceIncludeGlobs,
    '/**': traceIncludeGlobs,
    '/api/*': traceIncludeGlobs,
    '/api/**': traceIncludeGlobs,
  },
  outputFileTracingExcludes: {
    '/**': traceExcludeGlobs,
  },
};

export default nextConfig;
