import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { fileService } from "@/services/fileService";
import { apiErrorMessage } from "@/services/api";
import type { FileItem } from "@/types";
import { useTranslation } from "@/i18n";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
const VIDEO_EXT = new Set(["mp4", "webm", "ogg", "ogv"]);
const TEXT_EXT = new Set(["txt", "md", "log", "csv", "json", "yml", "yaml", "ini", "conf"]);

type Kind = "image" | "pdf" | "video" | "text" | "unsupported";

function kindFor(file: FileItem): Kind {
  const ext = (file.extension || "").toLowerCase();
  if (IMAGE_EXT.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (VIDEO_EXT.has(ext)) return "video";
  if (TEXT_EXT.has(ext)) return "text";
  return "unsupported";
}

// The extension check above only decides which viewer to *try* — the server
// independently sniffs the real bytes and is the actual security gate. Any
// mismatch just surfaces as the error state below.
export function PreviewModal({ file, onClose }: { file: FileItem | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kind = file ? kindFor(file) : "unsupported";

  useEffect(() => {
    setUrl(null);
    setText(null);
    setError(null);
    if (!file || kind === "unsupported") return;
    let cancelled = false;

    if (kind === "text") {
      fileService
        .previewText(file.id)
        .then((resp) => {
          if (!cancelled) setText(resp.data);
        })
        .catch(() => {
          if (!cancelled) setError(t("files.previewFailed"));
        });
    } else {
      fileService
        .mintPreviewToken(file.id)
        .then(({ token }) => {
          if (!cancelled) setUrl(fileService.previewUrl(file.id, token));
        })
        .catch((e) => {
          if (!cancelled) setError(apiErrorMessage(e));
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id]);

  if (!file) return null;

  return (
    <Modal open={!!file} onClose={onClose} title={file.filename} size="xl">
      <div className="flex max-h-[70vh] min-h-[200px] items-center justify-center overflow-auto">
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && kind === "unsupported" && (
          <p className="text-sm text-soft">{t("files.previewUnsupported")}</p>
        )}
        {!error && kind === "image" && url && (
          <img
            src={url}
            alt={file.filename}
            className="mx-auto max-h-[65vh] rounded-md"
            onError={() => setError(t("files.previewFailed"))}
          />
        )}
        {!error && kind === "video" && url && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={url}
            controls
            className="mx-auto max-h-[65vh] w-full rounded-md"
            onError={() => setError(t("files.previewFailed"))}
          />
        )}
        {!error && kind === "pdf" && url && (
          <iframe
            src={url}
            title={file.filename}
            className="h-[65vh] w-full rounded-md border-0"
            onError={() => setError(t("files.previewFailed"))}
          />
        )}
        {!error && kind === "text" && text !== null && (
          <pre className="w-full whitespace-pre-wrap break-words text-left text-xs">{text}</pre>
        )}
      </div>
    </Modal>
  );
}
