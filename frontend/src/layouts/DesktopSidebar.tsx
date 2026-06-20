import { NavLink } from "react-router-dom";
import { HardDrive } from "lucide-react";
import { sidebarNav } from "./navItems";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n";
import { formatBytes, percent } from "@/utils/format";
import { cn } from "@/utils/cn";

export function DesktopSidebar() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const used = user?.used_bytes ?? 0;
  const quota = user?.quota_bytes ?? 1;
  const pct = percent(used, quota);

  return (
    <aside className="hidden w-[260px] shrink-0 p-3 lg:block">
      <div className="glass flex h-full flex-col rounded-lg p-3">
        <div className="mb-4 flex items-center gap-2.5 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-accent-soft to-accent text-white">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">StorageHub</p>
            <p className="text-[11px] text-soft">{t("sidebar.fileStorage")}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {sidebarNav
            .filter((item) => !item.adminOnly || user?.role === "admin")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn("nav-item", isActive && "nav-item-active")
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {t(`nav.${item.labelKey}`)}
              </NavLink>
            ))}
        </nav>

        <div className="mt-3 rounded-md bg-black/5 p-3 dark:bg-white/5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium">{t("sidebar.storage")}</span>
            <span className="text-soft">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pct > 90 ? "bg-danger" : "bg-accent",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-soft">
            {t("sidebar.used", { used: formatBytes(used), total: formatBytes(quota) })}
          </p>
        </div>
      </div>
    </aside>
  );
}
