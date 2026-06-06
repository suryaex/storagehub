import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      setTokens(access, refresh).then(() => navigate("/app/dashboard", { replace: true }));
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, setTokens]);

  return <LoadingScreen />;
}
