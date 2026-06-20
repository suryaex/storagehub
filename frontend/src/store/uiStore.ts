import { create } from "zustand";
import type { Language, Theme, ViewMode } from "@/types";
import { DEFAULT_LANG } from "@/i18n/locales";
import { LANGUAGES, RTL_LANGS } from "@/i18n/languages";

const KNOWN_LANGS = new Set(LANGUAGES.map((l) => l.code));

interface UIState {
  theme: Theme;
  viewMode: ViewMode;
  lang: Language;
  sidebarOpen: boolean;
  searchOpen: boolean;
  uploadPanelOpen: boolean;
  setTheme: (theme: Theme) => void;
  applyTheme: () => void;
  setViewMode: (mode: ViewMode) => void;
  setLang: (lang: Language) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setUploadPanelOpen: (open: boolean) => void;
}

function detectLang(): Language {
  const saved = localStorage.getItem("sh_lang");
  if (saved && KNOWN_LANGS.has(saved)) return saved;
  const browser = (navigator.language || DEFAULT_LANG).slice(0, 2);
  return KNOWN_LANGS.has(browser) ? browser : DEFAULT_LANG;
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
  lang: detectLang(),
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

  setLang: (lang) => {
    localStorage.setItem("sh_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
    set({ lang });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setUploadPanelOpen: (uploadPanelOpen) => set({ uploadPanelOpen }),
}));
