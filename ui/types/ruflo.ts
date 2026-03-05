// ── Shared status enums ────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'waiting'
export type SwarmStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused'
export type SwarmTopology =
  | 'hierarchical'
  | 'mesh'
  | 'ring'
  | 'star'
  | 'hybrid'
  | 'hierarchical-mesh'

// ── Stub types — populated via socket.io real-time events, NOT from DB ─────────
// No matching tables in .swarm/memory.db. Emitted by api.ts when
// `npx ruflo hive-mind spawn` runs.

export interface RufloSwarm {
  id: string
  name: string
  objective: string
  status: SwarmStatus
  topology: SwarmTopology
  maxAgents: number
  agentCount: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  metadata: Record<string, unknown>
}

export interface RufloAgent {
  id: string
  type: string
  name: string
  status: AgentStatus
  swarmId: string
  currentTask: string | null
  tokensUsed: number
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

export interface RufloTask {
  id: string
  agentId: string
  swarmId: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result: string | null
  createdAt: string
  completedAt: string | null
}

// ── Real DB types — read directly from .swarm/memory.db ──────────────────────

// Table: memory_entries
export interface RufloMemoryEntry {
  id: string
  namespace: string
  key: string
  content: string        // DB col: content  (was: value)
  type: string
  ownerId: string | null // DB col: owner_id (was: agentId; no swarmId column exists)
  createdAt: string      // DB col: created_at — integer ms, converted to ISO
  embedding: string | null // DB col: embedding — JSON text array, not Buffer
}

// Table: patterns
export interface RufloPattern {
  id: string
  name: string
  patternType: string          // DB col: pattern_type
  condition: string
  action: string
  description: string | null
  confidence: number
  successCount: number         // DB col: success_count
  failureCount: number         // DB col: failure_count
  lastMatchedAt: string | null // DB col: last_matched_at — integer ms, converted to ISO
}

// Table: trajectories — closest real equivalent to agent tasks/runs
export interface RufloTrajectory {
  id: string
  sessionId: string | null          // DB col: session_id
  status: 'active' | 'completed' | 'failed' | 'abandoned'
  verdict: 'success' | 'failure' | 'partial' | null
  task: string | null
  totalSteps: number                // DB col: total_steps
  totalReward: number               // DB col: total_reward
  startedAt: string                 // DB col: started_at — integer ms, converted to ISO
  endedAt: string | null            // DB col: ended_at — integer ms, converted to ISO
}

// Table: sessions — top-level context for a Ruflo run
export interface RufloSession {
  id: string
  status: 'active' | 'paused' | 'completed' | 'expired'
  projectPath: string | null  // DB col: project_path
  branch: string | null
  tasksCompleted: number      // DB col: tasks_completed
  patternsLearned: number     // DB col: patterns_learned
  createdAt: string           // DB col: created_at — integer ms, converted to ISO
  updatedAt: string           // DB col: updated_at — integer ms, converted to ISO
}

// ── Real-time event — emitted by chokidar watcher, not stored in DB ───────────

export interface DbChangeEvent {
  table: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  rowId: number
  timestamp: string
}
