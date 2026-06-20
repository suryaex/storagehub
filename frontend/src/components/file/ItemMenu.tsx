import { useEffect, useRef, useState } from "react";
import { MoreVertical, Download, Share2, Pencil, Trash2, FolderInput } from "lucide-react";
import { useTranslation } from "@/i18n";

export type ItemAction = "open" | "download" | "share" | "rename" | "move" | "delete";

interface Props {
  isFolder: boolean;
  onAction: (action: ItemAction) => void;
}

export function ItemMenu({ isFolder, onAction }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const items: { action: ItemAction; label: string; icon: typeof Pencil; danger?: boolean }[] = [
    ...(!isFolder ? [{ action: "download" as const, label: t("common.download"), icon: Download }] : []),
    { action: "share", label: t("common.share"), icon: Share2 },
    { action: "rename", label: t("common.rename"), icon: Pencil },
    { action: "move", label: t("common.move"), icon: FolderInput },
    { action: "delete", label: t("common.delete"), icon: Trash2, danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-soft hover:bg-black/10 dark:hover:bg-white/10"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="glass-strong absolute right-0 top-8 z-20 w-40 animate-scale-in overflow-hidden rounded-md py-1">
          {items.map((item) => (
            <button
              key={item.action}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAction(item.action);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 ${
                item.danger ? "text-danger" : ""
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
