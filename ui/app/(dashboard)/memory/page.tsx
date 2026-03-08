"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Database, Tag, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";
import type { RufloMemoryEntry, RufloPattern } from "@/types/ruflo";
import { useRufloStore } from "@/store/rufloStore";
import { DaemonPanel, MonoText } from "@/components/ruflo";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type NsEntry = { namespace: string; count: number };
type ActiveTab = "entries" | "patterns";

const STATUS_DOT: Record<string, string> = {
  connected: "bg-green-500",
  stale: "bg-amber-500",
  disconnected: "bg-red-500",
};

// ── Memory entries hook ────────────────────────────────────────────────────────

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

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, namespace]);

  return { entries, loading };
}

// ── Patterns hook ──────────────────────────────────────────────────────────────

function usePatterns(filter: string) {
  const [all, setAll] = useState<RufloPattern[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/patterns`)
      .then((r) => r.json())
      .then((data: RufloPattern[]) => setAll(Array.isArray(data) ? data : []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const lc = filter.toLowerCase();
  const patterns = filter
    ? all.filter(
        (p) =>
          p.condition.toLowerCase().includes(lc) ||
          p.action.toLowerCase().includes(lc) ||
          p.name.toLowerCase().includes(lc)
      )
    : all;

  return { patterns, loading };
}

// ── Confidence bar ─────────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  // DB stores 0–1; display as percentage
  const pct = Math.min(Math.round(value * 100), 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  const textColor = pct >= 70 ? "text-green-400" : pct >= 40 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-800 shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono ${textColor}`}>{pct}%</span>
    </div>
  );
}

function confidenceLabel(value: number): { label: string; cls: string } {
  const pct = Math.min(Math.round(value * 100), 100);
  if (pct >= 70) return { label: "High", cls: "text-green-400 bg-green-950/40 border-green-900/40" };
  if (pct >= 40) return { label: "Moderate", cls: "text-amber-400 bg-amber-950/40 border-amber-900/40" };
  return { label: "Low", cls: "text-red-400 bg-red-950/40 border-red-900/40" };
}

// ── Content renderer (for memory entries) ─────────────────────────────────────

