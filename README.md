# personal-os-web (Bun + Turborepo)

Monorepo for the **Vite admin SPA** (`apps/web`, served at `/admin/`\*) and the **Next.js public “garden” site** (`apps/garden`, OpenNext on `/`), plus shared `**packages/`\*\*\*.

## Requirements

- Node.js `>=20.19.0 || >=22.12.0`
- [Bun](https://bun.sh) 1.2+ ([install](https://bun.sh/docs/installation))

## Commands (run from this directory)

| Goal                     | Command                                                                                                                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install                  | `bun install`                                                                                                                                                                                                                                       |
| Dev (all)                | `bun dev`                                                                                                                                                                                                                                           |
| Dev — web only           | `bun run --filter web dev`                                                                                                                                                                                                                          |
| Dev — garden only        | `bun run --filter garden dev`                                                                                                                                                                                                                       |
| Build all                | `bun run build`                                                                                                                                                                                                                                     |
| Deploy to AWS (edge)     | Monorepo root: `bun run check:infra:dev` (plan) → `bun run deploy:infra:dev` (edge + API Terraform) → `bun run deploy:frontend:dev`. Granular: `deploy:infra:frontend:*`, `deploy:infra:backend:*`. See `.env.deploy.example` and root `CLAUDE.md`. |
| Lint / type-check / test | `bun run lint`, `bun run type-check`, `bun run test`                                                                                                                                                                                                |

**Windows (Next.js + OpenNext):** `bun run --filter garden build` or `bun run --filter garden build:opennext:verify` can fail with `EPERM` / `ENOENT` on standalone symlinks (Developer Mode, antivirus) or in OpenNext’s copy step. Use **WSL** or rely on **CI** (`ubuntu-latest`) for a full public-garden bundle; Linux and macOS are unaffected.

## Layout

- `apps/web` — Personal OS + portfolio UI (Vite, React Router, `base: /admin/`).
- `apps/garden` — Public Next.js app (portfolio + garden routes, API routes, Postgres-backed features).
- `packages/portfolio-types` — Shared DTOs (`Skill`, `Project`, `BlogPost`, …).
- `packages/portfolio-data` — Shared static `blogPosts`, `projects`, `skills`.
- `packages/ui` — Shared `BlogCard` / `SkillCard` (React 19 + Framer Motion).
- `packages/eslint-config` — Custom ESLint rules (`rules/custom-rules.cjs`), consumed by `apps/web`.

**Boundaries:** do not import `apps/web` from `apps/garden` or vice versa. Cross-app sharing goes through `packages/`\* only.

## Docs

- **Admin / Personal OS (detailed):** [apps/web/README.md](apps/web/README.md)
- **Public garden (Next.js):** [apps/garden/README.md](apps/garden/README.md)
- **Agent / implementation rules:** [CLAUDE.md](CLAUDE.md)

## Monorepo integration

When this folder lives inside the outer `personal-os` workspace, root scripts use `bun run --cwd personal-os-web …` — see `../package.json` and `../CLAUDE.md`.
