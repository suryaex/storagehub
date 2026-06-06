import { Sun, Moon, Monitor, LayoutGrid, List, Columns3 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { PageHeader } from "@/components/common/PageHeader";
import type { Theme, ViewMode } from "@/types";
import { cn } from "@/utils/cn";

export function SettingsPage() {
  const { theme, setTheme, viewMode, setViewMode } = useUIStore();

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const views: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { value: "grid", label: "Grid", icon: LayoutGrid },
    { value: "list", label: "List", icon: List },
    { value: "column", label: "Column", icon: Columns3 },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Appearance and preferences" />

      <div className="space-y-3">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border py-4 text-sm font-medium transition",
                  theme === t.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-black/10 text-soft dark:border-white/10",
                )}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">Default File View</h2>
          <div className="grid grid-cols-3 gap-2">
            {views.map((v) => (
              <button
                key={v.value}
                onClick={() => setViewMode(v.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border py-4 text-sm font-medium transition",
                  viewMode === v.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-black/10 text-soft dark:border-white/10",
                )}
              >
                <v.icon className="h-5 w-5" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-1 text-sm font-semibold">Upload Preferences</h2>
          <p className="text-sm text-soft">
            Files larger than 16&nbsp;MB are uploaded in 8&nbsp;MB chunks with automatic resume
            support. Smaller files use a single request.
          </p>
        </div>
      </div>
    </div>
  );
}
