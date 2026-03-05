"use client";

import { create } from "zustand";
import type { RufloAgent, RufloSwarm } from "@/types/ruflo";

type DbStatus = "connected" | "stale" | "disconnected";

interface RufloState {
  swarms: RufloSwarm[];
  agents: RufloAgent[];
  activeSwarmId: string | null;
  selectedAgentId: string | null;
  dbStatus: DbStatus;
  lastDbUpdate: string | null;

  setSwarms: (swarms: RufloSwarm[]) => void;
  setAgents: (agents: RufloAgent[]) => void;
  setActiveSwarmId: (id: string | null) => void;
  setSelectedAgentId: (id: string | null) => void;
  setDbStatus: (status: DbStatus) => void;
  setLastDbUpdate: (ts: string | null) => void;
}

export const useRufloStore = create<RufloState>()((set) => ({
  swarms: [],
  agents: [],
  activeSwarmId: null,
  selectedAgentId: null,
  dbStatus: "disconnected",
  lastDbUpdate: null,

  setSwarms: (swarms) => set({ swarms }),
  setAgents: (agents) => set({ agents }),
  setActiveSwarmId: (id) => set({ activeSwarmId: id }),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  setDbStatus: (status) => set({ dbStatus: status }),
  setLastDbUpdate: (ts) => set({ lastDbUpdate: ts }),
}));
