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

export interface RaidArray {
  name: string;
  state: string;
  level: string;
  members: string[];
}

export interface HostStorage {
  platform: string;
  storage_root: string;
  device: string | null;
  mount: string | null;
  filesystem: string | null;
  media: { type: string; rotational: number | null; model: string | null; block: string | null };
  usage: { total_bytes: number; used_bytes: number; free_bytes: number };
  raid: RaidArray[];
}

export interface StorageNode {
  id: number;
  name: string;
  node_type: string;
  location: string;
  storage_type: string;
  raid_level: string;
  raid_devices: string | null;
  status: string;
  capacity_bytes: number;
  used_bytes: number;
  is_primary: boolean;
}

export interface CloudTarget {
  id: number;
  name: string;
  provider: string;
  endpoint: string | null;
  bucket: string | null;
  access_key: string | null;
  sync_mode: string;
  enabled: boolean;
  status: string;
  last_sync_at: string | null;
}

export interface NodeInput {
  name: string;
  node_type: string;
  location: string;
  storage_type: string;
  raid_level: string;
}

export interface CloudInput {
  name: string;
  provider: string;
  endpoint?: string;
  bucket?: string;
  access_key?: string;
  secret_key?: string;
  sync_mode: string;
  enabled: boolean;
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

  // ── storage / nodes / cloud ──
  storageOverview: () =>
    unwrap<{ host: HostStorage; nodes: StorageNode[] }>(api.get("/admin/storage")),

  listNodes: () => unwrap<StorageNode[]>(api.get("/admin/nodes")),
  createNode: (p: NodeInput) => unwrap<StorageNode>(api.post("/admin/nodes", p)),
  updateNode: (id: number, p: Partial<NodeInput & { status: string }>) =>
    unwrap<StorageNode>(api.patch(`/admin/nodes/${id}`, p)),
  setPrimaryNode: (id: number) => api.post(`/admin/nodes/${id}/primary`),
  deleteNode: (id: number) => api.delete(`/admin/nodes/${id}`),
  configureRaid: (id: number, p: { raid_level: string; devices: string[] }) =>
    unwrap<{
      node: StorageNode;
      raid_level: string;
      devices: string[];
      mdadm_command: string;
      instructions: string;
    }>(api.post(`/admin/nodes/${id}/raid`, p)),

  listClouds: () => unwrap<CloudTarget[]>(api.get("/admin/cloud-targets")),
  createCloud: (p: CloudInput) => unwrap<CloudTarget>(api.post("/admin/cloud-targets", p)),
  updateCloud: (id: number, p: Partial<CloudInput>) =>
    unwrap<CloudTarget>(api.patch(`/admin/cloud-targets/${id}`, p)),
  deleteCloud: (id: number) => api.delete(`/admin/cloud-targets/${id}`),
};
