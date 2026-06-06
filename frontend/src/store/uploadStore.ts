import { create } from "zustand";
import { uploadService, CHUNK_THRESHOLD } from "@/services/uploadService";
import { fileService } from "@/services/fileService";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "queued" | "uploading" | "completed" | "failed" | "cancelled";
  error?: string;
}

interface UploadState {
  items: UploadItem[];
  cancelled: Set<string>;
  enqueue: (folderId: number, files: File[], onDone?: () => void) => void;
  cancel: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  items: [],
  cancelled: new Set(),

  enqueue: (folderId, files, onDone) => {
    const newItems: UploadItem[] = files.map((f) => ({
      id: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "queued",
    }));
    set((s) => ({ items: [...newItems, ...s.items] }));

    files.forEach((file, idx) => {
      const item = newItems[idx];
      const update = (patch: Partial<UploadItem>) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === item.id ? { ...i, ...patch } : i)),
        }));

      const run = async () => {
        update({ status: "uploading" });
        try {
          if (file.size > CHUNK_THRESHOLD) {
            await uploadService.chunkedUpload(
              folderId,
              file,
              (pct) => update({ progress: pct }),
              () => !get().cancelled.has(item.id),
            );
          } else {
            await fileService.simpleUpload(folderId, file, (pct) => update({ progress: pct }));
          }
          update({ status: "completed", progress: 100 });
          onDone?.();
        } catch (e) {
          if (get().cancelled.has(item.id)) {
            update({ status: "cancelled" });
          } else {
            update({ status: "failed", error: (e as Error).message });
          }
        }
      };
      run();
    });
  },

  cancel: (id) =>
    set((s) => {
      const cancelled = new Set(s.cancelled);
      cancelled.add(id);
      return { cancelled };
    }),

  clearCompleted: () =>
    set((s) => ({ items: s.items.filter((i) => i.status !== "completed") })),
}));
