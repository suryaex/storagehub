import { CheckCircle2, X, AlertCircle, UploadCloud } from "lucide-react";
import { useUploadStore } from "@/store/uploadStore";
import { formatBytes } from "@/utils/format";
import { cn } from "@/utils/cn";
import { useTranslation } from "@/i18n";

export function UploadManager() {
  const { t } = useTranslation();
  const { items, cancel, clearCompleted } = useUploadStore();
  const active = items.filter((i) => i.status !== "completed" || true);

  if (active.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 w-[320px] lg:bottom-4">
      <div className="glass-strong overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">{t("upload.title")}</span>
          </div>
          <button onClick={clearCompleted} className="text-xs text-soft hover:text-accent">
            {t("upload.clearDone")}
          </button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="border-b border-black/5 px-4 py-3 dark:border-white/10">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</p>
                {item.status === "completed" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                )}
                {item.status === "failed" && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                )}
                {(item.status === "uploading" || item.status === "queued") && (
                  <button onClick={() => cancel(item.id)} className="text-soft hover:text-danger">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {item.status !== "completed" && item.status !== "failed" && (
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              <p
                className={cn(
                  "mt-1 text-[11px]",
                  item.status === "failed" ? "text-danger" : "text-soft",
                )}
              >
                {item.status === "uploading" && `${item.progress}% · ${formatBytes(item.size)}`}
                {item.status === "queued" && t("upload.queued")}
                {item.status === "completed" && t("upload.completed")}
                {item.status === "cancelled" && t("upload.cancelled")}
                {item.status === "failed" && (item.error || t("upload.failed"))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
