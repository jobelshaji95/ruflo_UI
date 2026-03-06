"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  BaseEdge,
  getBezierPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import { Plus, Wrench } from "lucide-react";
import { useSwarm } from "@/hooks/useSwarm";
import { useRufloStore } from "@/store/rufloStore";
import type { RufloAgent } from "@/types/ruflo";
import { AgentAvatar } from "./AgentAvatar";
import { StatusBadge } from "./StatusBadge";
import { SpawnAgentModal } from "./SpawnAgentModal";

// ── Node data ──────────────────────────────────────────────────────────────────

interface AgentNodeData extends Record<string, unknown> {
  agent: RufloAgent;
  swarmId: string;
  onSpawnClick: () => void;
  onAgentClick: (id: string) => void;
}

// ── Node classifiers ───────────────────────────────────────────────────────────

function isOrchestrator(a: RufloAgent): boolean {
  return /orchestrator|coordinator|queen/i.test(a.type);
}

function isTool(a: RufloAgent): boolean {
  return (
    a.type.toLowerCase() === "tool" ||
    (a.currentTask?.toLowerCase().startsWith("tool:") ?? false)
  );
}

// ── OrchestratorNode ───────────────────────────────────────────────────────────

function OrchestratorNode({ data }: NodeProps) {
  const d = data as AgentNodeData;
  const { agent, onAgentClick } = d;
  const running = agent.status === "running";

  return (
    <div
      onClick={() => onAgentClick(agent.id)}
      style={{ width: 200, height: 80 }}
      className={`relative rounded-xl border-2 border-violet-500 bg-slate-900 px-3 py-2 flex flex-col justify-center gap-1 cursor-pointer hover:border-violet-400 transition-colors ${
        running ? "shadow-lg shadow-violet-500/20" : ""
      }`}
    >
      {/* Pulsing ring when running */}
      {running && (
        <span className="absolute inset-0 rounded-xl border-2 border-violet-400 animate-ping opacity-30 pointer-events-none" />
      )}
      <div className="flex items-center gap-2">
        <AgentAvatar agentId={agent.id} role={agent.type} size="sm" />
        <span className="text-xs font-semibold text-violet-300 truncate">{agent.name}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{agent.type}</span>
        {agent.tokensUsed > 0 && (
          <span className="text-[10px] font-mono text-slate-500">
            {agent.tokensUsed.toLocaleString()} tok
          </span>
        )}
      </div>
    </div>
  );
}

// ── AgentNode ──────────────────────────────────────────────────────────────────

