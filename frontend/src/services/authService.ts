import { api, unwrap, API_BASE_URL } from "./api";
import type { User } from "@/types";

export interface TokenPayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export const authService = {
  me: () => unwrap<User>(api.get("/auth/me")),

  localLogin: (email: string, full_name?: string) =>
    unwrap<TokenPayload>(api.post("/auth/local", { email, full_name })),

  logout: (refresh_token: string | null) =>
    api.post("/auth/logout", { refresh_token }),

  providers: () =>
    unwrap<{ providers: Record<string, boolean> }>(api.get("/auth/providers")),

  oauthStartUrl: (provider: string) => `${API_BASE_URL}/auth/${provider}`,
};