function ContentDisplay({ content }: { content: string }) {
  try {
    const parsed = JSON.parse(content);
    return (
      <pre className="text-xs font-mono text-slate-300 bg-slate-900/60 rounded p-2 overflow-auto max-h-64 whitespace-pre-wrap break-all leading-relaxed">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {}

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
          return <p key={i} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-2">{line.slice(4)}</p>;
        if (/^## /.test(line))
          return <p key={i} className="text-sm font-semibold text-slate-200">{line.slice(3)}</p>;
        if (/^# /.test(line))
          return <p key={i} className="text-base font-bold text-slate-100">{line.slice(2)}</p>;
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
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("entries");

  // Entries state
  const [selectedNs, setSelectedNs] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [namespaces, setNamespaces] = useState<NsEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<RufloMemoryEntry | null>(null);

  // Patterns state
  const [patternFilter, setPatternFilter] = useState("");
  const [selectedPattern, setSelectedPattern] = useState<RufloPattern | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rawOpen, setRawOpen] = useState(false);

  const dbStatus = useRufloStore((s) => s.dbStatus);
  const setSelectedAgentId = useRufloStore((s) => s.setSelectedAgentId);

  const { entries, loading: entriesLoading } = useMemoryEntries(query, selectedNs);
  const { patterns, loading: patternsLoading } = usePatterns(patternFilter);

  useEffect(() => {
    fetch(`${API_URL}/memory/namespaces`)
      .then((r) => r.json())
      .then((data: NsEntry[]) => setNamespaces(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Close detail panels when switching tabs
  function switchTab(tab: ActiveTab) {
    setActiveTab(tab);
    setSelectedEntry(null);
    setSelectedPattern(null);
  }

  function toggleRow(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Reset rawOpen when pattern changes
  useEffect(() => { setRawOpen(false); }, [selectedPattern?.id]);

  const totalCount = namespaces.reduce((acc, n) => acc + n.count, 0);

  return (
    <div className="flex h-dvh bg-slate-950 text-slate-200 overflow-hidden">

      {/* ── Left panel (280px) ─────────────────────────────────────────── */}
      <aside className="w-[280px] shrink-0 flex flex-col border-r border-slate-800 bg-slate-950">

        {/* Wordmark + db status */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
          <span className="text-base font-bold tracking-tight text-slate-100">ruflo</span>
          <span
            className={`size-2 rounded-full ${STATUS_DOT[dbStatus] ?? STATUS_DOT.disconnected}`}
            title={dbStatus}
          />
        </div>

        {/* Page nav: Canvas / Memory */}
        <div className="flex gap-1 px-3 py-2 border-b border-slate-800">
          <Link
            href="/canvas"
            className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Canvas
          </Link>
          <span className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium cursor-default">
            Memory
          </span>
        </div>

        {/* View tabs: Entries / Patterns */}
        <div className="flex gap-1 px-3 py-2 border-b border-slate-800">
          <button
            onClick={() => switchTab("entries")}
            className={`flex-1 text-center text-xs px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "entries"
                ? "bg-slate-700 text-slate-100 font-medium"
                : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
            }`}
          >
            Entries
          </button>
          <button
            onClick={() => switchTab("patterns")}
            className={`flex-1 text-center text-xs px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "patterns"
                ? "bg-slate-700 text-slate-100 font-medium"
                : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
            }`}
          >
            Patterns
          </button>
        </div>

        {/* Namespace list — entries tab only */}
        {activeTab === "entries" && (
          <nav className="flex-1 overflow-y-auto px-2 py-1">
            <p className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-slate-600 font-medium">
              Namespaces
            </p>
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
        )}

        {/* Patterns tab: spacer so daemon stays at bottom */}
        {activeTab === "patterns" && <div className="flex-1" />}

        {/* Daemon panel pinned to bottom */}
        <div className="p-3 border-t border-slate-800">
          <DaemonPanel />
        </div>
      </aside>

      {/* ── Main panel ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {activeTab === "entries" ? (
          <>
            {/* Entries: search + status bar */}
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
                {entriesLoading ? "Loading…" : `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
              </span>
              {selectedNs && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300">
                  <Tag className="size-2.5" />
                  {selectedNs}
                  <button onClick={() => setSelectedNs(undefined)} className="hover:text-slate-100 cursor-pointer ml-0.5">
                    <X className="size-2.5" />
                  </button>
                </span>
              )}
            </div>

            {/* Entries table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 z-10">
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-28">Namespace</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-52">Key</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium">Value Preview</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-32">Agent</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-24">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isSelected = selectedEntry?.id === entry.id;
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedEntry(isSelected ? null : entry)}
                        className={`border-b border-slate-900 cursor-pointer transition-colors ${isSelected ? "bg-slate-800/80" : "hover:bg-slate-900/60"}`}
                      >
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                            {entry.namespace}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-300">{truncate(entry.key, 44)}</td>
                        <td className="px-4 py-2.5 text-slate-500">{truncate(entry.content.replace(/\n/g, " "), 90)}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500 text-[10px]">
                          {entry.ownerId ? truncate(entry.ownerId, 14) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 text-[10px] font-mono whitespace-nowrap">
                          {fmtDateShort(entry.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                  {!entriesLoading && entries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-slate-600 text-xs">
                        {query ? "No results match your search" : "No memory entries"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Patterns: filter + status bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter patterns…"
                  value={patternFilter}
                  onChange={(e) => setPatternFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-8 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
                {patternFilter && (
                  <button
                    onClick={() => setPatternFilter("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {patternsLoading ? "Loading…" : `${patterns.length} pattern${patterns.length === 1 ? "" : "s"}`}
              </span>
            </div>

            {/* Patterns table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 z-10">
                  <tr className="border-b border-slate-800">
                    <th className="w-6 px-2 py-2.5" />
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium">Pattern</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-36">Confidence</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-20">Access</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-500 font-medium w-28">Last Accessed</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((p) => {
                    const isSelected = selectedPattern?.id === p.id;
                    const isExpanded = expandedRows.has(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPattern(isSelected ? null : p)}
                        className={`border-b border-slate-900 cursor-pointer transition-colors align-top ${isSelected ? "bg-slate-800/80" : "hover:bg-slate-900/60"}`}
                      >
                        {/* Expand toggle */}
                        <td className="px-2 py-3 text-slate-600">
                          <button
                            onClick={(e) => toggleRow(p.id, e)}
                            className="hover:text-slate-300 transition-colors cursor-pointer"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded
                              ? <ChevronDown className="size-3" />
                              : <ChevronRight className="size-3" />
                            }
                          </button>
                        </td>

                        {/* Pattern text */}
                        <td className="px-4 py-3">
                          {isExpanded ? (
                            <div className="space-y-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-slate-600 mb-0.5">Condition</p>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{p.condition}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-slate-600 mb-0.5">Action</p>
                                <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">{p.action}</p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-slate-200 font-medium leading-snug">
                                {truncate(p.condition, 80)}
                              </p>
                              <p className="text-slate-500 mt-0.5 leading-snug">
                                {truncate(p.action, 80)}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Confidence */}
                        <td className="px-4 py-3">
                          <ConfidenceBar value={p.confidence} />
                        </td>

                        {/* Access count */}
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {p.successCount + p.failureCount}
                        </td>

                        {/* Last accessed */}
                        <td className="px-4 py-3 text-slate-600 text-[10px] font-mono whitespace-nowrap">
                          {p.lastMatchedAt ? fmtDateShort(p.lastMatchedAt) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {!patternsLoading && patterns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-slate-600 text-xs">
                        {patternFilter ? "No patterns match your filter" : "No patterns found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* ── Right detail panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {activeTab === "entries" && selectedEntry && (
          <motion.aside
            key="entry-detail"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[320px] shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto"
          >
            <div className="p-4 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Key</p>
                  <p className="font-mono text-sm text-slate-100 break-all leading-relaxed">{selectedEntry.key}</p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer mt-0.5"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">{selectedEntry.namespace}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{selectedEntry.type}</span>
                {selectedEntry.embedding !== null && (
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/40 text-[10px] text-blue-400">
                    Has embedding
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Value</p>
                <ContentDisplay content={selectedEntry.content} />
              </div>
              {selectedEntry.ownerId && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Linked Agent</p>
                  <Link
                    href="/canvas"
                    onClick={() => setSelectedAgentId(selectedEntry.ownerId!)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors group"
                  >
                    <span className="flex-1 font-mono text-xs text-slate-300 truncate">{selectedEntry.ownerId}</span>
                    <ExternalLink className="size-3 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
                  </Link>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Timestamps</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-600">Created</span>
                  <span className="text-[10px] font-mono text-slate-400">{fmtDate(selectedEntry.createdAt)}</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}

        {activeTab === "patterns" && selectedPattern && (
          <motion.aside
            key="pattern-detail"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[320px] shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto"
          >
            <div className="p-4 flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pattern</p>
                  <p className="text-sm text-slate-100 font-medium leading-snug break-words">
                    {selectedPattern.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer mt-0.5"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                  {selectedPattern.patternType}
                </span>
                {(() => {
                  const { label, cls } = confidenceLabel(selectedPattern.confidence);
                  return (
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${cls}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>

              {/* Confidence bar */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Confidence</p>
                <ConfidenceBar value={selectedPattern.confidence} />
              </div>

              {/* Condition */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Condition</p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                  {selectedPattern.condition}
                </p>
              </div>

              {/* Action */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Action</p>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap break-words">
                  {selectedPattern.action}
                </p>
              </div>

              {/* Description */}
              {selectedPattern.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Description</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{selectedPattern.description}</p>
                </div>
              )}

              {/* Stats */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Stats</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-600">Successes</span>
                    <span className="text-[10px] font-mono text-green-400">{selectedPattern.successCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-600">Failures</span>
                    <span className="text-[10px] font-mono text-red-400">{selectedPattern.failureCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-600">Last matched</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {selectedPattern.lastMatchedAt ? fmtDate(selectedPattern.lastMatchedAt) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw row (collapsible) */}
              <div>
                <button
                  onClick={() => setRawOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors cursor-pointer w-full"
                >
                  {rawOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  Raw
                </button>
                {rawOpen && (
                  <pre className="mt-2 p-2 rounded bg-slate-900/60 overflow-auto max-h-64 text-[10px] leading-relaxed whitespace-pre-wrap break-all">
                    <MonoText>{JSON.stringify(selectedPattern, null, 2)}</MonoText>
                  </pre>
                )}
              </div>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
