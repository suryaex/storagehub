import { useCallback } from "react";
import { useUIStore } from "@/store/uiStore";
import { translations, DEFAULT_LANG, LANGUAGES } from "./locales";

export { LANGUAGES } from "./locales";
export type { LanguageOption } from "./locales";

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
 * Bahasa aktif diambil dari uiStore (tersimpan di localStorage).
 */
export function useTranslation() {
  const lang = useUIStore((s) => s.lang);
  const setLang = useUIStore((s) => s.setLang);

  const t = useCallback(
    (key: string, vars?: Vars): string => {
      let str = lookup(translations[lang], key) ?? lookup(translations[DEFAULT_LANG], key);
      if (str == null) return key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang],
  );

  return { t, lang, setLang, languages: LANGUAGES };
}
