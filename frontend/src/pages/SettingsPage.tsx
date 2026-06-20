import { Sun, Moon, Monitor, LayoutGrid, List, Columns3, Languages } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { PageHeader } from "@/components/common/PageHeader";
import { useTranslation } from "@/i18n";
import type { Theme, ViewMode } from "@/types";
import { cn } from "@/utils/cn";

export function SettingsPage() {
  const { theme, setTheme, viewMode, setViewMode } = useUIStore();
  const { t, lang, setLang, languages } = useTranslation();

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("settings.light"), icon: Sun },
    { value: "dark", label: t("settings.dark"), icon: Moon },
    { value: "system", label: t("settings.system"), icon: Monitor },
  ];

  const views: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { value: "grid", label: t("settings.grid"), icon: LayoutGrid },
    { value: "list", label: t("settings.list"), icon: List },
    { value: "column", label: t("settings.column"), icon: Columns3 },
  ];

  return (
    <div>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="space-y-3">
        <div className="card">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Languages className="h-4 w-4" />
            {t("settings.language")}
          </h2>
          <p className="mb-3 text-xs text-soft">{t("settings.languageDesc")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition",
                  lang === l.code
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-black/10 text-soft dark:border-white/10",
                )}
              >
                <span className="text-base">{l.flag}</span>
                <span className="truncate">{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">{t("settings.appearance")}</h2>
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
          <h2 className="mb-3 text-sm font-semibold">{t("settings.defaultView")}</h2>
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
          <h2 className="mb-1 text-sm font-semibold">{t("settings.uploadPrefs")}</h2>
          <p className="text-sm text-soft">{t("settings.uploadPrefsDesc")}</p>
        </div>
      </div>
    </div>
  );
}
