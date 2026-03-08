# ruflo_UI — Project Context for Claude Code

## Repo Fork of ruvnet/ruflo: https://github.com/jobelshaji95/ruflo_UI UI lives in: `./ui/` subdirectory

## What We're Building A monitoring and control UI for Ruflo's agent swarms. Reads directly from `.swarm/memory.db`. Never mocks data.

## Architecture Browser  ←  Next.js (3000)  ←  API Server (3001)  ←  .swarm/memory.db
                                      ↑
                                chokidar watcher
                                db:change / db:stale via socket.io

UI Launch → API Server → npx ruflo hive-mind spawn ... → db updates → UI refreshes

## DB Path `.swarm/memory.db` — relative to repo root. In ui/server/db.ts, always reference as: path.resolve(__dirname, '../../.swarm/memory.db')

## Tech Stack Next.js 14 App Router, TypeScript strict, Tailwind CSS (dark/slate), shadcn/ui, @xyflow/react, better-sqlite3, chokidar, socket.io, zustand, framer-motion, sonner

## Coding Rules - Never mock data — always read from the real db - Never add features not in the prompt library unless explicitly asked - When a prompt is ambiguous, ask ONE clarifying question before writing code - All new hooks go in ui/hooks/, all server logic in ui/server/ - Commit at every [CHECKPOINT]

## Current Status Last completed prompt: Prompt 7.1 — Memory Browser (`/memory` route, 3-panel namespace/table/detail layout) Current phase: Phase 7 in progress Next prompt: Phase 7 continues — likely Prompt 7.2 (Patterns/Trajectories page) or canvas polish

## Known Issues - None yet
