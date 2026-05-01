# CLAUDE.md — Repo Quick Start (LLM)

## Workspace layout (read first)

This repository is a **Bun + Turborepo** workspace: `apps/web` (Vite admin SPA), `apps/garden` (Next.js public site), and `packages/*` (shared types, portfolio data, UI). **Never import across `apps/web` ↔ `apps/garden`** — share code only via `packages/*`.

## What this repo is

- **Frontend**: React + TypeScript + Vite + Tailwind.
- **App shape**: Public site + `/admin/*` “Personal OS” (auth-gated) with AI-powered, LLM-driven features.
- **Deploy**: AWS S3 + CloudFront (`base: /admin/`) via `**personal-os-web`** repo `.github/workflows/deploy-spa.yml` (canonical); **build-time** Vite env vars from GitHub **Environment** secrets. IaC: `**https://github.com/SunnyChopper/personal-os-infra`** (`envs/<dev|prod>/`). **Monorepo:\*\* `../infrastructure/envs/<dev|prod>/`.

## Open these first (entrypoints)

If you are new to the codebase or debugging app behavior, start here for the fastest context.

- **App bootstrap + providers**: `apps/web/src/main.tsx` (provider tree, `configureAmplify()`, theme init).
- **Routes/layouts**: `apps/web/src/App.tsx` + `apps/web/src/routes.ts` (routing ownership, layouts, `ProtectedRoute`). Admin **Memory Audit** route: `ROUTES.admin.memoryAudit` → `/admin/memory-audit` (`MemoryAuditPage`).
- **HTTP + auth header wiring**: `apps/web/src/lib/api-client.ts` (baseURL, auth header, 401 refresh/redirect, response wrapping).
- **Auth + token lifecycle**: `apps/web/src/lib/auth/auth.service.ts` (Cognito sign-in/out, token storage, refresh, `apiClient` sync).
- **Cognito env usage**: `apps/web/src/lib/aws-config.ts`, `apps/web/src/lib/auth/cognito-config.ts` (env vars + “is configured” logic).
- **Build quirks**: `apps/web/vite.config.ts` (Node polyfills, `async_hooks` polyfill, `base: '/admin/'`).

Quick mapping:

- **Assistant LTM audit UI** (not Knowledge Vault) → `apps/web/src/pages/admin/MemoryAuditPage.tsx`, `apps/web/src/services/ltm.service.ts` (HTTP `/ltm` on the API host). Contract: monorepo `docs/backend/API_ENDPOINTS.md` (LTM audit). Do not call `/assistant/memory/*` for this page.
- **Proactive assistant UI** → `apps/web/src/pages/admin/ProactiveAutomationsPage.tsx`, `ROUTES.admin.assistantProactive` in `apps/web/src/routes.ts` (`/admin/assistant/proactive`); API via `apiClient` proactive + `preferences/time-zone` methods. Ops/architecture: monorepo `docs/backend/PROACTIVE_ASSISTANT.md`.
- Auth/login/redirect issues → `apps/web/src/lib/auth/auth.service.ts`, then `apps/web/src/lib/api-client.ts`
- Routes/layout/rendering issues → `apps/web/src/App.tsx`, then `apps/web/src/routes.ts`
- Backend calls/401/headers → `apps/web/src/lib/api-client.ts`
- Cognito env misconfig → `apps/web/src/lib/aws-config.ts`, `apps/web/src/lib/auth/cognito-config.ts`
- Build/deploy quirks → `apps/web/vite.config.ts`

## API Contracts & DTOs

- Read and follow: `docs/reference/normalization-and-dtos.md`

## API endpoint checklist (frontend)

1. Define/extend types in `apps/web/src/types/api-contracts.ts` and/or `apps/web/src/types/api/*.dto.ts`.
2. Implement service calls in `apps/web/src/services/`\*\* using `apiClient.get/post/patch/delete`.
3. (Optional, dev-only) Pass Zod schemas into `apiClient.get/post` for response validation.
4. Ensure React Query caches store contract-aligned domain models (not raw DTOs with mismatched shapes).

## Commands (source of truth: root `package.json` + `apps/web/package.json`)

When this repo is opened inside the monorepo workspace (sibling `personal-os-backend/`, root `package.json`), prefer workspace-root `**bun run --cwd personal-os-web --filter web type-check**` + `**lint**` (or outer `bun run verify:frontend` from the monorepo root).

