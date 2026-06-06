import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="glass flex flex-col items-center gap-3 rounded-lg px-8 py-6">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
        <span className="text-sm text-soft">Loading…</span>
      </div>
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin text-accent ${className}`} />;
}
