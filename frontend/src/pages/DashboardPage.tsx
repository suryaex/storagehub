import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HardDrive,
  Upload,
  FolderPlus,
  Search,
  FileText,
  Share2,
  Database,
  Folder,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { useUIStore } from "@/store/uiStore";
import { PageHeader } from "@/components/common/PageHeader";
import { formatBytes, formatRelative, percent } from "@/utils/format";
import { fileIconColor } from "@/utils/cn";

export function DashboardPage() {
  const navigate = useNavigate();
  const setUploadPanelOpen = useUIStore((s) => s.setUploadPanelOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.summary,
  });

  const used = data?.storage_usage.used_bytes ?? 0;
  const quota = data?.storage_usage.quota_bytes ?? 1;
  const pct = percent(used, quota);

  const quickActions = [
    { label: "Upload", icon: Upload, onClick: () => setUploadPanelOpen(true) },
    { label: "New Folder", icon: FolderPlus, onClick: () => navigate("/app/files") },
    { label: "Search", icon: Search, onClick: () => setSearchOpen(true) },
    { label: "Shared", icon: Share2, onClick: () => navigate("/app/shared") },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your storage at a glance" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card md:col-span-1">
          <div className="flex items-center gap-2 text-soft">
            <Database className="h-4 w-4" />
            <span className="text-xs font-medium">Used Storage</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{formatBytes(used)}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className={`h-full rounded-full ${pct > 90 ? "bg-danger" : "bg-accent"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-soft">{pct}% of {formatBytes(quota)}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-soft">
            <HardDrive className="h-4 w-4" />
            <span className="text-xs font-medium">Free Quota</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{formatBytes(Math.max(0, quota - used))}</p>
          <div className="mt-3 flex gap-4 text-xs text-soft">
            <span>{data?.file_count ?? 0} files</span>
            <span>{data?.folder_count ?? 0} folders</span>
          </div>
        </div>

        <div className="card">
          <span className="text-xs font-medium text-soft">Quick Actions</span>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="flex flex-col items-center gap-1.5 rounded-md bg-black/5 py-3 text-xs font-medium transition hover:bg-accent/10 hover:text-accent dark:bg-white/5"
              >
                <a.icon className="h-5 w-5" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Recent Files</h2>
          </div>
          {isLoading && <p className="text-sm text-soft">Loading…</p>}
          {data?.recent_files.length === 0 && (
            <p className="py-6 text-center text-sm text-soft">No files yet</p>
          )}
          <div className="space-y-1">
            {data?.recent_files.slice(0, 6).map((f) => (
              <button
                key={f.id}
                onClick={() => navigate(`/app/files/${f.folder_id}`)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
              >
                <FileText className={`h-4 w-4 ${fileIconColor(f.extension)}`} />
                <span className="min-w-0 flex-1 truncate text-sm">{f.filename}</span>
                <span className="text-xs text-soft">{formatBytes(f.size_bytes)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-success" />
            <h2 className="text-sm font-semibold">Shared Files</h2>
          </div>
          {data?.shared_files.length === 0 && (
            <p className="py-6 text-center text-sm text-soft">No shares yet</p>
          )}
          <div className="space-y-1">
            {data?.shared_files.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => navigate("/app/shared")}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Folder className="h-4 w-4 text-success" />
                <span className="min-w-0 flex-1 truncate text-sm">{s.token}</span>
                <span className="text-xs text-soft">{formatRelative(s.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
