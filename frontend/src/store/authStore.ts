import { create } from "zustand";
import type { User } from "@/types";
import { authService } from "@/services/authService";
import { tokenStore } from "@/services/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setTokens: (access: string, refresh: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  setTokens: async (access, refresh) => {
    tokenStore.set(access, refresh);
    await get().loadUser();
  },

  loadUser: async () => {
    if (!tokenStore.access) {
      set({ initialized: true, user: null });
      return;
    }
    set({ loading: true });
    try {
      const user = await authService.me();
      set({ user, loading: false, initialized: true });
    } catch {
      tokenStore.clear();
      set({ user: null, loading: false, initialized: true });
    }
  },

  logout: async () => {
    try {
      await authService.logout(tokenStore.refresh);
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    set({ user: null });
  },

  isAuthenticated: () => !!get().user,
}));
