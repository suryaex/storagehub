export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: "admin" | "user";
  status: "active" | "disabled" | "pending";
  quota_bytes: number;
  used_bytes: number;
  last_login_at?: string | null;
  created_at?: string | null;
}

export interface Folder {
  id: number;
  parent_id: number | null;
  owner_id: number;
  name: string;
  path: string;
  is_shared: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FileItem {
  id: number;
  folder_id: number;
  owner_id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  extension?: string | null;
  size_bytes: number;
  checksum_sha256: string;
  version: number;
  is_shared: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FolderContents {
  folder: Folder;
  subfolders: Folder[];
  files: FileItem[];
}

export interface Share {
  id: number;
  file_id: number | null;
  folder_id: number | null;
  created_by: number;
  token: string;
  has_password: boolean;
  expires_at?: string | null;
  max_downloads?: number | null;
  download_count: number;
  is_active: boolean;
  share_url?: string;
  created_at?: string;
}

export interface TrashItem {
  id: number;
  item_type: "file" | "folder";
  item_id: number;
  name?: string | null;
  original_path: string;
  deleted_at: string;
  expires_at?: string | null;
}

export interface DashboardSummary {
  storage_usage: { used_bytes: number; quota_bytes: number };
  recent_files: FileItem[];
  recent_uploads: FileItem[];
  shared_files: Share[];
  file_count: number;
  folder_count: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface SearchResults {
  files: FileItem[];
  folders: Folder[];
  shares: Share[];
}

export type ViewMode = "grid" | "list" | "column";
export type Theme = "light" | "dark" | "system";
// Kode bahasa BCP-47 ringkas (mis. "en", "id", "zh"). Daftar lengkap ada di
// src/i18n/languages.ts; bahasa tanpa kamus jatuh ke Inggris.
export type Language = string;