function AgentNode({ data }: NodeProps) {
  const d = data as AgentNodeData;
  const { agent, onAgentClick, onSpawnClick } = d;

  const truncatedTask = agent.currentTask
    ? agent.currentTask.length > 30
      ? agent.currentTask.slice(0, 30) + "…"
      : agent.currentTask
    : null;

  return (
    <div
      onClick={() => onAgentClick(agent.id)}
      style={{ width: 180, height: 70 }}
      className="relative rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 flex flex-col justify-between cursor-pointer hover:border-slate-500 transition-colors"
    >
      <div className="flex items-center gap-2">
        <AgentAvatar agentId={agent.id} role={agent.type} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-200 truncate">{agent.name}</p>
          <p className="text-[10px] text-slate-500 truncate">{agent.type}</p>
        </div>
        <StatusBadge status={agent.status} className="shrink-0" />
      </div>
      {truncatedTask && (
        <p className="text-[10px] text-slate-500 truncate">{truncatedTask}</p>
      )}

      {/* Spawn sub-agent button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSpawnClick();
        }}
        className="absolute bottom-1.5 right-1.5 size-4 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        title="Spawn agent"
      >
        <Plus className="size-2.5" />
      </button>
    </div>
  );
}

// ── ToolNode ───────────────────────────────────────────────────────────────────

function ToolNode({ data }: NodeProps) {
  const d = data as AgentNodeData;
  const { agent, onAgentClick } = d;

  const toolName = agent.currentTask?.startsWith("tool:")
    ? agent.currentTask.slice(5).split(/[\s(]/)[0]
    : agent.name;

  return (
    <div
      onClick={() => onAgentClick(agent.id)}
      style={{ width: 140, height: 50 }}
      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-slate-500 transition-colors"
    >
      <Wrench className="size-3.5 text-amber-500 shrink-0" />
      <span className="text-[11px] text-slate-300 truncate">{toolName}</span>
    </div>
  );
}

// ── MessageEdge ────────────────────────────────────────────────────────────────

function MessageEdge({ sourceX, sourceY, targetX, targetY, data, markerEnd }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  const running = (data as { running?: boolean } | undefined)?.running ?? false;

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: running ? "#6366f1" : "#475569",
        strokeWidth: 1.5,
        strokeDasharray: running ? "5 5" : undefined,
        animation: running ? "dashdraw 0.5s linear infinite" : undefined,
      }}
    />
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────

const CENTER_X = 400;
const ORCH_W = 200;
const AGENT_W = 180;
const TOOL_W = 140;

function buildNodesAndEdges(
  agents: RufloAgent[],
  swarmId: string,
  onSpawnClick: () => void,
  onAgentClick: (id: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const orchs = agents.filter(isOrchestrator);
  const tools = agents.filter((a) => !isOrchestrator(a) && isTool(a));
  const workers = agents.filter((a) => !isOrchestrator(a) && !isTool(a));

  const makeData = (agent: RufloAgent): AgentNodeData => ({
    agent,
    swarmId,
    onSpawnClick,
    onAgentClick,
  });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Orchestrators — top center, stacked if multiple
  orchs.forEach((a, i) => {
    nodes.push({
      id: a.id,
      type: "orchestrator",
      position: { x: CENTER_X - ORCH_W / 2 + i * (ORCH_W + 16), y: 60 },
      data: makeData(a),
    });
  });

  // Workers — row at y=220
  const workerTotal = workers.length * AGENT_W + Math.max(0, workers.length - 1) * 24;
  workers.forEach((a, i) => {
    const x = CENTER_X - workerTotal / 2 + i * (AGENT_W + 24);
    nodes.push({
      id: a.id,
      type: "agent",
      position: { x, y: 220 },
      data: makeData(a),
    });
  });

  // Tools — row at y=370
  const toolTotal = tools.length * TOOL_W + Math.max(0, tools.length - 1) * 16;
  tools.forEach((a, i) => {
    const x = CENTER_X - toolTotal / 2 + i * (TOOL_W + 16);
    nodes.push({
      id: a.id,
      type: "tool",
      position: { x, y: 370 },
      data: makeData(a),
    });
  });

  // Edges: first orchestrator → each worker
  const firstOrch = orchs[0];
  if (firstOrch) {
    const running = firstOrch.status === "running";
    workers.forEach((w) => {
      edges.push({
        id: `${firstOrch.id}-${w.id}`,
        source: firstOrch.id,
        target: w.id,
        type: "message",
        data: { running },
      });
    });
    tools.forEach((t) => {
      edges.push({
        id: `${firstOrch.id}-${t.id}`,
        source: firstOrch.id,
        target: t.id,
        type: "message",
        data: { running },
      });
    });
  }

  return { nodes, edges };
}

// ── Node / edge type maps (stable references) ──────────────────────────────────

const nodeTypes = {
  orchestrator: OrchestratorNode,
  agent: AgentNode,
  tool: ToolNode,
};

const edgeTypes = {
  message: MessageEdge,
};

// ── SwarmCanvas ────────────────────────────────────────────────────────────────

interface SwarmCanvasProps {
  swarmId: string;
}

export function SwarmCanvas({ swarmId }: SwarmCanvasProps) {
  const { agents } = useSwarm(swarmId);
  const setSelectedAgentId = useRufloStore((s) => s.setSelectedAgentId);
  const [spawnOpen, setSpawnOpen] = useState(false);

  const { nodes, edges } = useMemo(
    () =>
      buildNodesAndEdges(
        agents,
        swarmId,
        () => setSpawnOpen(true),
        (id) => setSelectedAgentId(id)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agents, swarmId]
  );

  return (
    <>
      {/* Inline keyframe for animated edges */}
      <style>{`@keyframes dashdraw { from { stroke-dashoffset: 10; } to { stroke-dashoffset: 0; } }`}</style>

      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "orchestrator") return "#7c3aed";
              if (n.type === "tool") return "#d97706";
              return "#334155";
            }}
            maskColor="rgba(2,6,23,0.7)"
          />
          <Controls />
          <Panel position="top-right">
            <button
              onClick={() => setSpawnOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer shadow"
            >
              <Plus className="size-3" />
              Agent
            </button>
          </Panel>
        </ReactFlow>
      </div>

      <SpawnAgentModal
        open={spawnOpen}
        swarmId={swarmId}
        onClose={() => setSpawnOpen(false)}
      />
    </>
  );
}
