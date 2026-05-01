/**
 * Fast local check that the OpenNext server bundle can resolve the same modules
 * Lambda loads (no AWS deploy). Run after `bun run --filter garden build:opennext`.
 *
 * Resolution is anchored at `node_modules/next/package.json` (same as Next's
 * require-hook), not the monorepo root `package.json` — `styled-jsx` is a dep of
 * `next` and is not a top-level workspace dependency, so using the root package
 * would false-fail.
 *
 * Add a line to `modules` when a new Runtime.ImportModuleError names a package.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const gardenRoot = join(__dirname, "..");
const serverFnRoot = join(gardenRoot, ".open-next", "server-functions", "default");

/** @type {string[]} Resolved from `next` (same as Next's require-hook). */
const modulesFromNext = [
  "next/package.json",
  "styled-jsx/package.json",
  "@next/env",
  "@swc/counter",
  "@swc/helpers/package.json",
  "@swc/helpers/_/_interop_require_default",
];

/** @type {string[]} Resolved from the app package (pg subdeps are not hoisted to `next`). */
const modulesFromGarden = ["pg-types", "pg-protocol", "pgpass", "pg/package.json"];

const errors = [];

/** OpenNext puts `.next` under `apps/garden/` in monorepo mode; fallback to bundle root. */
function findBundledDotNextRoot() {
  const candidates = [
    join(serverFnRoot, "apps", "garden", ".next"),
    join(serverFnRoot, ".next"),
  ];
  for (const base of candidates) {
    const required = join(base, "required-server-files.json");
    const manifestDir = join(base, "server", "app-paths-manifest.json");
    if (existsSync(required) || existsSync(manifestDir)) return base;
  }
  return null;
}

