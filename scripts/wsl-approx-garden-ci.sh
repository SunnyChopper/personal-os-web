#!/usr/bin/env bash
# Run from WSL2: bash scripts/wsl-approx-garden-ci.sh
# Copies monorepo to ~/personal-os-wsl-ci (ext4) so bun install is not mixed with Windows node_modules.
set -euo pipefail

export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost}"
export PUBLIC_GARDEN_DATABASE_URL="${PUBLIC_GARDEN_DATABASE_URL:-postgres://u:p@localhost:5432/db}"
export PUBLIC_GARDEN_USER_ID="${PUBLIC_GARDEN_USER_ID:-test-user}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-test-placeholder}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# personal-os-web/scripts -> monorepo root is ../..
MONO="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEST="${WSL_CI_DEST:-$HOME/personal-os-wsl-ci}"

echo ">>> rsync $MONO -> $DEST (source only; see excludes)"
rm -rf "$DEST"
mkdir -p "$DEST"
# Most of the ~9GB surprise was copying .git, Python venvs, caches, and similar — not app source.
rsync -a --info=progress2 \
  --exclude node_modules \
  --exclude .next \
  --exclude .open-next \
  --exclude dist \
  --exclude .turbo \
  --exclude .git \
  --exclude logs \
  --exclude coverage \
  --exclude .pytest_cache \
  --exclude __pycache__ \
  --exclude .venv \
  --exclude venv \
  --exclude .terraform \
  --exclude '*.tsbuildinfo' \
  "$MONO/" "$DEST/"

ROOT="$DEST/personal-os-web"
cd "$ROOT"

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

echo ">>> bun install --frozen-lockfile --linker hoisted"
bun --version
bun install --frozen-lockfile --linker hoisted

echo ">>> bun run --filter garden build:opennext"
bun run --filter garden build:opennext

echo ">>> done"
