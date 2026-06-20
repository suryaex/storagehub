import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Folder, Share2, SearchX } from "lucide-react";
import { searchService } from "@/services/searchService";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatBytes } from "@/utils/format";
import { fileIconColor } from "@/utils/cn";
import { useTranslation } from "@/i18n";

export function SearchPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ["search-page", q],
    queryFn: () => searchService.search(q),
    enabled: q.trim().length > 0,
  });

  const totalResults =
    (data?.files.length ?? 0) + (data?.folders.length ?? 0) + (data?.shares.length ?? 0);

  return (
    <div>
      <PageHeader title={t("search.title")} subtitle={t("search.subtitle")} />

      <div className="glass mb-5 flex items-center gap-3 rounded-lg px-4 py-3">
        <Search className="h-5 w-5 text-soft" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search.placeholder")}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-soft"
        />
        {isFetching && <span className="text-xs text-soft">…</span>}
      </div>

      {q && totalResults === 0 && !isFetching && (
        <EmptyState icon={SearchX} title={t("search.noResults")} description={t("search.noResultsDesc")} />
      )}

      {!q && (
        <EmptyState icon={Search} title={t("search.emptyTitle")} description={t("search.emptyDesc")} />
      )}

      {totalResults > 0 && (
        <div className="space-y-4">
          {data!.folders.length > 0 && (
            <Section title={t("search.folders")}>
              {data!.folders.map((f) => (
                <Row
                  key={f.id}
                  icon={<Folder className="h-5 w-5 text-accent" />}
                  title={f.name}
                  subtitle={t("search.folder")}
                  onClick={() => navigate(`/app/files/${f.id}`)}
                />
              ))}
            </Section>
          )}
          {data!.files.length > 0 && (
            <Section title={t("search.filesGroup")}>
              {data!.files.map((f) => (
                <Row
                  key={f.id}
                  icon={<FileText className={`h-5 w-5 ${fileIconColor(f.extension)}`} />}
                  title={f.filename}
                  subtitle={formatBytes(f.size_bytes)}
                  onClick={() => navigate(`/app/files/${f.folder_id}`)}
                />
              ))}
            </Section>
          )}
          {data!.shares.length > 0 && (
            <Section title={t("search.shares")}>
              {data!.shares.map((s) => (
                <Row
                  key={s.id}
                  icon={<Share2 className="h-5 w-5 text-success" />}
                  title={s.token}
                  subtitle={t("search.shareLink")}
                  onClick={() => navigate("/app/shared")}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-soft">{title}</h3>
      <div className="glass overflow-hidden rounded-lg">{children}</div>
    </div>
  );
}

function Row({
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
      className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-accent/5 dark:border-white/10"
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-soft">{subtitle}</p>
      </div>
    </button>
  );
}
