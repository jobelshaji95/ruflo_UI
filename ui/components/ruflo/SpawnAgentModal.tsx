"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const AGENT_TYPES = [
  "worker",
  "orchestrator",
  "coordinator",
  "researcher",
  "coder",
  "reviewer",
  "specialist",
  "analyst",
] as const;

type AgentType = (typeof AGENT_TYPES)[number];

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

interface SpawnAgentModalProps {
  open: boolean;
  swarmId: string;
  onClose: () => void;
}

export function SpawnAgentModal({ open, swarmId, onClose }: SpawnAgentModalProps) {
  const [agentType, setAgentType] = useState<AgentType>("worker");
  const [agentName, setAgentName] = useState(`worker-${randomSuffix()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate name when type changes
  useEffect(() => {
    setAgentName(`${agentType}-${randomSuffix()}`);
  }, [agentType]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setAgentType("worker");
      setAgentName(`worker-${randomSuffix()}`);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const commandPreview = `npx ruflo agent spawn -t ${agentType} --name ${agentName || "<name>"}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swarmId, agentType, agentName: agentName.trim() || `${agentType}-${randomSuffix()}` }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      toast.success("Agent spawned — will appear in canvas shortly");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-200">Spawn Agent</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Agent Type</label>
            <select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value as AgentType)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-500 cursor-pointer"
            >
              {AGENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Command</label>
            <div className="bg-slate-950 text-slate-400 font-mono text-[10px] rounded p-2 break-all select-all">
              {commandPreview}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-[11px] leading-snug">{error}</p>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !agentName.trim()}
              className="flex-1 py-2 text-xs rounded-lg bg-violet-700 hover:bg-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? "Spawning…" : "Spawn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
