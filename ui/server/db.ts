import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

import type {
  RufloAgent,
  RufloMemoryEntry,
  RufloPattern,
  RufloSession,
  RufloSwarm,
  RufloTask,
  RufloTrajectory,
  DbChangeEvent,
} from '../types/ruflo'

const DB_PATH = process.env.RUFLO_DB_PATH
  ? path.resolve(process.cwd(), process.env.RUFLO_DB_PATH)
  : path.resolve(__dirname, '../../.swarm/memory.db')

let db: Database.Database | null = null

// ── Startup: open DB and introspect schema ────────────────────────────────────

try {
  db = new Database(DB_PATH, { readonly: true })

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[]

  for (const { name } of tables) {
    const info = db.prepare(`PRAGMA table_info(${name})`).all()
    console.log(
      `[ruflo-db] ${name}:`,
      (info as { name: string }[]).map((c) => c.name).join(', ')
    )
  }

  console.log(`[ruflo-db] connected: ${DB_PATH}`)
} catch (err) {
  console.warn(`[ruflo-db] not found or unreadable: ${DB_PATH}`)
  db = null
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function tableExists(name: string): boolean {
  if (!db) return false
  const row = db
    .prepare(
      "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name=?"
    )
    .get(name) as { n: number }
  return row.n > 0
}

function msToIso(ms: number | null | undefined): string {
  if (!ms) return new Date(0).toISOString()
  return new Date(ms).toISOString()
}

// ── Swarms — stub, no table in this DB (populated via socket.io) ──────────────

export function getAllSwarms(): RufloSwarm[] {
  if (!db || !tableExists('swarms')) return []
  return db.prepare('SELECT * FROM swarms').all() as RufloSwarm[]
}

export function getSwarmById(id: string): RufloSwarm | null {
  if (!db || !tableExists('swarms')) return null
  return (
    (db.prepare('SELECT * FROM swarms WHERE id = ?').get(id) as RufloSwarm) ??
    null
  )
}

// ── Agents — stub, no table in this DB (populated via socket.io) ──────────────

export function getAllAgents(): RufloAgent[] {
  if (!db || !tableExists('agents')) return []
  return db.prepare('SELECT * FROM agents').all() as RufloAgent[]
}

export function getAgentsBySwarm(swarmId: string): RufloAgent[] {
  if (!db || !tableExists('agents')) return []
  return db
    .prepare('SELECT * FROM agents WHERE swarmId = ?')
    .all(swarmId) as RufloAgent[]
}

// ── Tasks — stub, no table in this DB (populated via socket.io) ───────────────

export function getTasksByAgent(agentId: string): RufloTask[] {
  if (!db || !tableExists('tasks')) return []
  return db
    .prepare('SELECT * FROM tasks WHERE agentId = ?')
    .all(agentId) as RufloTask[]
}

// ── Memory entries (memory_entries table) ─────────────────────────────────────

interface MemoryRow {
  id: string
  key: string
  namespace: string
  content: string
  type: string
  owner_id: string | null
  created_at: number
  embedding: string | null
}

function rowToMemoryEntry(row: MemoryRow): RufloMemoryEntry {
  return {
    id: row.id,
    namespace: row.namespace,
    key: row.key,
    content: row.content,
    type: row.type,
    ownerId: row.owner_id,
    createdAt: msToIso(row.created_at),
    embedding: row.embedding,
  }
}

export function getMemoryNamespaces(): { namespace: string; count: number }[] {
  if (!db || !tableExists('memory_entries')) return []
  return db
    .prepare(
      `SELECT namespace, COUNT(*) AS count
       FROM memory_entries
       WHERE status = 'active'
       GROUP BY namespace
       ORDER BY count DESC`
    )
    .all() as { namespace: string; count: number }[]
}

export function getAllMemory(namespace?: string): RufloMemoryEntry[] {
  if (!db || !tableExists('memory_entries')) return []
  const base = `
    SELECT id, key, namespace, content, type, owner_id, created_at, embedding
    FROM memory_entries
    WHERE status = 'active'
  `
  let rows: MemoryRow[]
  if (namespace) {
    rows = db
      .prepare(base + ' AND namespace = ? ORDER BY created_at DESC')
      .all(namespace) as MemoryRow[]
  } else {
    rows = db
      .prepare(base + ' ORDER BY created_at DESC')
      .all() as MemoryRow[]
  }
  return rows.map(rowToMemoryEntry)
}

export function getMemoryBySwarm(swarmId: string): RufloMemoryEntry[] {
  if (!db || !tableExists('memory_entries')) return []
  const rows = db
    .prepare(
      `SELECT id, key, namespace, content, type, owner_id, created_at, embedding
       FROM memory_entries
       WHERE owner_id = ? AND status = 'active'`
    )
    .all(swarmId) as MemoryRow[]
  return rows.map(rowToMemoryEntry)
}

export function searchMemory(
  query: string,
  namespace?: string
): RufloMemoryEntry[] {
  if (!db || !tableExists('memory_entries')) return []
  const like = `%${query}%`
  const base = `
    SELECT id, key, namespace, content, type, owner_id, created_at, embedding
    FROM memory_entries
    WHERE (key LIKE ? OR content LIKE ?) AND status = 'active'
  `
  let rows: MemoryRow[]
  if (namespace) {
    rows = db
      .prepare(base + ' AND namespace = ?')
      .all(like, like, namespace) as MemoryRow[]
  } else {
    rows = db.prepare(base).all(like, like) as MemoryRow[]
  }
  return rows.map(rowToMemoryEntry)
}

// ── Patterns (patterns table) ─────────────────────────────────────────────────

interface PatternRow {
  id: string
  name: string
  pattern_type: string
  condition: string
  action: string
  description: string | null
  confidence: number
  success_count: number
  failure_count: number
  last_matched_at: number | null
}

export function getAllPatterns(): RufloPattern[] {
  if (!db || !tableExists('patterns')) return []
  const rows = db
    .prepare(
      `SELECT id, name, pattern_type, condition, action, description,
              confidence, success_count, failure_count, last_matched_at
       FROM patterns
       WHERE status = 'active'
       ORDER BY confidence DESC`
    )
    .all() as PatternRow[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    patternType: r.pattern_type,
    condition: r.condition,
    action: r.action,
    description: r.description,
    confidence: r.confidence,
    successCount: r.success_count,
    failureCount: r.failure_count,
    lastMatchedAt: r.last_matched_at ? msToIso(r.last_matched_at) : null,
  }))
}

