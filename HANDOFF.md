# ruflo_UI — Session Handoff Log

Append a new entry at the top after every session. Never delete old entries.

---

## Session — 2026-03-05 | Phase 2, Prompt 2.1 (≈ 30 min)

### Prompts Completed
- **Prompt 2.1** — DB Reader & Schema Introspection ✅

### What Was Done
Created `ui/server/` (was missing, causing `npm run dev` errors). Created `ui/server/db.ts` (read-only SQLite reader with startup schema introspection) and a minimal `ui/server/api.ts` stub as entry point. Fixed `tsconfig.server.json` to add `moduleResolution: "node"` (root cause of the ts-node blocker). Fixed stale `--font-sans: var(--font-geist-sans)` → `var(--font-inter)` in `globals.css`.

Ran `npm run server` successfully — real schema captured below.

### Files Created
| File | Notes |
|------|-------|
| `ui/server/db.ts` | Read-only SQLite reader. Path from `RUFLO_DB_PATH` env or `__dirname/../../.swarm/memory.db`. Schema introspected on startup. 10 exported query functions. Gracefully returns empty arrays if DB missing. |
| `ui/server/api.ts` | Minimal stub — imports `db.ts` to trigger startup log. No HTTP server yet (Prompt 2.2). |

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

---

## Session — Phase 0 Setup

**What was done:** - Cloned fork from https://github.com/jobelshaji95/ruflo_UI - Installed Ruflo dependencies - Initialized Ruflo (created .swarm/, .claude/, memory.db) - Registered ruflo MCP server with Claude Code - Started Ruflo daemon - Ran test swarm to seed the database - Created CLAUDE.md and HANDOFF.md

**Next session — run this prompt exactly:** Prompt 1.1 — Create the UI Subdirectory (Phase 1, Scaffold)
