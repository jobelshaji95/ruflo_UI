"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface SpawnAgentModalProps {
  open: boolean;
  swarmId: string;
  onClose: () => void;
}

export function SpawnAgentModal({ open, swarmId, onClose }: SpawnAgentModalProps) {
  const [agentType, setAgentType] = useState("");
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agentType.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: agentType.trim(), agentName: agentName.trim() || agentType.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Agent spawned");
      setAgentType("");
      setAgentName("");
      onClose();
    } catch (err) {
      toast.error(`Failed to spawn agent: ${err instanceof Error ? err.message : String(err)}`);
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
            <input
              type="text"
              placeholder="researcher"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Agent Name</label>
            <input
              type="text"
              placeholder="Agent name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
            />
          </div>

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
              disabled={loading || !agentType.trim()}
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
