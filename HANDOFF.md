# ruflo_UI — Session Handoff Log

Append a new entry at the top after every session. Never delete old entries.

---

## Session — 2026-03-05 | Phase 2, Prompts 2.1–2.3 (≈ 90 min)

### Prompts Completed
- **Prompt 2.1** — DB Reader & Schema Introspection ✅
- **Type corrections** — `ui/types/ruflo.ts` aligned to real schema ✅ (between 2.1 and 2.2)
- **Prompt 2.2** — API Server with Live Push ✅
- **Prompt 2.3** — Client Hooks ✅
- **`[CHECKPOINT]`** — `git commit 755a43cd0` "feat: prompt 2.1 - db reader and schema introspection" ✅
- **`[CHECKPOINT]`** — `git commit b9fde7392` "feat: prompts 2.2 + 2.3 - API server, live push, client hooks" ✅

### What Was Done
Phase 2 scaffolded in one session. Created `ui/server/` (was the open blocker from Phase 1). Ran schema introspection, discovered real DB layout, corrected types. Built full Express + socket.io API server. Built all 6 client hooks. Wired `RufloSocket` + `DbStatusBanner` into root layout. Verified both servers start clean and `/health` responds live.
## Session — 2026-03-05 | Phase 1, Prompts 1.1–1.3 (≈ 60 min)

### Prompts Completed
- **Prompt 1.1** — Create the UI Subdirectory ✅
- **Prompt 1.2** — Design System Components ✅
- **Prompt 1.3** — Types from the Real Ruflo Schema + Zustand Stores ✅
- **`[CHECKPOINT]`** — `git commit c129c4ce` "feat: ui scaffold, design system, ruflo types" ✅

### What Was Done
Full Phase 1 scaffold completed in one session. The `ui/` directory was created from scratch; no existing Ruflo files were modified. Ends with a clean `npx next build` and a committed checkpoint.

