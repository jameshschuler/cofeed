# CoFeed Implementation TODOs

A practical execution checklist for building the app from the current codebase state.

## 0) Project Setup and Tooling

- [x] Create `package.json`
- [x] Add runtime deps: `@tanstack/start`, `@tanstack/react-router`, `@tanstack/react-query`, `drizzle-orm`, `postgres`, `zod`, `@supabase/supabase-js`
- [x] Add dev deps: `typescript`, `vitest`, `@types/node`, `drizzle-kit`, `tsx`, `eslint`, `prettier`
- [x] Create `tsconfig.json` and verify path aliases
- [x] Add `.env.example` with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
- [x] Add scripts: `dev`, `build`, `test`, `test:watch`, `db:generate`, `db:migrate`, `db:studio`, `lint`

## 1) Database and Migrations

- [x] Create `drizzle.config.ts`
- [x] Generate initial migration from `src/server/db/schema.ts`
- [x] Apply migration to local Postgres/Supabase
- [x] Add `src/server/db/rls/policies.sql` with household-scoped RLS policies
- [x] Add seed script `src/server/db/seeds/dev-seed.ts` for demo household, baby, and sample logs
- [x] Add FK bridge from `cofeed` user fields to `auth.users(id)`
- [x] Verify `feed_logs.idempotency_key` is `UNIQUE`

## 2) Auth and Request Context

- [ ] Implement `src/server/api/middleware/auth.ts` (Supabase JWT verification)
- [ ] Implement `src/server/api/middleware/rls-context.ts` (set request user context for DB)
- [ ] Implement `src/server/api/middleware/idempotency.ts` (read/write idempotency key behavior)
- [ ] Standardize `context.userId` typing (remove `as any` casts in handlers)
- [ ] Add integration tests for unauthenticated/forbidden scenarios

### API foundation

- [x] Add Zod request/response contracts for feed APIs
- [x] Add Drizzle feed repository and service boundary
- [x] Add transport-neutral feed API handlers for future HTTP/server functions
- [ ] Add HTTP transport adapter and bearer-token verification

## 3) Backend Vertical Slice (MVP Path)

- [ ] Confirm household endpoints behavior:
- [ ] create household (owner membership auto-created)
- [ ] invite member (owner-only)
- [ ] join household via invite token
- [ ] Confirm baby endpoint behavior:
- [ ] create baby with initial weight (US or metric)
- [ ] initial daily goal auto-created
- [ ] Confirm feed endpoint behavior:
- [ ] create feed + diaper in one transaction
- [ ] duplicate idempotency key returns conflict
- [ ] update feed within 15-minute edit window only
- [ ] Confirm stats endpoint behavior:
- [ ] day summary for selected date
- [ ] week summary for selected week start
- [ ] Add consistent API error envelope and map `AppError` to transport response

## 4) Contracts and API Consistency

- [ ] Finalize all request schemas in `src/server/contracts.ts`
- [ ] Add response schemas for each endpoint (not just inferred shapes)
- [ ] Ensure date/time format consistency (`YYYY-MM-DD`, ISO timestamps)
- [ ] Add versioning strategy notes for `/v1` contract stability
- [ ] Document endpoint examples in a lightweight API doc

## 5) Backend Test Coverage

- [ ] Keep existing formula tests (`goals.test.ts`) passing
- [ ] Keep existing contract tests (`contracts.test.ts`) passing
- [ ] Add integration test: create household -> create baby -> create feed+diaper -> get day summary
- [ ] Add integration test: create feed fails atomically if diaper insert fails
- [ ] Add integration test: invite acceptance handles expired and reused tokens
- [ ] Add integration test: role permissions (owner/caregiver/viewer)
- [ ] Add integration test: 15-minute edit window enforcement
- [ ] Add integration test: day boundary/timezone correctness

## 6) Frontend App Shell (TanStack Start)

- [ ] Scaffold routes/layouts for:
- [ ] onboarding
- [ ] today dashboard
- [ ] feed log entry
- [ ] history
- [ ] settings
- [ ] Create shared app shell (header, baby switcher, bottom nav)
- [ ] Wire TanStack Query provider + query client defaults
- [ ] Build reusable form primitives for feed, diaper, weight, invites

## 7) Onboarding Flow (5 Steps)

- [ ] Step 1: household setup (name + timezone)
- [ ] Step 2: invite partner/caregiver (optional)
- [ ] Step 3: baby profile
- [ ] Step 4: initial weight + growth rate
- [ ] Step 5: goal review and confirm
- [ ] Persist progress and allow resume if interrupted

## 8) Feed Logging UX

- [x] Quick add bottle with formula and breast milk amounts
- [x] Create, edit, and delete bottle logs
- [ ] Validate input ranges client-side before submit
- [ ] Optimistic UI update with rollback on conflict/error

## 9) Dashboard and Stats UX

- [ ] Today card: total intake vs goal (oz/ml + progress %)
- [ ] Counts: wet, poopy, spit-up
- [ ] Mood distribution visualization
- [ ] 7-day trend section with simple chart/table
- [ ] Empty states for new households with no logs

## 10) PWA and Offline Support

- [ ] Register service worker
- [ ] Add install prompt behavior for iOS/Android/desktop
- [ ] Implement offline write queue with retry policy
- [ ] Queue writes with per-action UUID idempotency keys
- [ ] Sync queue on reconnect and mark failed items explicitly
- [ ] Add conflict handling UX for out-of-window edits

## 11) Observability and Reliability

- [ ] Add structured server logging (request id, user id, household id)
- [ ] Add basic error monitoring hooks
- [ ] Add rate limiting on write endpoints
- [ ] Add performance checks for day and week summary queries
- [ ] Add DB indexes for common filters/sorts

## 12) Security and Privacy

- [ ] Verify all endpoints enforce household membership
- [ ] Verify owner-only invite actions
- [ ] Confirm no cross-household data leakage in queries
- [ ] Add retention/deletion strategy for export and account closure
- [ ] Add audit-friendly fields for edits and server receive time

## 13) Release Readiness

- [ ] Seed staging environment and run end-to-end happy path
- [ ] Add smoke tests for core routes
- [ ] Prepare launch checklist and rollback plan
- [ ] Validate mobile web behavior on iOS Safari + Android Chrome
- [ ] Tag `v0.1.0` after MVP acceptance

## MVP Exit Criteria

- [x] A signed-in parent receives a default household and baby
- [x] A parent can log, edit, and delete a bottle with formula and breast milk amounts
- [ ] The app shows an accurate daily bottle total
- [ ] Offline actions sync safely with idempotency and visible failures