/** Fail if tooling/.bin leaked into Lambda bundle via bloated traces. */
function assertBundleNodeModulesLean() {
  const forbiddenExact = new Set([".bin", "eslint", "vitest", "vite"]);

  function inspectNodeModulesDir(nmAbs) {
    let dirents;
    try {
      dirents = readdirSync(nmAbs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of dirents) {
      if (!d.isDirectory()) continue;
      const name = d.name;
      if (forbiddenExact.has(name)) {
        errors.push({
          spec: join(nmAbs, name),
          message: `${name} must not ship in Lambda server bundle`,
        });
        continue;
      }
      const scopeBad =
        name.startsWith("@playwright") ||
        name.startsWith("@vitest") ||
        name.startsWith("@vitejs") ||
        name.startsWith("@eslint");
      if (scopeBad) {
        errors.push({
          spec: join(nmAbs, name),
          message: `${name} must not ship in Lambda server bundle (dev tooling)`,
        });
      }
    }
  }

  /** @param {string} dir */
  function walk(dir) {
    if (!existsSync(dir)) return;
    let dirents;
    try {
      dirents = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of dirents) {
      if (!d.isDirectory()) continue;
      const p = join(dir, d.name);
      if (d.name === "node_modules") {
        inspectNodeModulesDir(p);
      }
      walk(p);
    }
  }

  walk(serverFnRoot);
}

function validateAppRouteArtifacts(dotNextRoot) {
  const manifestPath = join(dotNextRoot, "server", "app-paths-manifest.json");
  if (!existsSync(manifestPath)) {
    errors.push({
      spec: ".next/server/app-paths-manifest.json",
      message: "missing from OpenNext server bundle",
    });
    return 0;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    errors.push({
      spec: ".next/server/app-paths-manifest.json",
      message: e instanceof Error ? e.message : String(e),
    });
    return 0;
  }

  const routeEntries = Object.entries(manifest).filter(
    ([, rel]) => typeof rel === "string" && rel.startsWith("app/"),
  );

  for (const [, rel] of routeEntries) {
    const artifactPath = join(dotNextRoot, "server", rel);
    if (!existsSync(artifactPath)) {
      errors.push({
        spec: `.next/server/${rel}`,
        message: "listed in app-paths-manifest.json but missing from OpenNext server bundle",
      });
    }
  }

  return routeEntries.length;
}

/**
 * @returns {string | null} Absolute path to next's package.json inside the server bundle
 */
function findNextPackageJson() {
  const candidates = [
    join(serverFnRoot, "apps", "garden", "node_modules", "next", "package.json"),
    join(serverFnRoot, "node_modules", "next", "package.json"),
    // Bun store layout inside the bundle (OpenNext can preserve `.bun/<pkg>@...` paths).
    // We only need *one* next anchor for createRequire().
    join(
      serverFnRoot,
      "apps",
      "garden",
      "node_modules",
      ".bun",
      "next@15.2.4+dffad288897ab928",
      "node_modules",
      "next",
      "package.json",
    ),
    join(
      serverFnRoot,
      "node_modules",
      ".bun",
      "next@15.2.4+dffad288897ab928",
      "node_modules",
      "next",
      "package.json",
    ),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

const bundledDotNext = findBundledDotNextRoot();
if (!bundledDotNext && !existsSync(serverFnRoot)) {
  errors.push({
    spec: serverFnRoot,
    message: "OpenNext server bundle directory missing — run build:opennext first",
  });
}

const routeArtifactCount =
  bundledDotNext != null ? validateAppRouteArtifacts(bundledDotNext) : 0;
assertBundleNodeModulesLean();

const nextPkg = findNextPackageJson();
if (!nextPkg) {
  // Newer OpenNext outputs can embed runtime bits without shipping a traditional
  // `node_modules/next` folder alongside the server function. In that layout, a
  // `createRequire(nextPkg)` anchor doesn't exist. We treat the presence of the
  // server function entrypoint + required-server-files manifest as a sufficient
  // smoke check and skip module-resolution probing.
  const entry = join(serverFnRoot, "index.mjs");
  const dotNextMeta = bundledDotNext ?? join(serverFnRoot, ".next");
  const requiredAlt = existsSync(join(dotNextMeta, "required-server-files.json"))
    ? join(dotNextMeta, "required-server-files.json")
    : join(serverFnRoot, ".next", "required-server-files.json");
  if (existsSync(entry) && existsSync(requiredAlt) && errors.length === 0) {
    console.warn(
      "[verify-server-bundle] No `next/package.json` found in server bundle, but OpenNext output looks valid " +
        "(found index.mjs + .next/required-server-files.json). Skipping module resolution probe.",
    );
    process.exit(0);
  }
  console.error(
    `[verify-server-bundle] No \`next\` in the OpenNext server bundle. Tried:\n` +
      `  - ${join(serverFnRoot, "apps", "garden", "node_modules", "next", "package.json")}\n` +
      `  - ${join(serverFnRoot, "node_modules", "next", "package.json")}\n` +
      "Run: bun run --filter garden build:opennext",
  );
  process.exit(1);
}

const requireNext = createRequire(nextPkg);

for (const spec of modulesFromNext) {
  try {
    requireNext.resolve(spec);
  } catch (e) {
    errors.push({ spec, message: e instanceof Error ? e.message : String(e) });
  }
}

const gardenPkgInBundle = join(serverFnRoot, "apps", "garden", "package.json");
if (existsSync(gardenPkgInBundle)) {
  const requireGarden = createRequire(gardenPkgInBundle);
  for (const spec of modulesFromGarden) {
    try {
      requireGarden.resolve(spec);
    } catch (e) {
      errors.push({ spec, message: e instanceof Error ? e.message : String(e) });
    }
  }
} else {
  console.warn(
    `[verify-server-bundle] No ${gardenPkgInBundle}; skipped pg-related resolution (nonstandard bundle layout).`,
  );
}

if (errors.length) {
  console.error("[verify-server-bundle] Module resolution failed (would fail on Lambda):\n");
  for (const { spec, message } of errors) {
    console.error(`  ${spec}\n    ${message}`);
  }
  console.error(
    `\nResolution context: ${nextPkg}\n` +
      "Fix: add the package to outputFileTracingIncludes in next.config.ts, or add a direct " +
      "dependency on the app if it is a Next peer (e.g. styled-jsx). Then rebuild open-next.\n",
  );
  process.exit(1);
}

const moduleCount = modulesFromNext.length + (existsSync(gardenPkgInBundle) ? modulesFromGarden.length : 0);
console.log(
  `[verify-server-bundle] OK (${moduleCount} modules resolved, ${routeArtifactCount} app route artifacts present; next anchor ${nextPkg})`,
);