- **Dev (web)**: `bun run --filter web dev` (from `personal-os-web/`)
- **Build/preview**: `bun run --filter web build`, `bun run --filter web preview`
- **Quality (workspace)**: `bun run lint`, `bun run type-check`, `bun run format:check`
- **Tests**: `bun run --filter web test` (Vitest), `bun run --filter web test:e2e` (Playwright)
- **Meta**: `bun run --filter web validate` (runs repo validation scripts)

## Local logging

- Frontend dev logs are written to `../logs/frontend/app.jsonl`
- Backend dev logs are in `../logs/backend/app.jsonl` and `../logs/backend/error.jsonl`
- Use the centralized logger in `apps/web/src/lib/logger.ts`; do not add raw `console.*` calls in app code
- Search logs with `rg`; see `../docs/agent-learnings/log-analysis-guide.md`

## Environment variables (canonical)

### Runtime usage in code

- **API base URL**: `VITE_API_BASE_URL` (fallback: hosted dev API when running `vite` in dev; `'/api'` in production builds) via `apps/web/src/lib/vite-public-env.ts` + `apps/web/src/lib/api-client.ts`.
- **Assistant WebSocket URL**: `VITE_WS_URL` (e.g. `wss://...`; dev server defaults to the documented dev-stage URL when unset) in `apps/web/src/hooks/useAssistantStreaming.ts`.
- **AWS Cognito**:
  - `VITE_AWS_REGION` (fallback: `'us-east-1'`)
  - `VITE_AWS_USER_POOL_ID`
  - `VITE_AWS_USER_POOL_WEB_CLIENT_ID`
  - `VITE_AWS_IDENTITY_POOL_ID` (optional)

### Local dev vs deploy

- **Local dev**: use `apps/web/.env` (see `apps/web/.env.example`).
- **Deploy (AWS)**: `.github/workflows/deploy-spa.yml` at monorepo root injects `VITE_*` from the active GitHub **Environment** (`dev` / `prod`) and runs `bun run --cwd personal-os-web --filter web build`.
- **Deploy from your machine** (same S3 paths + invalidation as CI): copy `.env.deploy.example` → `.env.deploy.dev` or `.env.deploy.prod`. From **monorepo root**, dry-run with **`bun run check:infra:frontend:<stage>`** (edge only) or **`bun run check:infra:<stage>`** (edge + API). Apply edge only + refresh deploy env keys: **`bun run deploy:infra:frontend:<stage>`**. Apply API Terraform only: **`bun run deploy:infra:backend:<stage>`**. Apply **both** stacks: **`bun run deploy:infra:<stage>`**. Add `VITE_*` and garden secrets to `.env.deploy.*` as needed. Then **`bun run deploy:frontend:dev`** (Vite + OpenNext), or **`bun run deploy:frontend:personal-os:<stage>`** / **`bun run deploy:frontend:public-garden:<stage>`**. From `personal-os-web/`, the same names are wired via `../scripts/`. OpenNext builds are unreliable on Windows without WSL (symlinks); use Linux, macOS, or WSL for full `deploy:frontend:*` including public garden.

Note: Some older docs mention `VITE_API_URL` / `VITE_COGNITO_*`. For this frontend build, treat `**VITE_API_BASE_URL` + `VITE_AWS_*` as canonical\*\*.

## AI / LLM subsystem (where to look)

- **Adapter (API-only)**: `apps/web/src/lib/llm/llm-config.ts`, `apps/web/src/lib/llm/api-llm-adapter.ts`
- **Main façade used by UI/services**: `apps/web/src/services/llm.service.ts` (delegates to `getLLMAdapter()`).
- **Per-feature provider/model selection** (loaded from backend w/ defaults):
  - `apps/web/src/lib/llm/config/feature-config-store.ts`
  - `apps/web/src/lib/llm/config/feature-types.ts`
- **Provider + model catalog (frontend choices)**:
  - `apps/web/src/lib/llm/config/provider-types.ts`
  - `apps/web/src/lib/llm/config/model-catalog.ts`
- **Backend contract**: `docs/backend/API_ENDPOINTS.md` (AI endpoints + response shape)

Debug heuristic: “AI not working” is usually **(1) auth/token issue**, **(2) backend `/ai/*` endpoint shape or availability**, **(3) feature config fetch/cache**, or **(4) backend LLM configuration**.
Note: `APILLMAdapter` expects `{ success, data: { result, confidence, provider, model, cached } }` from AI endpoints.

