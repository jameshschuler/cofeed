# TODO

## Next up

- [ ] **Chat safeguards against abuse**
  - Per-user rate limit in Postgres (e.g. 20/min, daily cap)
  - Cap the number of entries a single message can log
  - Log token usage per user to monitor cost

## Ideas

- [ ] **Chat-only mode / full-screen chat as default page**
  - Preference stored alongside `displayVolumeUnit`
  - Redirect to `/chat` after login when enabled
  - Full-screen layout variant for the chat route

- [ ] **Let chat query more data**
  - Read-only Claude tools (e.g. `list_feeds(range)`, `get_stats(range)`) backed by existing server queries, scoped to accessible babies
  - Route messages between "log an activity" and "answer a question"
  - Stream responses
  - Depends on chat safeguards

- [ ] **Tasted foods tracker**
  - Track which foods baby has tried: food, first tried date, reaction, notes
  - New table + server fns + route + context, following the pumping pattern
  - Food icons: check `lucide-react` coverage first; fall back to an Iconify set (`fluent-emoji` / `noto`)
