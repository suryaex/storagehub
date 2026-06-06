import { api, unwrap } from "./api";
import type { Folder, FolderContents } from "@/types";

export const folderService = {
  rootContents: () => unwrap<FolderContents>(api.get("/folders/root/contents")),

  contents: (folderId: number) =>
    unwrap<FolderContents>(api.get(`/folders/${folderId}/contents`)),

  create: (name: string, parent_id: number | null) =>
    unwrap<Folder>(api.post("/folders", { name, parent_id })),

  rename: (id: number, name: string) =>
    unwrap<Folder>(api.put(`/folders/${id}`, { name })),

  move: (id: number, parent_id: number | null) =>
    unwrap<Folder>(api.post(`/folders/${id}/move`, { parent_id })),

  remove: (id: number) => api.delete(`/folders/${id}`),

  restore: (id: number) => api.post(`/folders/${id}/restore`),
};
