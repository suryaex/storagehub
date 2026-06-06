import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, initialized, loading } = useAuthStore();

  if (!initialized || loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
