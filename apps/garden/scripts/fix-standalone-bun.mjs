import {
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  cpSync,
  statSync,
  lstatSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, "..");
const webRoot = path.join(appRoot, "..", ".."); // personal-os-web

/** Copy or mkdir; skip if dest exists. Returns true if a new file was written or dir created. */
function stageCopy(from, to) {
  if (existsSync(to)) return false;
  if (!existsSync(from)) {
    throw new Error(`[fix-standalone] missing source: ${from}`);
  }
  let st;
  try {
    st = lstatSync(from);
  } catch {
    st = null;
  }
  if (st && (st.isDirectory() || (st.isSymbolicLink() && statSync(from).isDirectory()))) {
    mkdirSync(to, { recursive: true });
    return true;
  }
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
  const s = statSync(to);
  if (!s.isFile()) {
    throw new Error(`[fix-standalone] expected file at ${to}`);
  }
  return true;
}

function copyDirectoryFiles(fromDir, toDir) {
  if (!existsSync(fromDir)) return 0;

  let n = 0;
  mkdirSync(toDir, { recursive: true });
  for (const ent of readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, ent.name);
    const to = path.join(toDir, ent.name);
    if (!existsSync(from)) continue;
    if (ent.isDirectory()) {
      n += copyDirectoryFiles(from, to);
      continue;
    }
    if (stageCopy(from, to)) n++;
  }
  return n;
}

/** Resolve a traced path; if app-local node_modules is missing, use hoisted workspace root. */
function resolveTraceSource(absResolved) {
  if (existsSync(absResolved)) return absResolved;
  const appNmRoot = path.join(appRoot, "node_modules");
  const normAbs = normalizePath(absResolved);
  const normAppNm = normalizePath(appNmRoot);
  const appNmPrefix = `${normAppNm}/`;
  if (normAbs === normAppNm || normAbs.startsWith(appNmPrefix)) {
    const tail = path.relative(appNmRoot, absResolved);
    const atRoot = path.join(webRoot, "node_modules", tail);
    if (existsSync(atRoot)) return atRoot;
  }
  return null;
}

function normalizePath(p) {
  return path.normalize(p).replaceAll("\\", "/");
}

/** NFT entries from Windows builds use "\\". On Linux, path.resolve treats "\\" as a literal, so OpenNext resolves to apps/.../node_modules while we do not — normalize to "/". */
function normalizeNftRel(rel) {
  return rel.replaceAll("\\", "/");
}

