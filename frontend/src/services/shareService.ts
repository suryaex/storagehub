import { api, unwrap } from "./api";
import type { Share } from "@/types";

export interface CreateShareInput {
  file_id?: number | null;
  folder_id?: number | null;
  password?: string | null;
  expires_at?: string | null;
  max_downloads?: number | null;
}

export const shareService = {
  list: () => unwrap<Share[]>(api.get("/shares")),

  create: (input: CreateShareInput) => unwrap<Share>(api.post("/shares", input)),

  detail: (id: number) => unwrap<Share>(api.get(`/shares/${id}`)),

  revoke: (id: number) => api.delete(`/shares/${id}`),

  publicInfo: (token: string) =>
    unwrap<{
      type: string;
      name: string;
      size_bytes?: number;
      owner?: string;
      requires_password: boolean;
    }>(api.get(`/share/${token}`)),

  verifyPassword: (token: string, password: string) =>
    unwrap<{ valid: boolean }>(api.post(`/share/${token}/password`, { password })),
};