### Files Created
| File | Notes |
|------|-------|
| `ui/server/db.ts` | Read-only SQLite reader. 10 exported query functions. Startup schema introspection. Graceful missing-db handling. |
| `ui/server/api.ts` | Express + socket.io on port 3001. 13 endpoints. chokidar live push. Detached child-process spawn for ruflo commands. |
| `ui/hooks/useRufloSocket.ts` | Connects to :3001 socket.io. `db:change` → refetch store. `db:stale` → `'stale'`. Disconnect → `'disconnected'`. Initial fetch on mount. |
| `ui/hooks/useSwarms.ts` | Reads swarms from store + exposes `refetch()`. |
| `ui/hooks/useSwarm.ts` | swarmId → `{ swarm, agents, runningAgents, completionPercent, runDuration }`. |
| `ui/hooks/useAgentTasks.ts` | agentId → tasks. Polls every 2s while `agent.status === 'running'`. |
| `ui/hooks/useMemorySearch.ts` | query → 300ms debounce → `/memory/search` → `{ results, loading }`. |
| `ui/hooks/useDaemon.ts` | Polls `/daemon/status` every 10s. `start`, `stop`, `restart` (stop→1s→start). |
| `ui/components/ruflo/RufloSocket.tsx` | `"use client"` wrapper: mounts `useRufloSocket`, renders `DbStatusBanner` from store. |
| `ui/` | Next.js 16.1.6 App Router, React 19, Tailwind v4, shadcn/ui |
| `ui/app/layout.tsx` | Inter + JetBrains Mono via `next/font/google`; `<html className="dark">` |
| `ui/app/globals.css` | Tailwind v4 `@theme inline` with custom brand colors; `@config` wires in `tailwind.config.ts` |
| `ui/tailwind.config.ts` | Colors: agent (#3b82f6), orchestrator (#a855f7), danger (#ef4444), success (#22c55e); fontFamily extended |
| `ui/tsconfig.server.json` | CommonJS compile target for `server/` — `noEmit: false`, `outDir: .server-dist` |
| `ui/.env.local` | `RUFLO_DB_PATH`, `RUFLO_PROJECT_PATH`, `NEXT_PUBLIC_API_URL` |
| `ui/package.json` | Scripts: dev (concurrently), server, build, start, test, test:ui |
| `ui/lib/utils.ts` | `cn()` via clsx + tailwind-merge (auto from shadcn init) |
| `ui/components.json` | shadcn config (auto from shadcn init) |
| `ui/components/ruflo/MonoText.tsx` | RSC. Mono span, passes `className` via `cn()` |
| `ui/components/ruflo/StatusBadge.tsx` | RSC. Pill + pulsing dot; typed status→color record |
| `ui/components/ruflo/AgentAvatar.tsx` | RSC. 8-color deterministic hash from `role`; 2-char initials; `title={agentId}` |
| `ui/components/ruflo/Panel.tsx` | RSC. Slate-900 card with optional bordered title header |
| `ui/components/ruflo/EmptyState.tsx` | `"use client"`. Icon/title/desc/action; action button conditional on prop |
| `ui/components/ruflo/DbStatusBanner.tsx` | RSC. `null` when `connected`; red/amber banner for `disconnected`/`stale` |
| `ui/components/ruflo/index.ts` | Barrel re-export of all 6 components |
| `ui/types/ruflo.ts` | AgentStatus, SwarmStatus, SwarmTopology, RufloAgent, RufloSwarm, RufloMemoryEntry, RufloTask, RufloPattern, DbChangeEvent |
| `ui/store/rufloStore.ts` | Zustand v5; swarms, agents, activeSwarmId, selectedAgentId, dbStatus (init: `"disconnected"`), lastDbUpdate |
| `ui/store/uiStore.ts` | Zustand v5; sidebarOpen (init: `true`), selectedView (init: `"canvas"`), toggleSidebar() |

### Files Modified
| File | Change |
|------|--------|
| `ui/server/api.ts` | Replaced Prompt 2.1 stub with full server |
| `ui/types/ruflo.ts` | Fixed `RufloMemoryEntry` (content, ownerId, no swarmId, string embedding). Expanded `RufloPattern` (7 real columns). Added `RufloTrajectory` + `RufloSession`. Kept `RufloSwarm`/`Agent`/`Task` as socket.io stubs. |
| `ui/tsconfig.server.json` | Added `"moduleResolution": "node"` — fixed ts-node blocker |
| `ui/app/globals.css` | `--font-sans: var(--font-geist-sans)` → `var(--font-inter)` |
| `ui/app/layout.tsx` | Added `<RufloSocket />` above `{children}` |
| `ui/components/ruflo/index.ts` | Added `RufloSocket` export |
| `ui/package.json` | Added `express`, `@types/express` (were missing; api.ts requires them) |

### Real DB Schema (from `npm run server`)
```
[ruflo-db] memory_entries: id, key, namespace, content, type, embedding, embedding_model, embedding_dimensions, tags, metadata, owner_id, created_at, updated_at, expires_at, last_accessed_at, access_count, status
[ruflo-db] patterns: id, name, pattern_type, condition, action, description, confidence, success_count, failure_count, decay_rate, half_life_days, embedding, embedding_dimensions, version, parent_id, tags, metadata, source, created_at, updated_at, last_matched_at, last_success_at, last_failure_at, status
[ruflo-db] pattern_history: id, pattern_id, version, confidence, success_count, failure_count, condition, action, change_type, change_reason, created_at
[ruflo-db] sqlite_sequence: name, seq
[ruflo-db] trajectories: id, session_id, status, verdict, task, context, total_steps, total_reward, started_at, ended_at, extracted_pattern_id
[ruflo-db] trajectory_steps: id, trajectory_id, step_number, action, observation, reward, metadata, created_at
[ruflo-db] migration_state: id, migration_type, status, total_items, processed_items, failed_items, skipped_items, current_batch, last_processed_id, source_path, source_type, destination_path, backup_path, backup_created_at, last_error, errors, started_at, completed_at, created_at, updated_at
[ruflo-db] sessions: id, state, status, project_path, branch, tasks_completed, patterns_learned, created_at, updated_at, expires_at
[ruflo-db] vector_indexes: id, name, dimensions, metric, hnsw_m, hnsw_ef_construction, hnsw_ef_search, quantization_type, quantization_bits, total_vectors, last_rebuild_at, created_at, updated_at
[ruflo-db] metadata: key, value, updated_at
```

**No `swarms`, `agents`, or `tasks` tables exist.** `.swarm/memory.db` is Ruflo's memory/learning store. Swarm state arrives at runtime via socket.io from the API process when `npx ruflo hive-mind spawn` runs.

### Deviations from Prompts (with reasons)
1. **`express` not in original deps** — Prompt 2.2 requires it but it wasn't installed. Added `express` + `@types/express` via `npm install`. No functional change.
2. **`ui/server/api.ts` was a stub in 2.1** — Prompt 2.1 only specifies `db.ts`; a stub `api.ts` was needed as the ts-node entry point. It was fully replaced in 2.2.
3. **Type corrections done between 2.1 and 2.2** — Schema introspection from 2.1 revealed column mismatches. Fixed before 2.2 so query functions return properly typed data.
4. **`POST /swarms/:id/stop` is a no-op** — Ruflo CLI doesn't expose a stop-swarm-by-id command. Returns `{ stopped: true, id }` as a placeholder for when the API supports it.

### Bugs Hit & Resolved
1. **ts-node blocker (Phase 1 open issue)** — Root cause: `tsconfig.json` has `"moduleResolution": "bundler"` (Next.js default), incompatible with `tsconfig.server.json`'s `"module": "commonjs"`. Fix: added `"moduleResolution": "node"` to `tsconfig.server.json`. ✅ Resolved.
2. **`--font-sans: var(--font-geist-sans)` in globals.css** — Geist was never loaded; silent fallback to system font. Fix: updated to `var(--font-inter)`. ✅ Resolved.
3. **DB schema mismatch in types** — `RufloMemoryEntry.value` (real: `content`), `agentId` (real: `owner_id`), `embedding: Buffer` (real: `TEXT`). Fixed across `types/ruflo.ts` and `server/db.ts`. ✅ Resolved.

### Blockers / Open Questions for Next Session
1. **Next.js workspace root warning** — Multiple `package-lock.json` files detected; Next.js warns but doesn't fail. Fix if noisy: set `turbopack.root` in `next.config.ts`.
2. **`useDaemon` uptime regex** — Parses `uptime: Ns` from ruflo output. If ruflo's format differs, `uptime` will be `null`. Adjust regex when tested against live daemon.
3. **`POST /swarms/:id/stop`** — Placeholder; ruflo has no stop-by-id command yet.
4. **`RufloSwarm`, `RufloAgent`, `RufloTask`** — Stub types only. Real swarm/agent data not yet persisted in memory.db. Will need real-time socket events from api.ts to populate these.
5. **Playwright not installed** — `npm run test` still fails. Install when test prompts begin.

### Next Prompt
Phase 2 continues — likely canvas/flow visualization (ReactFlow swarm graph), sidebar navigation, or the page-level components that consume the hooks.

---

## Session — 2026-03-05 | Phase 2, Prompt 2.1 (≈ 30 min)

### Prompts Completed
- **Prompt 2.1** — DB Reader & Schema Introspection ✅

### What Was Done
Created `ui/server/` (was missing, causing `npm run dev` errors). Created `ui/server/db.ts` (read-only SQLite reader with startup schema introspection) and a minimal `ui/server/api.ts` stub as entry point. Fixed `tsconfig.server.json` to add `moduleResolution: "node"` (root cause of the ts-node blocker). Fixed stale `--font-sans: var(--font-geist-sans)` → `var(--font-inter)` in `globals.css`.

Ran `npm run server` successfully — real schema captured below.
| `ui/tailwind.config.ts` | Removed `darkMode: ["class"]` (Tailwind v4 type incompatibility — see Bugs) |

### Deviations from Prompts (with reasons)
1. **Next.js 16.1.6, not 14** — `create-next-app@latest` installs current latest. App Router still used; no functional difference for this phase.
2. **Tailwind v4, not v3** — `create-next-app@latest` pulls Tailwind v4. No `tailwind.config.ts` by default in v4; workaround: created the file as requested AND added `@config "../tailwind.config.ts"` in `globals.css` to bridge both systems. Custom colors work as Tailwind utilities (`bg-agent`, etc.).
3. **React 19.2.3** — pulled by Next.js 16. No issues.
4. **shadcn 3.8.5** — latest at time of init. No issues.
5. **`"use client"` on stores** — Zustand's `create` is module-level and cannot run in RSC. Both store files are marked `"use client"`. This is correct behavior, not a deviation.

### Bugs Hit
1. **`tailwind.config.ts` TS error at build** — `darkMode: ["class"]` is v3 syntax. Tailwind v4's `Config` type requires `["class", string]` (2-tuple), making the single-element array a type error. **Fix:** removed `darkMode` key entirely — dark mode is handled by `@custom-variant dark (&:is(.dark *))` in `globals.css`. Build clean after.

### DB Schema
- Not applicable — Prompt 2.1 not run this session.

### Blockers / Open Questions for Next Session
1. **`globals.css` stale font reference** — `@theme inline` still has `--font-sans: var(--font-geist-sans)` (shadcn default). Geist is no longer loaded; silently falls back to system font. Fix: update to `var(--font-inter)` before font-sensitive work begins (can be done at start of next session).
2. **`ui/server/` missing** — `npm run dev` errors on the `ts-node server/api.ts` half. Next.js side works fine standalone (`npx next dev` inside `ui/`). Unblocked once Prompt 2.1 creates `ui/server/`.
3. **Playwright not installed** — `npm run test` will fail. Add when test prompts begin.
4. **Types are best-effort** — `ui/types/ruflo.ts` fields may not match the real `.swarm/memory.db` schema. Prompt 2.1 must introspect the real DB and correct any mismatches.
5. **Workspace root warning** — Next.js detects multiple `package-lock.json` files and warns about workspace root inference. Silenced by setting `turbopack.root` in `next.config.ts` if it becomes noisy.

### Next Prompt
**Prompt 2.1** — API server scaffold: `ui/server/api.ts`, `ui/server/db.ts`, real DB schema introspection, correct `ui/types/ruflo.ts` against actual columns.

---

## Session — 2026-03-05 | Phase 1, Prompt 1.2 (≈ 15 min)

### Prompts Completed
- **Prompt 1.2** — Design System Components ✅

### What Was Done
Created `ui/components/ruflo/` with 6 base design-system components and a barrel export. All components pass `npx next build` with 0 TypeScript errors.

### Files Created
| File | Notes |
|------|-------|
| `ui/server/db.ts` | Read-only SQLite reader. Path from `RUFLO_DB_PATH` env or `__dirname/../../.swarm/memory.db`. Schema introspected on startup. 10 exported query functions. Gracefully returns empty arrays if DB missing. |
| `ui/server/api.ts` | Minimal stub — imports `db.ts` to trigger startup log. No HTTP server yet (Prompt 2.2). |
| `ui/components/ruflo/MonoText.tsx` | RSC. `<span>` with `font-mono text-xs text-slate-400`, extra `className` via `cn()` |
| `ui/components/ruflo/StatusBadge.tsx` | RSC. Pill + colored dot; `animate-pulse` on `running` only. Status map as typed record. |
| `ui/components/ruflo/AgentAvatar.tsx` | RSC. 8-color palette; deterministic hash from `role` (sum of char codes mod 8). Initials = `role.slice(0,2).toUpperCase()`. `title={agentId}` for hover tooltip. |
| `ui/components/ruflo/Panel.tsx` | RSC. `bg-slate-900 border border-slate-800 rounded-xl`. Optional `title` renders bordered header row. |
| `ui/components/ruflo/EmptyState.tsx` | `"use client"` (has `onClick` callback). Icon wrapper uses `[&>svg]:size-8`. Action button conditional on prop. |
| `ui/components/ruflo/DbStatusBanner.tsx` | RSC. Returns `null` when `status="connected"`. Config map typed with `satisfies` for `disconnected`/`stale` only. |
| `ui/components/ruflo/index.ts` | Barrel re-export of all 6 components. |

### Files Modified
| File | Change |
|------|--------|
| `ui/tsconfig.server.json` | Added `"moduleResolution": "node"` — base config had `"bundler"` which is incompatible with CommonJS output; was root cause of ts-node blocker |
| `ui/app/globals.css` | Fixed `--font-sans: var(--font-geist-sans)` → `var(--font-inter)` and `--font-mono` → `var(--font-jetbrains-mono)` (HANDOFF.md blocker #1) |

### Real DB Schema (from `npm run server`)

```
[ruflo-db] memory_entries: id, key, namespace, content, type, embedding, embedding_model, embedding_dimensions, tags, metadata, owner_id, created_at, updated_at, expires_at, last_accessed_at, access_count, status
[ruflo-db] patterns: id, name, pattern_type, condition, action, description, confidence, success_count, failure_count, decay_rate, half_life_days, embedding, embedding_dimensions, version, parent_id, tags, metadata, source, created_at, updated_at, last_matched_at, last_success_at, last_failure_at, status
[ruflo-db] pattern_history: id, pattern_id, version, confidence, success_count, failure_count, condition, action, change_type, change_reason, created_at
[ruflo-db] sqlite_sequence: name, seq
[ruflo-db] trajectories: id, session_id, status, verdict, task, context, total_steps, total_reward, started_at, ended_at, extracted_pattern_id
[ruflo-db] trajectory_steps: id, trajectory_id, step_number, action, observation, reward, metadata, created_at
[ruflo-db] migration_state: id, migration_type, status, total_items, processed_items, failed_items, skipped_items, current_batch, last_processed_id, source_path, source_type, destination_path, backup_path, backup_created_at, last_error, errors, started_at, completed_at, created_at, updated_at
[ruflo-db] sessions: id, state, status, project_path, branch, tasks_completed, patterns_learned, created_at, updated_at, expires_at
[ruflo-db] vector_indexes: id, name, dimensions, metric, hnsw_m, hnsw_ef_construction, hnsw_ef_search, quantization_type, quantization_bits, total_vectors, last_rebuild_at, created_at, updated_at
[ruflo-db] metadata: key, value, updated_at
```

### Key Discovery
**No `swarms`, `agents`, or `tasks` tables exist.** This is Ruflo's memory/learning store, not a swarm state DB. Swarm state will arrive via socket.io from the API process when `npx ruflo hive-mind spawn` runs. The `RufloSwarm`, `RufloAgent`, `RufloTask` types are kept as stubs for real-time events.

### Type Corrections Needed in `ui/types/ruflo.ts`

**Fix `RufloMemoryEntry`:**
- `value: string` → `content: string` (real column)
- `agentId: string | null` → `ownerId: string | null` (real column `owner_id`)
- Remove `swarmId: string | null` (no such column)
- `embedding: Buffer | null` → `embedding: string | null` (stored as JSON text)

**Fix `RufloPattern`** — expand to match real columns:
- `name: string`, `patternType: string`, `condition: string`, `action: string`
- `description: string | null`, `confidence: number`
- `successCount: number`, `failureCount: number`
- `lastMatchedAt: string | null` (was `lastAccessed`)
- Drop `pattern: string` and `accessCount: number` (were derived/misnamed)

**Add `RufloTrajectory`** (new — `trajectories` table):
- `id`, `sessionId`, `status`, `verdict`, `task`, `totalSteps`, `totalReward`, `startedAt`, `endedAt`

**Add `RufloSession`** (new — `sessions` table):
- `id`, `status`, `projectPath`, `branch`, `tasksCompleted`, `patternsLearned`, `createdAt`, `updatedAt`

**Keep as-is:** `RufloSwarm`, `RufloAgent`, `RufloTask`, `DbChangeEvent` — populated via socket.io events, not DB reads.

### Blockers / Open Questions for Next Session
1. **Type corrections pending confirmation** — `ui/types/ruflo.ts` has column name mismatches (see above). Correct before Prompt 2.2 so `db.ts` query functions return properly typed data.
2. **`db.ts` query functions need updating** — once types are corrected, update `getMemoryBySwarm`, `searchMemory`, `getAllPatterns`, and add `getAllTrajectories`, `getAllSessions` functions to match new type shapes.
3. **`api.ts` is a stub** — no HTTP or socket.io server yet. Prompt 2.2 scaffolds the full Express + socket.io server.

### Next Prompt
**Type corrections** (update `ui/types/ruflo.ts` per the schema above, then update `db.ts` query functions to match), then **Prompt 2.2** — full API server with Express, socket.io, chokidar watcher.
| `ui/tailwind.config.ts` | Removed `darkMode: ["class"]` — Tailwind v4 type requires a 2-tuple; dark mode already handled by `@custom-variant dark` in globals.css. |

### Deviations from Prompt
- None. All 6 components match spec exactly.

### Bugs Hit
1. **Build error in `tailwind.config.ts`** — `darkMode: ["class"]` is v3 syntax. Tailwind v4's `Config` type requires `["class", string]`, making the single-element array a type error. **Fix:** removed `darkMode` key entirely — handled by `@custom-variant dark` in globals.css. Build clean after.

### DB Schema
- Not applicable — Prompt 2.1 not run this session.

### Open Questions / Blockers for Next Session
- `globals.css` `@theme inline` still has `--font-sans: var(--font-geist-sans)` (shadcn default). Geist is no longer loaded — silently falls back to system font. Should be corrected to `var(--font-inter)` before font-sensitive work begins.
- `ui/server/` does not exist — `npm run dev` still errors on the ts-node half. Next prompt should be API server scaffold.

### Next Prompt
**Prompt 2.1** — API server scaffold (`ui/server/api.ts`, `ui/server/db.ts`) and DB schema introspection.

---

## Session — 2026-03-05 | Phase 1, Prompt 1.1 (≈ 20 min)

### Prompts Completed
- **Prompt 1.1** — Create the UI Subdirectory ✅

### What Was Done
Scaffolded the entire `ui/` subdirectory from scratch. No existing Ruflo files were touched.

### Files Created
| File | Notes |
|------|-------|
| `ui/` | Created via `mkdir -p` |
| `ui/app/layout.tsx` | Replaced Geist fonts with Inter + JetBrains Mono via `next/font/google`; `<html>` hard-coded to `className="dark"` |
| `ui/app/globals.css` | Added `@config "../tailwind.config.ts"` directive; added `--color-agent/orchestrator/danger/success` tokens in `@theme inline` |
| `ui/tailwind.config.ts` | Custom colors: agent (#3b82f6), orchestrator (#a855f7), danger (#ef4444), success (#22c55e); fontFamily extended with Inter/JetBrains Mono CSS vars |
| `ui/tsconfig.server.json` | As specified: extends tsconfig.json, module commonjs, outDir .server-dist, includes server/**/* |
| `ui/.env.local` | `RUFLO_DB_PATH`, `RUFLO_PROJECT_PATH`, `NEXT_PUBLIC_API_URL` |
| `ui/package.json` | Scripts updated: dev (concurrently), server, build, start, test, test:ui |
| `ui/lib/utils.ts` | Auto-generated by `shadcn@latest init --defaults` |
| `ui/components.json` | shadcn config, auto-generated |

### Files Modified (by scaffold tooling)
| File | By |
|------|----|
| `ui/app/globals.css` | shadcn init + manual edits |
| `ui/app/layout.tsx` | Manual rewrite (fonts) |
| `ui/package.json` | Manual script update |

### Deviations from Prompt (with reasons)
1. **Next.js version is 16.1.6, not 14.** `create-next-app@latest` resolved to Next.js 16. The prompt said "Next.js 14 App Router" but the command used was `create-next-app@latest` which installs whatever is current. The App Router is still used; no functional difference for this phase.
2. **Tailwind v4 (not v3).** `create-next-app@latest` pulls Tailwind v4, which has no `tailwind.config.ts` by default — configuration lives in CSS via `@theme`. Workaround: created `tailwind.config.ts` as requested AND wired it in `globals.css` via `@config "../tailwind.config.ts"` so both systems are active. The `--font-sans`/`--font-mono` tokens in `@theme inline` still reference the old Geist variable names from shadcn init — this is intentional to avoid breaking shadcn defaults; our Inter/JetBrains vars are additive alongside them.
3. **`shadcn@latest init --defaults` installed shadcn 3.8.5** (not a prior version). No functional issue.
4. **React is 19.2.3.** Next.js 16 pulls React 19. No issues for this scaffold phase.

### Bugs Hit
- None. All installs and inits completed cleanly.

### DB Schema
- Not applicable — Prompt 2.1 was not run this session.

### Open Questions / Blockers for Next Session
- The `ui/app/globals.css` still has `--font-sans: var(--font-geist-sans)` in `@theme inline` (shadcn default). If Geist is not loaded, this will silently fall back to the system font. **Prompt 2.x should add an explicit `--font-sans: var(--font-inter)` override or remove the Geist reference**, since `layout.tsx` no longer loads Geist.
- `ui/server/` directory does not exist yet — `npm run dev` will fail on the `ts-node server/api.ts` side until Prompt 2.x creates it. The Next.js side (`next dev`) will start fine on its own with `npm run server` or by running `npx next dev` directly inside `ui/`.
- Playwright is not installed yet (`npm run test` will fail). Install when test prompts begin.

### Next Prompt
**Prompt 1.2** (or next in sequence) — likely the API server scaffold (`ui/server/api.ts`, `ui/server/db.ts`).

---

## Session — Phase 0 Setup

**What was done:** - Cloned fork from https://github.com/jobelshaji95/ruflo_UI - Installed Ruflo dependencies - Initialized Ruflo (created .swarm/, .claude/, memory.db) - Registered ruflo MCP server with Claude Code - Started Ruflo daemon - Ran test swarm to seed the database - Created CLAUDE.md and HANDOFF.md

**Next session — run this prompt exactly:** Prompt 1.1 — Create the UI Subdirectory (Phase 1, Scaffold)