// ── Trajectories (trajectories table) ────────────────────────────────────────

interface TrajectoryRow {
  id: string
  session_id: string | null
  status: string
  verdict: string | null
  task: string | null
  total_steps: number
  total_reward: number
  started_at: number
  ended_at: number | null
}

export function getAllTrajectories(): RufloTrajectory[] {
  if (!db || !tableExists('trajectories')) return []
  const rows = db
    .prepare(
      `SELECT id, session_id, status, verdict, task,
              total_steps, total_reward, started_at, ended_at
       FROM trajectories
       ORDER BY started_at DESC`
    )
    .all() as TrajectoryRow[]
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    status: r.status as RufloTrajectory['status'],
    verdict: (r.verdict ?? null) as RufloTrajectory['verdict'],
    task: r.task,
    totalSteps: r.total_steps,
    totalReward: r.total_reward,
    startedAt: msToIso(r.started_at),
    endedAt: r.ended_at ? msToIso(r.ended_at) : null,
  }))
}

// ── Sessions (sessions table) ─────────────────────────────────────────────────

interface SessionRow {
  id: string
  status: string
  project_path: string | null
  branch: string | null
  tasks_completed: number
  patterns_learned: number
  created_at: number
  updated_at: number
}

export function getAllSessions(): RufloSession[] {
  if (!db || !tableExists('sessions')) return []
  const rows = db
    .prepare(
      `SELECT id, status, project_path, branch,
              tasks_completed, patterns_learned, created_at, updated_at
       FROM sessions
       ORDER BY created_at DESC`
    )
    .all() as SessionRow[]
  return rows.map((r) => ({
    id: r.id,
    status: r.status as RufloSession['status'],
    projectPath: r.project_path,
    branch: r.branch,
    tasksCompleted: r.tasks_completed,
    patternsLearned: r.patterns_learned,
    createdAt: msToIso(r.created_at),
    updatedAt: msToIso(r.updated_at),
  }))
}

// ── Recent activity (no change-log table; real events come from chokidar) ─────

export function getRecentActivity(limit = 20): DbChangeEvent[] {
  // No change-log table in this DB schema.
  // Real DbChangeEvents are emitted by the chokidar file watcher in api.ts.
  void limit
  return []
}

// ── DB stats & health ─────────────────────────────────────────────────────────

export function getDbStats(): { table: string; rowCount: number }[] {
  if (!db) return []
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[]
  return tables.map(({ name }) => {
    const row = db!
      .prepare(`SELECT count(*) AS n FROM ${name}`)
      .get() as { n: number }
    return { table: name, rowCount: row.n }
  })
}

export function getDbHealth(): {
  connected: boolean
  path: string
  lastModified: string | null
} {
  if (!db || !fs.existsSync(DB_PATH)) {
    return { connected: false, path: DB_PATH, lastModified: null }
  }
  try {
    const stat = fs.statSync(DB_PATH)
    return {
      connected: true,
      path: DB_PATH,
      lastModified: stat.mtime.toISOString(),
    }
  } catch {
    return { connected: false, path: DB_PATH, lastModified: null }
  }
}
