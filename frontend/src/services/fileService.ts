import { api, unwrap, tokenStore, API_BASE_URL } from "./api";
import type { FileItem } from "@/types";

export const fileService = {
  detail: (id: number) => unwrap<FileItem>(api.get(`/files/${id}`)),

  simpleUpload: (folderId: number, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("folder_id", String(folderId));
    form.append("file", file);
    return unwrap<FileItem>(
      api.post("/files/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }),
    );
  },

  rename: (id: number, filename: string) =>
    unwrap<FileItem>(api.put(`/files/${id}`, { filename })),

  move: (id: number, folder_id: number) =>
    unwrap<FileItem>(api.post(`/files/${id}/move`, { folder_id })),

  copy: (id: number, folder_id: number) =>
    unwrap<FileItem>(api.post(`/files/${id}/copy`, { folder_id })),

  remove: (id: number) => api.delete(`/files/${id}`),

  restore: (id: number) => api.post(`/files/${id}/restore`),

  downloadUrl: (id: number) =>
    `${API_BASE_URL}/files/${id}/download?token=${tokenStore.access ?? ""}`,

  download: async (id: number, filename: string) => {
    const resp = await api.get(`/files/${id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(resp.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
