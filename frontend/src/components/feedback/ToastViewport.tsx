import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  info: <Info className="h-5 w-5 text-accent" />,
};

export function ToastViewport() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "glass-strong flex items-center gap-3 rounded-md px-4 py-3 text-sm",
            "animate-fade-in min-w-[240px] max-w-sm",
          )}
        >
          {icons[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
