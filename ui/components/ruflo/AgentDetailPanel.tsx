"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useRufloStore } from "@/store/rufloStore";
import { useAgentTasks } from "@/hooks/useAgentTasks";
import type { RufloMemoryEntry, RufloTask } from "@/types/ruflo";
import { AgentAvatar } from "./AgentAvatar";
import { StatusBadge } from "./StatusBadge";
import { MonoText } from "./MonoText";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const TASK_PILL: Record<RufloTask["status"], string> = {
  running: "text-blue-400 bg-blue-950",
  completed: "text-green-400 bg-green-950",
  failed: "text-red-400 bg-red-950",
  pending: "text-slate-400 bg-slate-800",
};

// ── Component ──────────────────────────────────────────────────────────────────

interface AgentDetailPanelProps {
  agentId: string;
}

export function AgentDetailPanel({ agentId }: AgentDetailPanelProps) {
  const agent = useRufloStore((s) => s.agents.find((a) => a.id === agentId));
  const setSelectedAgentId = useRufloStore((s) => s.setSelectedAgentId);
  const { tasks } = useAgentTasks(agentId);

  // Live clock — ticks every second while agent is running
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (agent?.status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [agent?.status]);

  // Memory entries
  const [memory, setMemory] = useState<RufloMemoryEntry[]>([]);
  useEffect(() => {
    if (!agent) return;
    fetch(`${API_URL}/swarms/${agentId}/memory`)
      .then((r) => r.json())
      .then((data: RufloMemoryEntry[]) => setMemory(Array.isArray(data) ? data.slice(0, 10) : []))
      .catch(() => setMemory([]));
  }, [agentId, agent?.swarmId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memory expand state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Task history auto-scroll
  const listRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const [scrollPaused, setScrollPaused] = useState(false);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    isPausedRef.current = !atBottom;
    setScrollPaused(!atBottom);
  }

  useEffect(() => {
    if (isPausedRef.current) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [tasks.length]);

  // Derived values
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const currentTask = sortedTasks.find((t) => t.status === "running") ?? null;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const timeRunning =
    agent?.status === "running" && agent.createdAt
      ? formatElapsed(now - new Date(agent.createdAt).getTime())
      : "—";

  if (!agent) {
    return (
      <div className="flex flex-col h-full p-4">
        <button
          onClick={() => setSelectedAgentId(null)}
          className="self-end text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
        <p className="text-xs text-slate-500 mt-4">Agent not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* ── Header ── */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <AgentAvatar agentId={agent.id} role={agent.type} size="lg" className="shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-100 truncate">{agent.name}</p>
              <p className="text-slate-500 truncate">{agent.type}</p>
              <MonoText className="text-[10px] break-all leading-tight">{agent.id}</MonoText>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedAgentId(null)}
              className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <StatusBadge status={agent.status} />
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800 shrink-0">
        {[
          { label: "Tokens Used", value: agent.tokensUsed?.toLocaleString() ?? "—" },
          { label: "Tasks Done", value: String(completedCount) },
          { label: "Running", value: timeRunning },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 px-1 gap-0.5">
            <span className="text-[10px] text-slate-500 text-center">{label}</span>
            <MonoText className="text-sm text-slate-200">{value}</MonoText>
          </div>
        ))}
      </div>

      {/* ── Current Task ── */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Current Task
        </p>
        {currentTask ? (
          <div className="flex items-start justify-between gap-2">
            <p className="text-slate-300 leading-relaxed">{currentTask.description}</p>
            <MonoText className="shrink-0 text-[10px] text-slate-500">
              {formatElapsed(now - new Date(currentTask.createdAt).getTime())}
            </MonoText>
          </div>
        ) : (
          <p className="text-slate-600 italic">Idle</p>
        )}
      </div>

      {/* ── Task History ── */}
      <div className="flex flex-col min-h-0 border-b border-slate-800" style={{ flex: "0 1 220px" }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5 shrink-0">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Task History
          </p>
          {scrollPaused && (
            <span className="text-[10px] text-amber-400">● paused</span>
          )}
        </div>
        <div
          ref={listRef}
          onScroll={onScroll}
          className="overflow-y-auto flex-1 px-4 pb-3 flex flex-col gap-1.5"
        >
          {sortedTasks.length === 0 ? (
            <p className="text-slate-600 italic">No tasks yet</p>
          ) : (
            [...sortedTasks].reverse().map((task) => (
              <div key={task.id} className="flex items-start gap-2">
                <span
                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${TASK_PILL[task.status]}`}
                >
                  {task.status}
                </span>
                <p className="text-slate-300 leading-tight">{task.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Memory Entries ── */}
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          Memory
        </p>
        <div className="overflow-y-auto flex-1 px-4 pb-4 flex flex-col gap-2">
          {memory.length === 0 ? (
            <p className="text-slate-600 italic">No memory entries</p>
          ) : (
            memory.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 text-[10px] bg-slate-800 text-slate-400 px-1 rounded">
                      {entry.namespace}
                    </span>
                    <MonoText className="text-[10px] truncate">{entry.key}</MonoText>
                  </div>
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {expanded.has(entry.id) ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                  </button>
                </div>
                {expanded.has(entry.id) && (
                  <pre className="text-[10px] text-slate-400 bg-slate-900 rounded p-2 whitespace-pre-wrap break-all overflow-x-hidden">
                    {entry.content}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
