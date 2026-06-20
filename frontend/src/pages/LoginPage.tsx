import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HardDrive, Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { apiErrorMessage } from "@/services/api";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/i18n";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
  microsoft: "Continue with Microsoft",
  oidc: "Continue with OIDC",
};

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast((s) => s.push);
  const { user, setTokens } = useAuthStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/app/dashboard", { replace: true });
  }, [user, navigate]);

  const { data } = useQuery({ queryKey: ["providers"], queryFn: authService.providers });
  const providers = data?.providers ?? {};

  const handleLocal = async () => {
    if (!email.trim()) {
      toast(t("login.enterEmail"), "error");
      return;
    }
    setLoading(true);
    try {
      const tokens = await authService.localLogin(email.trim());
      await setTokens(tokens.access_token, tokens.refresh_token);
      navigate("/app/dashboard", { replace: true });
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-strong w-full max-w-sm animate-scale-in rounded-xl p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-accent text-white shadow-glass">
            <HardDrive className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">StorageHub</h1>
          <p className="mt-1 text-sm text-soft">{t("login.tagline")}</p>
        </div>

        <div className="space-y-2.5">
          {Object.entries(PROVIDER_LABELS).map(([key, label]) =>
            providers[key] ? (
              <a key={key} href={authService.oauthStartUrl(key)} className="btn-glass w-full">
                {label}
              </a>
            ) : null,
          )}
        </div>

        {providers.local && (
          <div className="mt-5 border-t border-black/5 pt-5 dark:border-white/10">
            <p className="mb-2 text-center text-xs text-soft">{t("login.localLogin")}</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLocal()}
              placeholder={t("login.emailPlaceholder")}
              className="input mb-2"
            />
            <button onClick={handleLocal} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("login.continueLocal")}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-soft">
          {t("login.footer")}
        </p>
      </div>
    </div>
  );
}
