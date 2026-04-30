import {
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  statSync,
  lstatSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, "..");
const webRoot = path.join(appRoot, "..", ".."); // personal-os-web

function newestMatchingDir(parent, prefix) {
  if (!existsSync(parent)) return null;
  const entries = readdirSync(parent, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith(prefix))
    .map((d) => d.name);
  if (entries.length === 0) return null;
  // Prefer deterministic sort; these include hashes so "newest" is meaningless.
  entries.sort((a, b) => a.localeCompare(b));
  return entries[entries.length - 1];
}

function ensureFileCopied(from, to) {
  if (!existsSync(from)) {
    throw new Error(`[fix-standalone] missing source file: ${from}`);
  }
  if (existsSync(to)) return;
  // Some traced paths can be directories (or symlinks to directories). In that case,
  // create the directory and move on — OpenNext only needs the directory to exist
  // so subsequent file copies can succeed.
  let st;
  try {
    st = lstatSync(from);
  } catch {
    st = null;
  }
  if (st && (st.isDirectory() || (st.isSymbolicLink() && statSync(from).isDirectory()))) {
    mkdirSync(to, { recursive: true });
    console.log(`[fix-standalone] mkdir ${path.relative(appRoot, to)}`);
    return;
  }
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
  const s = statSync(to);
  if (!s.isFile()) {
    throw new Error(`[fix-standalone] failed to copy to: ${to}`);
  }
  console.log(`[fix-standalone] copied ${path.relative(appRoot, to)}`);
}

function copyDirectoryFiles(fromDir, toDir) {
  if (!existsSync(fromDir)) return 0;

  let copiedCount = 0;
  mkdirSync(toDir, { recursive: true });
  for (const ent of readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, ent.name);
    const to = path.join(toDir, ent.name);
    if (ent.isDirectory()) {
      copiedCount += copyDirectoryFiles(from, to);
      continue;
    }

    const alreadyExists = existsSync(to);
    ensureFileCopied(from, to);
    if (!alreadyExists && existsSync(to)) copiedCount++;
  }

  return copiedCount;
}

const standaloneRoot = path.join(appRoot, ".next", "standalone");
if (!existsSync(standaloneRoot)) {
  console.log(`[fix-standalone] no standalone output found at ${standaloneRoot}`);
  process.exit(0);
}

// OpenNext expects a `.next` directory under the standalone root and expects certain
// files to live there (and under `.next/server`). Next's standalone output can omit
// this tree, so we materialize it by copying the file-level entries from the normal
// `.next` build output.
const appNextDir = path.join(appRoot, ".next");
const standaloneInnerNextDir = path.join(standaloneRoot, ".next");
mkdirSync(standaloneInnerNextDir, { recursive: true });

// Copy file entries from `.next/*` → `.next/standalone/.next/*`
for (const ent of readdirSync(appNextDir, { withFileTypes: true })) {
  if (!ent.isFile()) continue;
  const from = path.join(appNextDir, ent.name);
  const to = path.join(standaloneInnerNextDir, ent.name);
  ensureFileCopied(from, to);
}

// Copy file entries from `.next/server/*` → `.next/standalone/.next/server/*`
const appNextServerDir = path.join(appNextDir, "server");
const standaloneNextServerDir = path.join(standaloneInnerNextDir, "server");
mkdirSync(standaloneNextServerDir, { recursive: true });
if (existsSync(appNextServerDir)) {
  for (const ent of readdirSync(appNextServerDir, { withFileTypes: true })) {
    if (!ent.isFile()) continue;
    const from = path.join(appNextServerDir, ent.name);
    const to = path.join(standaloneNextServerDir, ent.name);
    ensureFileCopied(from, to);
  }
}

// Next's standalone output can omit directory-level app router artifacts even when
// `.next/server/app-paths-manifest.json` points at them. OpenNext packages from
// standalone, so missing files here become generic 500s in Lambda for every page.
for (const serverDir of ["app", "pages"]) {
  const copiedServerFiles = copyDirectoryFiles(
    path.join(appNextServerDir, serverDir),
    path.join(standaloneNextServerDir, serverDir),
  );
  if (copiedServerFiles > 0) {
    console.log(`[fix-standalone] copied .next/server/${serverDir}/ (${copiedServerFiles} files)`);
  }
}

// OpenNext (in monorepo mode) expects files under `.next/standalone/<workspaceRootName>/...`.
// Next's standalone output may instead be rooted directly at `.next/standalone/...` (apps/, node_modules/, package.json).
// We create the expected nested paths by copying only the specific files OpenNext later tries to copy.
const standaloneExpectedRoot = path.join(standaloneRoot, "personal-os-web");

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const nftFiles = walk(path.join(appRoot, ".next", "server")).filter((p) => p.endsWith(".nft.json"));
if (nftFiles.length === 0) {
  console.log(`[fix-standalone] no .nft.json files found; skipping`);
  process.exit(0);
}

const bunStoreRoot = path.join(webRoot, "node_modules", ".bun") + path.sep;
let copied = 0;

for (const nftPath of nftFiles) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(nftPath, "utf8"));
  } catch (e) {
    throw new Error(`[fix-standalone] failed to parse ${nftPath}: ${e}`);
  }
  const files = Array.isArray(parsed?.files) ? parsed.files : [];
  for (const rel of files) {
    if (typeof rel !== "string") continue;
    const abs = path.resolve(path.dirname(nftPath), rel);
    if (!abs.startsWith(bunStoreRoot)) continue; // only patch Bun store deps
    const relFromWeb = path.relative(webRoot, abs);
    const dest = path.join(standaloneExpectedRoot, relFromWeb);
    if (existsSync(dest)) continue;
    // Only copy files (not directories). If source doesn't exist, that's a different kind of trace issue.
    if (!existsSync(abs)) continue;
    ensureFileCopied(abs, dest);
    copied++;
  }
}

if (copied === 0) {
  console.log(`[fix-standalone] nothing to copy (standalone already contains traced .bun files)`);
}
