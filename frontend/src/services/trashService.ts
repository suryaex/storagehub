import { api, unwrap } from "./api";
import type { TrashItem } from "@/types";

export const trashService = {
  list: () => unwrap<TrashItem[]>(api.get("/trash")),
  restore: (id: number) => api.post(`/trash/${id}/restore`),
  remove: (id: number) => api.delete(`/trash/${id}/permanent`),
};
