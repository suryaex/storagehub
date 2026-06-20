import { useCallback } from "react";
import { useUIStore } from "@/store/uiStore";
import { translations, DEFAULT_LANG } from "./locales";
import { LANGUAGES, RTL_LANGS } from "./languages";

export { LANGUAGES, RTL_LANGS } from "./languages";
export type { LanguageOption } from "./languages";

type Vars = Record<string, string | number>;

// Ambil nilai bersarang via key bertitik, mis. "settings.appearance".
function lookup(dict: unknown, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), dict);
  return typeof value === "string" ? value : undefined;
}

/**
 * Hook terjemahan. `t('settings.title')` atau
 * `t('sidebar.used', { used: '2 GB', total: '10 GB' })`.
 * Bahasa aktif diambil dari uiStore (tersimpan di localStorage). Bahasa tanpa
 * kamus (atau kunci yang belum diterjemahkan) jatuh ke bahasa default (Inggris).
 */
export function useTranslation() {
  const lang = useUIStore((s) => s.lang);
  const setLang = useUIStore((s) => s.setLang);

  const t = useCallback(
    (key: string, vars?: Vars): string => {
      const raw = lookup(translations[lang], key) ?? lookup(translations[DEFAULT_LANG], key);
      if (raw == null) return key;
      let str: string = raw;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [lang],
  );

  return { t, lang, setLang, languages: LANGUAGES };
}
