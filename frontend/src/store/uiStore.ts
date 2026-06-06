import { create } from "zustand";
import type { Theme, ViewMode } from "@/types";

interface UIState {
  theme: Theme;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  searchOpen: boolean;
  uploadPanelOpen: boolean;
  setTheme: (theme: Theme) => void;
  applyTheme: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setUploadPanelOpen: (open: boolean) => void;
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: (localStorage.getItem("sh_theme") as Theme) || "system",
  viewMode: (localStorage.getItem("sh_view") as ViewMode) || "grid",
  sidebarOpen: false,
  searchOpen: false,
  uploadPanelOpen: false,

  setTheme: (theme) => {
    localStorage.setItem("sh_theme", theme);
    set({ theme });
    get().applyTheme();
  },

  applyTheme: () => {
    const resolved = resolveTheme(get().theme);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.classList.toggle("light", resolved === "light");
  },

  setViewMode: (mode) => {
    localStorage.setItem("sh_view", mode);
    set({ viewMode: mode });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setUploadPanelOpen: (uploadPanelOpen) => set({ uploadPanelOpen }),
}));
