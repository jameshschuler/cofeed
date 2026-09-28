# Repository Instructions

## Coding Style

- Write concise, production-ready TypeScript/JavaScript, React, and backend code.
- **Zero comments** unless logic is genuinely non-obvious or complex. Avoid self-documenting comments entirely.
- Keep components and functions modular and minimal.
- Always use braces for `if` statements, even single-line bodies. Write `if (existing) { return existing; }` (on separate lines), never `if (existing) return existing;`.

## Component & Code Design

- **Pure helpers live in `src/lib/`, not in components.** Formatting, unit conversion, date/day math, grouping and similar logic that doesn't need React state belongs in a lib module (e.g. `src/lib/activity-format.ts`, `src/lib/timezone.ts`, `src/lib/volume.ts`) with unit tests. Only define a function inside a component when it closes over that component's state or props.
- **Never duplicate a helper or constant.** Before writing one, search `src/lib/` and reuse or extend what's there. Constants like `ML_PER_OZ` come from `src/lib/volume.ts`; never retype magic numbers such as `29.5735`.
- **Pass values, not formatters.** Lib helpers take what they need as arguments (e.g. `formatVolume(ml, displayUnit)`); don't pass formatting functions down as props.
- **Use context instead of prop drilling.** When a screen shares state and actions across components (or a component needs more than ~5 state/action props), expose them through a context in `src/components/*-context.tsx` — a `XProvider` plus `useXContext()` hook, following `feeds-context.tsx` and `household-context.tsx`. Routes wrap their layout in the provider; components read from the hook and take no state/action props.
- **Props are fine for small, reusable presentational components** (layout primitives, `ui/` components, charts) whose inputs genuinely vary per use — keep them to a handful.
- **Type the domain at the source.** Give DB columns precise types (e.g. `$type<ActivitySource>()` in `src/db/schema.ts`) so server results match client types without casts.
- **Keep checks green.** `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` must all pass (CI runs them).

## Response Guidelines

- No conversational filler, preambles, or post-explanations when writing or editing code.
- Output clean code blocks directly.
