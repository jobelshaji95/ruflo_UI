export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'waiting'
export type SwarmStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused'
export type SwarmTopology = 'hierarchical' | 'mesh' | 'ring' | 'star' | 'hybrid' | 'hierarchical-mesh'

export interface RufloAgent {
  id: string; type: string; name: string; status: AgentStatus
  swarmId: string; currentTask: string | null; tokensUsed: number
  createdAt: string; updatedAt: string; metadata: Record<string, unknown>
}

export interface RufloSwarm {
  id: string; name: string; objective: string; status: SwarmStatus
  topology: SwarmTopology; maxAgents: number; agentCount: number
  createdAt: string; startedAt: string | null; completedAt: string | null
  metadata: Record<string, unknown>
}

export interface RufloMemoryEntry {
  id: string; namespace: string; key: string; value: string
  agentId: string | null; swarmId: string | null
  createdAt: string; embedding: Buffer | null
}

export interface RufloTask {
  id: string; agentId: string; swarmId: string; description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result: string | null; createdAt: string; completedAt: string | null
}

export interface RufloPattern {
  id: string; pattern: string; confidence: number
  accessCount: number; lastAccessed: string
}

export interface DbChangeEvent {
  table: string; operation: 'INSERT' | 'UPDATE' | 'DELETE'
  rowId: number; timestamp: string
}
