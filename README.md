# CoFeed

A simple, mobile-first bottle feeding and pumping log, installable as a PWA and shareable between caregivers.

## Features

- **Dashboard** — last 24 hours of activity, today's pumping, and weekly feed/pumping charts
- **Feeds & pumping** — log, edit and delete bottles (formula and/or breast milk) and pumping sessions, filtered by day or range
- **Chat logging** — type "4oz formula at 3pm" and Claude turns it into log entries, with undo
- **Households** — share a baby's log with other caregivers
- **Import / export** — import a Nara Baby CSV export, export activity as CSV
- **PWA** — installable, shows cached data instantly on launch and offline

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, TanStack Router, server functions) on Nitro
- Supabase Auth + Postgres via [Drizzle ORM](https://orm.drizzle.team)
- Tailwind CSS + shadcn/ui, Chart.js
- Anthropic Claude for chat logging
- Vitest and Playwright

## Getting started

Requires Node 22+ and a Supabase project.

```bash
npm install
cp .env.example .env   # fill in the values below
npm run db:migrate
npm run dev            # http://localhost:5173
```

### Environment variables

| Variable                                      | Purpose                                                |
| --------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                                | Postgres connection string (Supabase)                  |
| `VITE_SUPABASE_URL`                           | Supabase project URL (client)                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY`               | Supabase publishable/anon key (client)                 |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`           | Server-side overrides; fall back to the `VITE_` values |
| `ANTHROPIC_API_KEY`                           | Claude API key for chat logging                        |
| `SEED_USER_EMAIL`                             | User to attach seed data to (`npm run db:seed`)        |
| `COFEED_SMOKE_EMAIL`, `COFEED_SMOKE_PASSWORD` | Test account for Playwright smoke tests (optional)     |

## Scripts

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start the dev server                              |
| `npm run build`       | Production build to `.output/`                    |
| `npm start`           | Run the production build                          |
| `npm test`            | Unit tests (Vitest)                               |
| `npm run test:smoke`  | Playwright smoke tests (needs smoke credentials)  |
| `npm run lint`        | ESLint                                            |
| `npm run typecheck`   | TypeScript                                        |
| `npm run format`      | Prettier (`format:check` to verify)               |
| `npm run db:generate` | Generate a migration from `src/db/schema.ts`      |
| `npm run db:migrate`  | Apply migrations                                  |
| `npm run db:seed`     | Seed sample data (`db:reset:seed` to reset first) |
| `npm run db:studio`   | Open Drizzle Studio                               |

CI runs `format:check`, `lint`, `typecheck`, `test` and `build` on every push and PR.

## Project structure

```
src/
  routes/       file-based routes (dashboard, feeds, pumping, chat, account, …)
  components/   UI, grouped by feature; ui/ holds shadcn primitives
  contexts/     per-screen state providers
  hooks/        data and screen hooks
  server/       server functions, one file per entity
  lib/          pure helpers with unit tests
  db/           Drizzle schema, client, seeds and scripts
drizzle/        SQL migrations
public/         manifest, icons, service worker
tests/smoke/    Playwright tests
```

See [CLAUDE.md](CLAUDE.md) for coding conventions.
