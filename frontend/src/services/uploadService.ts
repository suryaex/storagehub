import { api, unwrap } from "./api";
import type { FileItem } from "@/types";

interface SessionInfo {
  session_id: number;
  status: string;
  total_chunks: number;
  uploaded_chunks: number;
  chunk_size_bytes: number;
}

const DEFAULT_CHUNK = 8 * 1024 * 1024; // 8 MiB

export const uploadService = {
  createSession: (folderId: number, file: File, chunkSize = DEFAULT_CHUNK) =>
    unwrap<SessionInfo>(
      api.post("/uploads/sessions", {
        folder_id: folderId,
        file_name: file.name,
        original_filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        chunk_size_bytes: chunkSize,
      }),
    ),

  uploadChunk: (sessionId: number, index: number, blob: Blob) =>
    api.post(`/uploads/sessions/${sessionId}/chunks/${index}`, blob, {
      headers: { "Content-Type": "application/octet-stream" },
    }),

  resume: (sessionId: number) =>
    unwrap<{ missing_chunks: number[] }>(api.post(`/uploads/sessions/${sessionId}/resume`)),

  complete: (sessionId: number) =>
    unwrap<FileItem>(api.post(`/uploads/sessions/${sessionId}/complete`)),

  abort: (sessionId: number) => api.post(`/uploads/sessions/${sessionId}/abort`),

  /** Full chunked upload with progress + resume support. */
  async chunkedUpload(
    folderId: number,
    file: File,
    onProgress?: (pct: number) => void,
    shouldContinue?: () => boolean,
  ): Promise<FileItem> {
    const session = await this.createSession(folderId, file);
    const chunkSize = session.chunk_size_bytes || DEFAULT_CHUNK;
    const total = session.total_chunks;
    let uploaded = 0;
    for (let i = 0; i < total; i++) {
      if (shouldContinue && !shouldContinue()) {
        await this.abort(session.session_id).catch(() => undefined);
        throw new Error("Upload cancelled");
      }
      const start = i * chunkSize;
      const blob = file.slice(start, Math.min(start + chunkSize, file.size));
      await this.uploadChunk(session.session_id, i, blob);
      uploaded++;
      onProgress?.(Math.round((uploaded / total) * 100));
    }
    return this.complete(session.session_id);
  },
};

export const CHUNK_THRESHOLD = 16 * 1024 * 1024; // use chunked upload above 16 MiB
