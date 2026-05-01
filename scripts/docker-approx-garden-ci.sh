#!/usr/bin/env bash
# Approximate GitHub Actions "deploy-garden" Build OpenNext step (Ubuntu + Bun hoisted).
# Copies the repo to /tmp so bind-mounted host node_modules/.next (e.g. Windows + fix-standalone
# mirrors) does not poison Linux resolution — otherwise Next can load two React copies and fail
# prerender with ReactSharedInternals / useContext errors before OpenNext runs.
#
# Usage (from Windows / macOS, Docker Desktop):
#   docker run --rm \
#     -e NEXT_PUBLIC_SITE_URL=http://localhost \
#     -e PUBLIC_GARDEN_DATABASE_URL=postgres://u:p@localhost:5432/db \
#     -e PUBLIC_GARDEN_USER_ID=test-user \
#     -e OPENAI_API_KEY=sk-test-placeholder \
#     -v "/path/to/personal-os:/host" \
#     ubuntu:24.04 bash /host/personal-os-web/scripts/docker-approx-garden-ci.sh
set -eo pipefail

say() {
  printf '\n>>> [%s] %s\n' "$(date -u +'%H:%M:%S')" "$*"
}

export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost}"
export PUBLIC_GARDEN_DATABASE_URL="${PUBLIC_GARDEN_DATABASE_URL:-postgres://u:p@localhost:5432/db}"
export PUBLIC_GARDEN_USER_ID="${PUBLIC_GARDEN_USER_ID:-test-user}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-test-placeholder}"

say "apt install (curl, git, rsync, …)"
apt-get update -qq
apt-get install -y -qq curl unzip ca-certificates git rsync

say "install Bun"
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

HOST_MOUNT="${HOST_MOUNT:-/host}"
WORK="/tmp/personal-os-clean"
say "clean workspace $WORK"
rm -rf "$WORK"
mkdir -p "$WORK"
say "rsync $HOST_MOUNT -> $WORK (excludes node_modules, .next; can be slow on Docker Desktop + bind mounts — not stuck)"
rsync -a --info=progress2 \
  --exclude node_modules \
  --exclude '**/node_modules' \
  --exclude .next \
  --exclude '**/.next' \
  --exclude .open-next \
  --exclude dist \
  --exclude .turbo \
  "$HOST_MOUNT/" "$WORK/"
say "rsync finished"

ROOT="$WORK/personal-os-web"
cd "$ROOT"

say "bun install --frozen-lockfile --linker hoisted"
bun --version
bun install --frozen-lockfile --linker hoisted

say "garden build:opennext"
bun run --filter garden build:opennext

say "done"
