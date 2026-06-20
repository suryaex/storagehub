import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { ToastViewport } from "@/components/feedback/ToastViewport";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
  );
  const applyTheme = useUIStore((s) => s.applyTheme);
  const lang = useUIStore((s) => s.lang);
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    applyTheme();
    document.documentElement.lang = lang;
    loadUser();
  }, [applyTheme, lang, loadUser]);

  return (
    <QueryClientProvider client={client}>
      {children}
      <ToastViewport />
    </QueryClientProvider>
  );
}
