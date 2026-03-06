"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, TerminalSquare, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useSwarms } from "@/hooks/useSwarms";
import { useRufloStore } from "@/store/rufloStore";
import { EmptyState, DaemonPanel, AgentDetailPanel, SwarmCanvas } from "@/components/ruflo";

const SPAWN_CMD = 'npx ruflo hive-mind spawn "your objective" --claude';

const STATUS_DOT: Record<string, string> = {
  connected: "bg-green-500",
  stale: "bg-amber-500",
  disconnected: "bg-red-500",
};

function CopyableCommand({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    toast.success("Command copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 mt-2 rounded-lg bg-slate-800 px-3 py-2 max-w-md">
      <code className="flex-1 text-xs font-mono text-slate-300 select-all">{cmd}</code>
      <button
        onClick={handleCopy}
        className="shrink-0 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
        aria-label="Copy command"
      >
        {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export default function CanvasPage() {
  const { swarms } = useSwarms();
  const dbStatus = useRufloStore((s) => s.dbStatus);
  const activeSwarmId = useRufloStore((s) => s.activeSwarmId);
  const selectedAgentId = useRufloStore((s) => s.selectedAgentId);
  const setActiveSwarmId = useRufloStore((s) => s.setActiveSwarmId);

  return (
    <div className="flex h-dvh bg-slate-950 text-slate-200 overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="w-[240px] shrink-0 flex flex-col border-r border-slate-800 bg-slate-950">
        {/* Wordmark + connection dot */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
          <span className="text-base font-bold tracking-tight text-slate-100">ruflo</span>
          <span
            className={`size-2 rounded-full ${STATUS_DOT[dbStatus] ?? STATUS_DOT.disconnected}`}
            title={dbStatus}
          />
        </div>

        {/* New Swarm button */}
        <div className="px-3 pt-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer">
            <Plus className="size-3.5" />
            New Swarm
          </button>
        </div>

        {/* Swarm list */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 mt-1">
          {swarms.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-slate-600">No swarms yet</p>
          ) : (
            swarms.map((swarm) => (
              <button
                key={swarm.id}
                onClick={() => setActiveSwarmId(swarm.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer mb-0.5 ${
                  activeSwarmId === swarm.id
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <p className="truncate font-medium">{swarm.name}</p>
                <p className="truncate text-[10px] text-slate-500 mt-0.5">{swarm.status}</p>
              </button>
            ))
          )}
        </nav>

        {/* Daemon panel pinned to bottom */}
        <div className="p-3 border-t border-slate-800">
          <DaemonPanel />
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <main className="flex-1 overflow-hidden relative">
        {activeSwarmId ? (
          <SwarmCanvas swarmId={activeSwarmId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <EmptyState
              icon={<TerminalSquare />}
              title="No swarm selected"
              description="Spawn a swarm to get started:"
            />
            <CopyableCommand cmd={SPAWN_CMD} />
          </div>
        )}
      </main>

      {/* ── Right Drawer (framer-motion) ── */}
      <AnimatePresence>
        {selectedAgentId && (
          <motion.div
            key="drawer"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[360px] shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto"
          >
            <AgentDetailPanel agentId={selectedAgentId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
