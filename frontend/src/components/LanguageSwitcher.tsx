import { useEffect, useRef, useState } from "react";
import { Languages, Check } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/utils/cn";

// Pemilih bahasa ringkas untuk TopBar (dropdown dengan bendera).
export function LanguageSwitcher() {
  const { lang, setLang, languages } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-soft transition hover:bg-black/5 dark:hover:bg-white/10"
        title="Language"
        aria-label="Change language"
      >
        <Languages className="h-4 w-4" />
      </button>
      {open && (
        <div className="glass-strong absolute right-0 top-full mt-2 max-h-[70vh] w-52 overflow-y-auto rounded-lg p-1 shadow-glass">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition hover:bg-black/5 dark:hover:bg-white/10",
                l.code === lang ? "font-semibold text-accent" : "text-soft",
              )}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1">{l.label}</span>
              {l.code === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
