"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useDaemon } from "@/hooks/useDaemon";
import { useRufloStore } from "@/store/rufloStore";
import type { RufloPattern } from "@/types/ruflo";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "< 1m ago";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function parseFromOutput(output: string | null, regex: RegExp): string | null {
  if (!output) return null;
  const m = output.match(regex);
  return m ? m[1] : null;
}

export function DaemonPanel() {
  const [expanded, setExpanded] = useState(false);
  const [patterns, setPatterns] = useState<RufloPattern[]>([]);

  const { running, uptime, lastOutput, loading, start, stop, restart } = useDaemon();
  const activeSwarmId = useRufloStore((s) => s.activeSwarmId);
  const swarms = useRufloStore((s) => s.swarms);

  // Fetch patterns once on mount for last learning loop
  useEffect(() => {
    fetch(`${API_URL}/patterns`)
      .then((r) => r.json())
      .then((data: RufloPattern[]) => setPatterns(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Derived: last learning loop
  const lastPattern = patterns
    .filter((p) => p.lastMatchedAt)
    .sort((a, b) => new Date(b.lastMatchedAt!).getTime() - new Date(a.lastMatchedAt!).getTime())[0];
  const lastLoopLabel = lastPattern?.lastMatchedAt ? formatRelative(lastPattern.lastMatchedAt) : null;

  // Parsed from daemon output
  const pid = parseFromOutput(lastOutput, /pid[:\s]+(\d+)/i);
  const workerCount = parseFromOutput(lastOutput, /workers?[:\s]+(\d+)/i);

  // Terminal: last 20 non-empty lines
  const terminalLines = (lastOutput ?? "")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .slice(-20);

  // Amber warning: daemon stopped + an active swarm is selected
  const activeSwarm = swarms.find((s) => s.id === activeSwarmId);
  const showWarning =
    !running && activeSwarmId !== null && (!activeSwarm || activeSwarm.status === "running");

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

  async function handleRestart() {
    try {
      await restart();
      toast.success("Daemon restarted");
    } catch {
      toast.error("Failed to restart daemon");
    }
  }

  const containerCls = [
    "rounded-lg overflow-hidden transition-colors",
    !running
      ? "bg-red-950/25 border border-red-900/30"
      : "bg-slate-900/60 border border-slate-800",
  ].join(" ");

  return (
    <div className={containerCls}>
      {/* ── Header row (always visible, click to expand) ─────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Status dot */}
        <span
          className={`size-2 shrink-0 rounded-full ${
            running ? "bg-green-500" : "bg-red-500 animate-pulse"
          }`}
        />

        {/* Label */}
        <span className="flex-1 text-xs font-medium text-slate-300">
          {loading ? "…" : running ? "Daemon" : "Daemon"}
        </span>

        {/* Collapsed: start/stop button */}
        {!expanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              running ? handleStop() : handleStart();
            }}
            disabled={loading}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer disabled:opacity-50 ${
              running
                ? "bg-slate-700 hover:bg-red-900/60 text-slate-200"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            }`}
          >
            {loading ? "…" : running ? "Stop" : "Start"}
          </button>
        )}

        {/* Expand/collapse chevron */}
        <span className="text-slate-500 shrink-0">
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </span>
      </div>

      {/* ── Amber warning (collapsed) ─────────────────────────────────── */}
      {!expanded && showWarning && (
        <p className="px-3 pb-2 text-[10px] text-amber-400 leading-tight">
          ⚠ Daemon stopped — background learning disabled.
        </p>
      )}

      {/* ── Expanded content ──────────────────────────────────────────── */}
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <div>
              <p className="text-slate-600 uppercase tracking-wide">PID</p>
              <p className="font-mono text-slate-300">{pid ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-600 uppercase tracking-wide">Uptime</p>
              <p className="font-mono text-slate-300">
                {uptime !== null ? formatUptime(uptime) : "—"}
              </p>
            </div>
            <div>
              <p className="text-slate-600 uppercase tracking-wide">Workers</p>
              <p className="font-mono text-slate-300">{workerCount ?? "—"}</p>
            </div>
          </div>

          {/* Last learning loop */}
          <div className="text-[10px]">
            <span className="text-slate-600 uppercase tracking-wide">Last loop </span>
            <span className="font-mono text-slate-300">{lastLoopLabel ?? "—"}</span>
          </div>

          {/* Terminal output */}
          {terminalLines.length > 0 && (
            <pre className="max-h-32 overflow-y-auto rounded bg-slate-950/60 px-2 py-1.5 text-[10px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap break-all">
              {terminalLines.join("\n")}
            </pre>
          )}

          {/* Amber warning */}
          {showWarning && (
            <p className="text-[10px] text-amber-400 leading-tight">
              ⚠ Daemon stopped — background learning disabled.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={running ? handleStop : handleStart}
              disabled={loading}
              className={`flex-1 py-1 text-xs rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                running
                  ? "bg-slate-700 hover:bg-red-900/60 text-slate-200"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              {loading ? (running ? "Stopping…" : "Starting…") : running ? "Stop" : "Start"}
            </button>
            <button
              onClick={handleRestart}
              disabled={loading}
              className="flex-1 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "…" : "Restart"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
