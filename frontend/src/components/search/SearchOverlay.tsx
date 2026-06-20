import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, File as FileIcon, Folder, Share2, CornerDownLeft } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { searchService } from "@/services/searchService";
import { formatBytes } from "@/utils/format";
import { useTranslation } from "@/i18n";

const RECENT_KEY = "sh_recent_searches";

export function SearchOverlay() {
  const { t } = useTranslation();
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [recent, setRecent] = useState<string[]>(
    JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"),
  );

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ("");
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchService.search(q),
    enabled: open && q.trim().length > 0,
  });

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const go = (path: string, term?: string) => {
    if (term) saveRecent(term);
    setOpen(false);
    navigate(path);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-strong w-full max-w-xl animate-scale-in overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3.5 dark:border-white/10">
          <Search className="h-5 w-5 text-soft" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchOverlay.placeholder")}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-soft"
          />
          {isFetching && <span className="text-xs text-soft">…</span>}
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!q && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-soft">{t("searchOverlay.recentSearches")}</p>
              {recent.length === 0 && (
                <p className="px-2 py-3 text-sm text-soft">{t("searchOverlay.noRecent")}</p>
              )}
              {recent.map((term) => (
                <button
                  key={term}
                  onClick={() => setQ(term)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Search className="h-4 w-4 text-soft" /> {term}
                </button>
              ))}
            </div>
          )}

          {q && data && (
            <>
              {data.folders.map((f) => (
                <ResultRow
                  key={`folder-${f.id}`}
                  icon={<Folder className="h-4 w-4 text-accent" />}
                  title={f.name}
                  subtitle={t("searchOverlay.folder")}
                  onClick={() => go(`/app/files/${f.id}`, q)}
                />
              ))}
              {data.files.map((f) => (
                <ResultRow
                  key={`file-${f.id}`}
                  icon={<FileIcon className="h-4 w-4 text-soft" />}
                  title={f.filename}
                  subtitle={formatBytes(f.size_bytes)}
                  onClick={() => go(`/app/files/${f.folder_id}`, q)}
                />
              ))}
              {data.shares.map((s) => (
                <ResultRow
                  key={`share-${s.id}`}
                  icon={<Share2 className="h-4 w-4 text-success" />}
                  title={s.token}
                  subtitle={t("searchOverlay.share")}
                  onClick={() => go("/app/shared", q)}
                />
              ))}
              {data.files.length + data.folders.length + data.shares.length === 0 &&
                !isFetching && (
                  <p className="px-3 py-6 text-center text-sm text-soft">
                    {t("searchOverlay.noResultsFor", { q })}
                  </p>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent/10"
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-soft">{subtitle}</p>
      </div>
      <CornerDownLeft className="h-3.5 w-3.5 text-soft opacity-0 group-hover:opacity-100" />
    </button>
  );
}
