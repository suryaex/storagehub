import { Outlet } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { TopBar } from "./TopBar";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { UploadManager } from "@/components/upload/UploadManager";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function AppShell() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-3 pb-24 pt-3 lg:pb-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <SearchOverlay />
      <UploadManager />
    </div>
  );
}
