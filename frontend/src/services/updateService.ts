import { api } from "./api";

export interface UpdateCheck {
  current: string;
  latest: string | null;
  update_available: boolean;
  notes?: string;
  url?: string;
  published_at?: string;
  checked_at: number;
  error?: string;
}

export interface UpdateStatus {
  state:
    | "idle"
    | "queued"
    | "updating"
    | "rebuilding"
    | "restarting"
    | "done"
    | "up-to-date"
    | "error";
  message?: string;
  at?: number;
}

// These endpoints return plain JSON (not the success() envelope), so read .data.
export const updateService = {
  check: () => api.get<UpdateCheck>("/update/check").then((r) => r.data),
  status: () => api.get<UpdateStatus>("/update/status").then((r) => r.data),
  apply: () => api.post<UpdateStatus>("/update/apply").then((r) => r.data),
};