## Deploy-time secrets (GitHub Environments)

After `terraform apply` in `**../infrastructure/envs/<dev|prod>/`** (monorepo) or any clone of `**personal-os-infra**`, copy outputs into GitHub **Settings → Environments → secrets** on `**personal-os-web`\*\* for that environment:

- `AWS_DEPLOY_ROLE_ARN`, `SPA_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `GARDEN_ASSETS_BUCKET`, `GARDEN_LAMBDA_NAME`
- `VITE_API_BASE_URL`, `VITE_WS_URL`, `VITE_AWS_REGION`, `VITE_AWS_USER_POOL_ID`, `VITE_AWS_USER_POOL_WEB_CLIENT_ID`, `VITE_AWS_IDENTITY_POOL_ID`
- Public garden (OpenNext / `deploy-garden.yml`): `NEXT_PUBLIC_SITE_URL`, `PUBLIC_GARDEN_DATABASE_URL`, `PUBLIC_GARDEN_USER_ID`, `OPENAI_API_KEY`

**OIDC role ARN** (`AWS_DEPLOY_ROLE_ARN`): `terraform output -raw github_deploy_role_arn` from the **edge** stack (`infrastructure/envs/<stage>`).

**Bootstrap from Terraform (PowerShell)** after `terraform apply`:

```powershell
cd ../infrastructure/envs/<dev|prod>
$repo = "SunnyChopper/personal-os-web"
$stage = "<dev|prod>"
terraform output -raw github_deploy_role_arn | gh secret set AWS_DEPLOY_ROLE_ARN --env $stage --repo $repo
terraform output -raw spa_bucket | gh secret set SPA_BUCKET --env $stage --repo $repo
terraform output -raw cloudfront_distribution_id | gh secret set CLOUDFRONT_DISTRIBUTION_ID --env $stage --repo $repo
terraform output -raw garden_assets_bucket | gh secret set GARDEN_ASSETS_BUCKET --env $stage --repo $repo
terraform output -raw garden_lambda_name | gh secret set GARDEN_LAMBDA_NAME --env $stage --repo $repo
```

`VITE_*` can stay repository-level or be duplicated per environment as you prefer—workflows merge environment + repo secrets.

Optional legacy: `personal-os-web/infrastructure/github-secrets.tf` (Terraform GitHub provider) can still manage `VITE_*` if you use that stack; canonical hosting runbook is `**https://github.com/SunnyChopper/personal-os-infra**` `README.md`.

## Type Alignment: Frontend Should Match Backend

**Critical Rule**: The backend API must return canonical camelCase contracts. If it does not, treat that as a backend bug and fix the backend contract. Do **not** add frontend mapping/normalization layers to compensate.

**Decision Tree**:

1. **Backend response shape differs from contract?** (including snake_case keys) → Fix backend response to contract shape.
2. **Frontend type differs from stable backend contract?** → Update frontend type to match contract.
3. **Need temporary frontend transform?** → No. Avoid this; fix the backend/source contract instead.

**Normalization/mapping policy**: Do not introduce frontend response normalization for backend casing/field mismatches.

**See**: `docs/post-mortems/2026-01-28-success-criteria-field-mismatch.md` for detailed analysis and decision framework.

**Backend snake_case fields**: See `docs/reference/backend-snake-case-fields.md` for backend-side fixes required to enforce camelCase contracts.

## Frontend-specific learnings

- Cross-repo anti-patterns (filter by `[frontend]`): `../docs/agent-learnings/anti-patterns.md`
- After modifying API types, verify alignment with `../docs/backend/API_ENDPOINTS.md`.
- After adding or modifying components, verify applicable `.mdc` rules in `.cursor/rules/` were followed.
- Before declaring done, complete and report the self-assessment protocol from root `../CLAUDE.md`.
- Treat final completion as blocked until the self-assessment is explicitly included in the final response.

## Post-Mortems and Learnings

Detailed post-mortems, decision frameworks, and lessons learned are stored in `docs/post-mortems/`. Each post-mortem is a separate markdown file with date-prefixed naming (e.g., `2026-01-28-issue-name.md`).

**When writing post-mortems**:

- Store in `docs/post-mortems/` folder
- Use descriptive, date-prefixed filenames
- Include full analysis, decision frameworks, affected files, and action items
- Keep `CLAUDE.md` lean with only actionable takeaways
- Add a compact entry to `../docs/agent-learnings/anti-patterns.md` that links back to the full post-mortem
