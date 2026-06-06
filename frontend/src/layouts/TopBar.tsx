import { useNavigate } from "react-router-dom";
import { Search, Upload, Menu, HardDrive } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

export function TopBar() {
  const navigate = useNavigate();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setUploadPanelOpen = useUIStore((s) => s.setUploadPanelOpen);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="glass flex h-14 items-center gap-2 rounded-lg px-3">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-accent-soft to-accent text-white">
            <HardDrive className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">StorageHub</span>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="ml-auto flex flex-1 items-center gap-2 rounded-md border border-black/10 bg-white/50 px-3 py-2 text-sm text-soft transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5 sm:max-w-xs"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="ml-auto hidden rounded bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10 sm:inline">
            ⌘K
          </kbd>
        </button>

        <button onClick={() => setUploadPanelOpen(true)} className="btn-primary !min-h-0 px-3 py-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        <button
          onClick={() => navigate("/app/profile")}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-semibold text-accent"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            user?.full_name?.charAt(0)?.toUpperCase() || "U"
          )}
        </button>
      </div>
    </header>
  );
}