/** True if filePath is a strict descendant of dirPath (same path → false). */
function isStrictDescendant(filePath, dirPath) {
  const a = path.resolve(filePath);
  const b = path.resolve(dirPath);
  const rel = path.relative(b, a);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/** Top-level npm folder under `rootNodeModules` (`foo` or `@scope/pkg`), or null if outside it. */
function hoistedRootPkgNameUnder(rootNodeModules, absPath) {
  const resolved = path.resolve(absPath);
  const rootResolved = path.resolve(rootNodeModules);
  const rel = path.relative(rootResolved, resolved);
  if (!rel || rel === "." || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const parts = rel.split(/[/\\]/).filter(Boolean);
  if (!parts.length) return null;
  if (parts[0].startsWith("@")) {
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

const standaloneRoot = path.join(appRoot, ".next", "standalone");
if (!existsSync(standaloneRoot)) {
  console.log("[fix-standalone] skip — no .next/standalone");
  process.exit(0);
}

// OpenNext expects a `.next` directory under the standalone root and expects certain
// files to live there (and under `.next/server`). Next's standalone output can omit
// this tree, so we materialize it by copying the file-level entries from the normal
// `.next` build output.
const appNextDir = path.join(appRoot, ".next");
const standaloneInnerNextDir = path.join(standaloneRoot, ".next");
mkdirSync(standaloneInnerNextDir, { recursive: true });

for (const ent of readdirSync(appNextDir, { withFileTypes: true })) {
  if (!ent.isFile()) continue;
  const from = path.join(appNextDir, ent.name);
  const to = path.join(standaloneInnerNextDir, ent.name);
  stageCopy(from, to);
}

const appNextServerDir = path.join(appNextDir, "server");
const standaloneNextServerDir = path.join(standaloneInnerNextDir, "server");
mkdirSync(standaloneNextServerDir, { recursive: true });
if (existsSync(appNextServerDir)) {
  for (const ent of readdirSync(appNextServerDir, { withFileTypes: true })) {
    if (!ent.isFile()) continue;
    const from = path.join(appNextServerDir, ent.name);
    const to = path.join(standaloneNextServerDir, ent.name);
    stageCopy(from, to);
  }
}

for (const serverDir of ["app", "pages"]) {
  copyDirectoryFiles(
    path.join(appNextServerDir, serverDir),
    path.join(standaloneNextServerDir, serverDir),
  );
}

// OpenNext (in monorepo mode) expects files under `.next/standalone/<workspaceRootName>/...`.
// Next's standalone output may instead be rooted directly at `.next/standalone/...` (apps/, node_modules/, package.json).
// We create the expected nested paths by copying only the specific files OpenNext later tries to copy.
const standaloneExpectedRoot = path.join(standaloneRoot, "personal-os-web");

const NFT_SKIP_DIRS = new Set(["cache", "standalone", "export", "trace"]);
function walkNftFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (NFT_SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkNftFiles(p));
    else if (ent.name.endsWith(".nft.json")) out.push(p);
  }
  return out;
}

const packagePath = path.relative(webRoot, appRoot);
const standaloneNextDir = path.join(standaloneRoot, packagePath, ".next");

const bunStorePrefixes = [
  path.join(webRoot, "node_modules", ".bun") + path.sep,
  path.join(appRoot, "node_modules", ".bun") + path.sep,
];

const appNodeModules = path.join(appRoot, "node_modules");
const nftFiles = walkNftFiles(path.join(appRoot, ".next"));
console.log(`[fix-standalone] ${nftFiles.length} nft manifests; staging traces + hoisted mirror …`);
let openNextTraceStaged = 0;
let bunStoreStaged = 0;
/** Unscoped package names NFTs resolve under the app node_modules (scoped trees mirror wholesale). */
const nftExtraUnscoped = new Set();

for (const nftPath of nftFiles) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(nftPath, "utf8"));
  } catch (e) {
    throw new Error(`[fix-standalone] failed to parse ${nftPath}: ${e}`);
  }
  const files = Array.isArray(parsed?.files) ? parsed.files : [];
  const nftParentDir = path.dirname(nftPath);
  const relFromDotNext = path.relative(appNextDir, nftParentDir);
  const openNextBase = path.join(standaloneNextDir, relFromDotNext);

  for (const rel of files) {
    if (typeof rel !== "string") continue;
    const relPosix = normalizeNftRel(rel);

    // Match OpenNext copyTracedFiles: same `path.resolve(openNextBase, rel)` it uses.
    // Some NFT entries climb out of `.next/standalone/...` with `../` segments and land on
    // real workspace paths (e.g. apps/garden/node_modules/next/...). Hoisted installs only
    // have those files under personal-os-web/node_modules; we must materialize at the exact
    // resolved path or copyTracedFiles hits ENOENT with src === dest.
    const destOpenNext = path.resolve(openNextBase, relPosix);
    for (const candidate of [destOpenNext, path.resolve(nftParentDir, relPosix)]) {
      const rootPkg = hoistedRootPkgNameUnder(appNodeModules, candidate);
      if (!rootPkg || rootPkg.startsWith("@personal-os-web/")) continue;
      if (rootPkg.startsWith("@")) continue;
      nftExtraUnscoped.add(rootPkg);
    }
    if (
      !existsSync(destOpenNext) &&
      isStrictDescendant(destOpenNext, webRoot)
    ) {
      const src =
        resolveTraceSource(path.resolve(nftParentDir, relPosix)) ??
        resolveTraceSource(destOpenNext);
      if (src && stageCopy(src, destOpenNext)) openNextTraceStaged++;
    }

    const absForBun = path.resolve(nftParentDir, relPosix);
    if (!bunStorePrefixes.some((prefix) => absForBun.startsWith(prefix))) continue;
    const relFromWeb = path.relative(webRoot, absForBun);
    const dest = path.join(standaloneExpectedRoot, relFromWeb);
    if (existsSync(dest)) continue;
    if (!existsSync(absForBun)) continue;
    if (stageCopy(absForBun, dest)) bunStoreStaged++;
  }
}

