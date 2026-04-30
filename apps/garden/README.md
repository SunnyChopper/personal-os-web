# Public site (Next.js / OpenNext)

Portfolio homepage (aligned with `personal-os-web` marketing sections) plus the read-only **Garden** hub (`/garden`) backed by Postgres `public_garden`.

**Env:** `PUBLIC_GARDEN_DATABASE_URL`, `PUBLIC_GARDEN_USER_ID`, `NEXT_PUBLIC_SITE_URL`, `OPENAI_API_KEY`.

- From `personal-os-web/` workspace root: `bun run --filter garden dev` — port 3040
- `bun run --filter garden build` / `bun run --filter garden build:opennext`
- Hosting: [personal-os-infra](https://github.com/SunnyChopper/personal-os-infra), monorepo `.github/workflows/deploy-garden.yml`

**Routes:** `/` portfolio, `/garden` proof-of-work + Ask AI, `/stack`, `/artifacts`, `/collider`, `/products`, changelog and garden notes under `/changelog/*` and `/garden/*`.

**Assets:** Static images live in `public/images/` (e.g. `cover.jpg`, project GIFs). `QuicketSolutions.gif` is a placeholder copy until a project-specific asset is added.
