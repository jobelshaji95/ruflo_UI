"use client";

import { toast } from "sonner";
import { useDaemon } from "@/hooks/useDaemon";
import { Panel } from "./Panel";

export function DaemonPanel() {
  const { running, uptime, loading, lastOutput, start, stop } = useDaemon();

  const uptimeLabel = uptime !== null ? `${Math.floor(uptime / 1000)}s` : null;

  async function handleStart() {
    try {
      await start();
      toast.success("Daemon started");
    } catch {
      toast.error("Failed to start daemon");
    }
  }

  async function handleStop() {
    try {
      await stop();
      toast.success("Daemon stopped");
    } catch {
      toast.error("Failed to stop daemon");
    }
  }

  return (
    <Panel title="Daemon">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${running ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-slate-300">
            {loading ? "…" : running ? "Running" : "Stopped"}
          </span>
        </div>
        {running && uptimeLabel && (
          <span className="text-[10px] text-slate-500 font-mono">{uptimeLabel}</span>
        )}
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Starting…" : "Start"}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={loading}
            className="flex-1 py-1 text-xs rounded bg-slate-700 hover:bg-red-900/60 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Stopping…" : "Stop"}
          </button>
        )}
      </div>

      {/* Last output — helps debug when start/stop doesn't change status */}
      {lastOutput && (
        <p className="mt-2 text-[10px] text-slate-600 font-mono leading-tight line-clamp-2" title={lastOutput}>
          {lastOutput.trim()}
        </p>
      )}
    </Panel>
  );
}
