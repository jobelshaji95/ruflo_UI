import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { spawn, exec } from 'child_process'
import chokidar from 'chokidar'
import path from 'path'

import {
  getAllSwarms,
  getSwarmById,
  getAgentsBySwarm,
  getMemoryBySwarm,
  getAllAgents,
  getTasksByAgent,
  searchMemory,
  getAllPatterns,
  getRecentActivity,
  getDbHealth,
} from './db'

const rufloRoot = process.env.RUFLO_PROJECT_PATH
  ? path.resolve(process.cwd(), process.env.RUFLO_PROJECT_PATH)
  : path.resolve(__dirname, '../../')

const DB_PATH = process.env.RUFLO_DB_PATH
  ? path.resolve(process.cwd(), process.env.RUFLO_DB_PATH)
  : path.resolve(__dirname, '../../.swarm/memory.db')

const PORT = Number(process.env.API_PORT ?? 3001)

// ── Server setup ──────────────────────────────────────────────────────────────

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
})

app.use(express.json())
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// ── GET endpoints ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json(getDbHealth())
})

app.get('/swarms', (_req, res) => {
  res.json(getAllSwarms())
})

app.get('/swarms/:id', (req, res) => {
  const swarm = getSwarmById(req.params.id)
  if (!swarm) return res.status(404).json({ error: 'not found' })
  res.json(swarm)
})

app.get('/swarms/:id/agents', (req, res) => {
  res.json(getAgentsBySwarm(req.params.id))
})

app.get('/swarms/:id/memory', (req, res) => {
  res.json(getMemoryBySwarm(req.params.id))
})

app.get('/agents', (_req, res) => {
  res.json(getAllAgents())
})

app.get('/agents/:id/tasks', (req, res) => {
  res.json(getTasksByAgent(req.params.id))
})

app.get('/memory/search', (req, res) => {
  const q = String(req.query.q ?? '')
  const ns = req.query.ns ? String(req.query.ns) : undefined
  res.json(searchMemory(q, ns))
})

app.get('/patterns', (_req, res) => {
  res.json(getAllPatterns())
})

app.get('/daemon/status', (_req, res) => {
  exec('npx ruflo daemon status', { cwd: rufloRoot }, (_err, stdout, stderr) => {
    res.json({ output: stdout || stderr })
  })
})

// ── POST endpoints ────────────────────────────────────────────────────────────

app.post('/swarms/launch', (req, res) => {
  const { objective = 'monitor', topology = 'hierarchical', maxAgents = 5 } = req.body
  const child = spawn(
    'npx',
    [
      'ruflo', 'hive-mind', 'spawn', objective,
      '--topology', topology,
      '--max-agents', String(maxAgents),
      '--claude',
    ],
    { cwd: rufloRoot, detached: true, stdio: 'ignore' }
  )
  child.unref()
  res.json({ launched: true, objective, topology, maxAgents })
})

app.post('/swarms/:id/stop', (req, res) => {
  // Placeholder until ruflo exposes a stop-by-id command
  res.json({ stopped: true, id: req.params.id })
})

app.post('/agents/spawn', (req, res) => {
  const { agentType = 'worker', agentName = 'agent' } = req.body
  const child = spawn(
    'npx',
    ['ruflo', 'agent', 'spawn', '-t', agentType, '--name', agentName],
    { cwd: rufloRoot, detached: true, stdio: 'ignore' }
  )
  child.unref()
  res.json({ spawned: true, agentType, agentName })
})

app.post('/daemon/start', (_req, res) => {
  exec('npx ruflo daemon start', { cwd: rufloRoot }, (_err, stdout, stderr) => {
    res.json({ output: stdout || stderr })
  })
})

app.post('/daemon/stop', (_req, res) => {
  exec('npx ruflo daemon stop', { cwd: rufloRoot }, (_err, stdout, stderr) => {
    res.json({ output: stdout || stderr })
  })
})

// ── Live push: chokidar + socket.io ──────────────────────────────────────────

let lastChange = Date.now()

chokidar.watch(DB_PATH).on('change', () => {
  lastChange = Date.now()
  io.emit('db:change', {
    events: getRecentActivity(),
    timestamp: new Date().toISOString(),
  })
})

setInterval(() => {
  if (Date.now() - lastChange > 30_000) {
    io.emit('db:stale', { lastChange: new Date(lastChange).toISOString() })
  }
}, 5_000)

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[ruflo-api] listening on http://localhost:${PORT}`)
})
