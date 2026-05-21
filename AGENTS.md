# AGENTS.md — Personal OS Web

## Cursor Cloud specific instructions

### Services

| Service          | Command                    | Port | Notes               |
| ---------------- | -------------------------- | ---- | ------------------- |
| Admin SPA (Vite) | `bun run --filter web dev` | 5173 | Serves at `/admin/` |

### Quick reference

- **Install**: `bun install` (from repo root)
- **Lint**: `bun run lint`
- **Type-check**: `bun run type-check`
- **Dev (web only)**: `bun run --filter web dev`
- **Build**: `bun run build`
- **Test**: `bun run test`

### Caveats

- Bun must be on `$PATH` (`export PATH="$HOME/.bun/bin:$PATH"` or source `~/.bashrc` after install).
- The `.nvmrc` specifies Node 22.12.0 but Bun is the actual package manager (lockfile is `bun.lock`). Node is only needed for TypeScript compilation.
- `apps/web/.env.dev` must exist for the dev server; copy from `apps/web/.env.example`. Without Cognito credentials the login page renders but auth won't complete.
- Lint produces warnings (0 errors, ~169 warnings) which is normal for the current state of the codebase.
- The frontend points to `http://localhost:8000` by default; start the backend first if testing API integration.
- Husky pre-commit runs `bunx lint-staged` (prettier); pre-push runs `bun run type-check`.
