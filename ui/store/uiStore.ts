"use client";

import { create } from "zustand";

type SelectedView = "canvas" | "trace" | "logs" | "memory";

interface UiState {
  sidebarOpen: boolean;
  selectedView: SelectedView;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSelectedView: (view: SelectedView) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: true,
  selectedView: "canvas",

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedView: (view) => set({ selectedView: view }),
}));
