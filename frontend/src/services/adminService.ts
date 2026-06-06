import { api, unwrap } from "./api";
import type { Paginated, User } from "@/types";

export interface AdminOverview {
  total_users: number;
  active_users: number;
  total_files: number;
  total_folders: number;
  total_storage_bytes: number;
  total_shares: number;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  ip_address?: string | null;
  created_at: string;
}

export const adminService = {
  overview: () => unwrap<AdminOverview>(api.get("/admin/overview")),

  users: (page = 1, limit = 20, search?: string) =>
    unwrap<Paginated<User>>(api.get("/admin/users", { params: { page, limit, search } })),

  updateQuota: (userId: number, quota_bytes: number) =>
    unwrap<User>(api.patch(`/admin/users/${userId}/quota`, { quota_bytes })),

  updateUser: (userId: number, payload: Partial<User>) =>
    unwrap<User>(api.patch(`/users/${userId}`, payload)),

  disableUser: (userId: number) => api.post(`/users/${userId}/disable`),
  enableUser: (userId: number) => api.post(`/users/${userId}/enable`),

  activityLogs: (page = 1, limit = 30) =>
    unwrap<Paginated<ActivityLog>>(api.get("/admin/activity-logs", { params: { page, limit } })),

  getSettings: () => unwrap<Record<string, string>>(api.get("/admin/settings")),

  updateSettings: (payload: Record<string, number>) =>
    unwrap<Record<string, string>>(api.patch("/admin/settings", payload)),
};
