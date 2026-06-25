/**
 * UpdateCard — checks GitHub for a newer StorageHub release and lets an admin
 * apply it (pull + rebuild + restart) from the Settings page. After "apply" we
 * poll status and reload once the backend comes back up.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import { updateService, type UpdateCheck, type UpdateStatus } from "@/services/updateService";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

export function UpdateCard() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const [info, setInfo] = useState<UpdateCheck | null>(null);
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const check = useCallback(async () => {
    setBusy(true);
    try {
      setInfo(await updateService.check());
    } catch {
      setInfo({
        current: "?",
        latest: null,
        update_available: false,
        checked_at: Date.now() / 1000,
        error: "Could not reach the backend.",
      });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void check();
    return () => clearInterval(pollRef.current);
  }, [check]);

  const apply = useCallback(async () => {
    setBusy(true);
    try {
      setStatus(await updateService.apply());
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const s = await updateService.status();
          setStatus(s);
          if (s.state === "done" || s.state === "error" || s.state === "up-to-date") {
            clearInterval(pollRef.current);
            if (s.state === "done") setTimeout(() => window.location.reload(), 2000);
          }
        } catch {
          setStatus({ state: "restarting", message: "App is restarting…" });
        }
      }, 3000);
    } catch (e) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setStatus({ state: "error", message: msg ?? "Apply failed." });
    } finally {
      setBusy(false);
    }
  }, []);

  const available = info?.update_available;

  return (
    <div className="card">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Download className="h-4 w-4" />
          Software update
        </h2>
        <button
          onClick={() => void check()}
          disabled={busy}
          className="grid h-7 w-7 place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          title="Check again"
        >
          <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
        </button>
      </div>

      <p className="mb-3 text-xs text-soft">
        {available
          ? `New version available: v${info?.latest}`
          : info?.error
            ? info.error
            : "You're up to date."}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-soft">Current</p>
          <p className="font-medium tabular-nums">{info ? `v${info.current}` : "…"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-soft">Latest</p>
          <p className="font-medium tabular-nums">
            {info?.latest ? `v${info.latest}` : info?.error ? "—" : "…"}
          </p>
        </div>
      </div>

      {available && info?.notes && (
        <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-black/5 p-3 text-xs text-soft dark:bg-white/5">
          {info.notes}
        </pre>
      )}

      {available && (
        <div className="mt-4">
          {isAdmin ? (
            <button
              onClick={() => void apply()}
              disabled={busy}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Update &amp; restart
            </button>
          ) : (
            <p className="text-xs text-soft">Admin role required to apply updates.</p>
          )}
        </div>
      )}

      {status && (
        <p className="mt-3 border-t border-black/10 pt-3 text-xs text-soft dark:border-white/10">
          <span className="font-medium capitalize">{status.state}</span>
          {status.message ? ` — ${status.message}` : ""}
        </p>
      )}
    </div>
  );
}