// OpenNext copyTracedFiles resolves NFT paths into apps/<app>/node_modules/... while hoisted
// installs store files in the workspace root node_modules. Copy enough hoisted trees that
// same-path copies exist, without mirroring the entire root node_modules (minutes of silent I/O).
//
// Strategy: mirror every @scope (except @personal-os-web) + unscoped packages from the app,
// next, NFT-derived extras. Skip sharp/caniuse-lite — OpenNext skips those copyTracedFiles rows.
const HOIST_MIRROR_SKIP = new Set([".bun", ".cache"]);

/** OpenNext skips copying these; mirroring them is slow and unnecessary for copyTracedFiles. */
const OPENNEXT_SKIPPED_UNSCOPED = new Set(["sharp", "caniuse-lite"]);

function unscopedHoistMirrorNames(nftExtraUnscoped) {
  const appPkg = JSON.parse(readFileSync(path.join(appRoot, "package.json"), "utf8"));
  const names = new Set();
  for (const k of Object.keys(appPkg.dependencies ?? {})) names.add(k);
  for (const k of Object.keys(appPkg.optionalDependencies ?? {})) names.add(k);
  const nextPkgPath = path.join(webRoot, "node_modules", "next", "package.json");
  if (existsSync(nextPkgPath)) {
    const nextPkg = JSON.parse(readFileSync(nextPkgPath, "utf8"));
    for (const k of Object.keys(nextPkg.dependencies ?? {})) names.add(k);
    for (const k of Object.keys(nextPkg.optionalDependencies ?? {})) names.add(k);
  }
  names.add("client-only");
  names.add("scheduler");
  for (const x of nftExtraUnscoped) names.add(x);
  for (const n of [...names]) {
    if (n.startsWith("@")) names.delete(n);
  }
  for (const n of OPENNEXT_SKIPPED_UNSCOPED) names.delete(n);
  return names;
}

function mirrorHoistedNodeModuleRoots(nftExtraUnscoped) {
  const unscoped = unscopedHoistMirrorNames(nftExtraUnscoped);
  const srcRoot = path.join(webRoot, "node_modules");
  const destRoot = path.join(appRoot, "node_modules");
  if (!existsSync(srcRoot)) return 0;
  let n = 0;
  const t0 = Date.now();
  for (const ent of readdirSync(srcRoot, { withFileTypes: true })) {
    if (HOIST_MIRROR_SKIP.has(ent.name)) continue;
    if (ent.name === "@personal-os-web") continue;
    const src = path.join(srcRoot, ent.name);
    const dest = path.join(destRoot, ent.name);
    if (!existsSync(src)) continue;
    const mirrorScoped = ent.name.startsWith("@");
    const mirrorUnscoped = !mirrorScoped && unscoped.has(ent.name);
    if (!mirrorScoped && !mirrorUnscoped) continue;
    mkdirSync(destRoot, { recursive: true });
    const label = mirrorScoped ? `${ent.name}/*` : ent.name;
    console.log(`[fix-standalone] mirroring hoisted ${label} → app/node_modules …`);
    try {
      cpSync(src, dest, { recursive: true, force: true, dereference: true });
      n++;
    } catch {
      copyDirectoryFiles(src, dest);
      n++;
    }
  }
  console.log(
    `[fix-standalone] hoisted mirror finished in ${((Date.now() - t0) / 1000).toFixed(1)}s (${n} roots)`,
  );
  return n;
}

const depsStaged = mirrorHoistedNodeModuleRoots(nftExtraUnscoped);

const parts = [];
if (openNextTraceStaged) parts.push(`traces ${openNextTraceStaged}`);
if (bunStoreStaged) parts.push(`bun ${bunStoreStaged}`);
if (depsStaged) parts.push(`hoisted-roots ${depsStaged}`);
console.log(parts.length ? `[fix-standalone] ok (${parts.join(", ")})` : "[fix-standalone] ok");
