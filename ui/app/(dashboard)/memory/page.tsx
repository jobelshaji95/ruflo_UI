"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Database, Tag, ExternalLink } from "lucide-react";
import type { RufloMemoryEntry } from "@/types/ruflo";
import { useRufloStore } from "@/store/rufloStore";
import { DaemonPanel } from "@/components/ruflo";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type NsEntry = { namespace: string; count: number };

const STATUS_DOT: Record<string, string> = {
  connected: "bg-green-500",
  stale: "bg-amber-500",
  disconnected: "bg-red-500",
};

// ── Data hook ─────────────────────────────────────────────────────────────────

function useMemoryEntries(query: string, namespace: string | undefined) {
  const [entries, setEntries] = useState<RufloMemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    const delay = query ? 300 : 0;
    const timer = setTimeout(() => {
      const url = query
        ? `${API_URL}/memory/search?q=${encodeURIComponent(query)}${namespace ? `&ns=${encodeURIComponent(namespace)}` : ""}`
        : `${API_URL}/memory${namespace ? `?ns=${encodeURIComponent(namespace)}` : ""}`;

      fetch(url)
        .then((r) => r.json())
        .then((data: RufloMemoryEntry[]) => {
          if (!cancelled) setEntries(Array.isArray(data) ? data : []);
        })
        .catch(() => { if (!cancelled) setEntries([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, namespace]);

  return { entries, loading };
}

// ── Content renderer ──────────────────────────────────────────────────────────

function ContentDisplay({ content }: { content: string }) {
  // Try JSON first
  try {
    const parsed = JSON.parse(content);
    return (
      <pre className="text-xs font-mono text-slate-300 bg-slate-900/60 rounded p-2 overflow-auto max-h-64 whitespace-pre-wrap break-all leading-relaxed">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {}

  // Basic markdown detection
  if (/^#{1,3}\s|^\s*[-*]\s|\*\*|`/.test(content)) {
    return <MarkdownText text={content} />;
  }

  return (
    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
      {content}
    </p>
  );
}

function MarkdownText({ text }: { text: string }) {
  return (
    <div className="text-sm text-slate-300 leading-relaxed space-y-1">
      {text.split("\n").map((line, i) => {
        if (/^### /.test(line))
          return (
            <p key={i} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-2">
              {line.slice(4)}
            </p>
          );
        if (/^## /.test(line))
          return (
            <p key={i} className="text-sm font-semibold text-slate-200">
              {line.slice(3)}
            </p>
          );
        if (/^# /.test(line))
          return (
            <p key={i} className="text-base font-bold text-slate-100">
              {line.slice(2)}
            </p>
          );
        if (/^\s*[-*] /.test(line))
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-slate-500 mt-0.5 shrink-0">•</span>
              <span>{line.replace(/^\s*[-*] /, "")}</span>
            </div>
          );
        if (line.trim() === "") return <div key={i} className="h-1.5" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MemoryPage() {
  const [selectedNs, setSelectedNs] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [namespaces, setNamespaces] = useState<NsEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<RufloMemoryEntry | null>(null);

  const dbStatus = useRufloStore((s) => s.dbStatus);
  const setSelectedAgentId = useRufloStore((s) => s.setSelectedAgentId);

  const { entries, loading } = useMemoryEntries(query, selectedNs);

  // Load namespace list on mount
  useEffect(() => {
    fetch(`${API_URL}/memory/namespaces`)
      .then((r) => r.json())
      .then((data: NsEntry[]) => setNamespaces(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const totalCount = namespaces.reduce((acc, n) => acc + n.count, 0);

  return (
    <div className="flex h-dvh bg-slate-950 text-slate-200 overflow-hidden">

      {/* ── Left: Namespace list (280px) ───────────────────────────────── */}
      <aside className="w-[280px] shrink-0 flex flex-col border-r border-slate-800 bg-slate-950">

        {/* Wordmark + db status dot */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
          <span className="text-base font-bold tracking-tight text-slate-100">ruflo</span>
          <span
            className={`size-2 rounded-full ${STATUS_DOT[dbStatus] ?? STATUS_DOT.disconnected}`}
            title={dbStatus}
          />
        </div>

        {/* Page nav */}
        <div className="flex gap-1 px-3 py-2 border-b border-slate-800">
          <Link
            href="/canvas"
            className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Canvas
          </Link>
          <span className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium">
            Memory
          </span>
        </div>

        {/* Namespace list */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          <p className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-slate-600 font-medium">
            Namespaces
          </p>

          {/* "All" row */}
          <button
            onClick={() => setSelectedNs(undefined)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer mb-0.5 ${
              selectedNs === undefined
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <Database className="size-3 shrink-0" />
              All
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 text-[10px] font-mono">
              {totalCount}
            </span>
          </button>

          {/* Per-namespace rows */}
          {namespaces.map((ns) => (
            <button
              key={ns.namespace}
              onClick={() => setSelectedNs(ns.namespace)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer mb-0.5 ${
                selectedNs === ns.namespace
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Tag className="size-3 shrink-0" />
                <span className="truncate">{ns.namespace}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 text-[10px] font-mono shrink-0 ml-1">
                {ns.count}
              </span>
            </button>
          ))}

          {namespaces.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-slate-600">No namespaces found</p>
          )}
        </nav>

        {/* Daemon panel pinned to bottom */}
        <div className="p-3 border-t border-slate-800">
          <DaemonPanel />
        </div>
      </aside>

      {/* ── Main: entries table ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Search + status bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search keys and values…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-8 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500 shrink-0">
            {loading ? "Loading…" : `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
          </span>

          {selectedNs && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300">
              <Tag className="size-2.5" />
              {selectedNs}
              <button
                onClick={() => setSelectedNs(undefined)}
                className="hover:text-slate-100 cursor-pointer ml-0.5"
              >
                <X className="size-2.5" />
              </button>
            </span>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-28">
                  Namespace
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-52">
                  Key
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium">
                  Value Preview
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-32">
                  Agent
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-24">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(isSelected ? null : entry)}
                    className={`border-b border-slate-900 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-slate-800/80"
                        : "hover:bg-slate-900/60"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {entry.namespace}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-300">
                      {truncate(entry.key, 44)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {truncate(entry.content.replace(/\n/g, " "), 90)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-500 text-[10px]">
                      {entry.ownerId ? truncate(entry.ownerId, 14) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-[10px] font-mono whitespace-nowrap">
                      {fmtDateShort(entry.createdAt)}
                    </td>
                  </tr>
                );
              })}

              {!loading && entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-16 text-center text-slate-600 text-xs"
                  >
                    {query ? "No results match your search" : "No memory entries"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Right: Entry detail (slides in, 320px) ─────────────────────── */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.aside
            key="detail"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[320px] shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto"
          >
            <div className="p-4 flex flex-col gap-5">

              {/* Header: key + close */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Key</p>
                  <p className="font-mono text-sm text-slate-100 break-all leading-relaxed">
                    {selectedEntry.key}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer mt-0.5"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Badges: namespace, type, embedding */}
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                  {selectedEntry.namespace}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                  {selectedEntry.type}
                </span>
                {selectedEntry.embedding !== null && (
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/40 text-[10px] text-blue-400">
                    Has embedding
                  </span>
                )}
              </div>

              {/* Value */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Value</p>
                <ContentDisplay content={selectedEntry.content} />
              </div>

              {/* Linked agent */}
              {selectedEntry.ownerId && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                    Linked Agent
                  </p>
                  <Link
                    href="/canvas"
                    onClick={() => setSelectedAgentId(selectedEntry.ownerId!)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors group"
                  >
                    <span className="flex-1 font-mono text-xs text-slate-300 truncate">
                      {selectedEntry.ownerId}
                    </span>
                    <ExternalLink className="size-3 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
                  </Link>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                  Timestamps
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600">Created</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {fmtDate(selectedEntry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
