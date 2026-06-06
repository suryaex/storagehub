import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HardDrive, Download, Lock, FileText, Folder, AlertCircle } from "lucide-react";
import { shareService } from "@/services/shareService";
import { API_BASE_URL, apiErrorMessage } from "@/services/api";
import { formatBytes } from "@/utils/format";

export function PublicSharePage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-share", token],
    queryFn: () => shareService.publicInfo(token!),
    enabled: !!token,
    retry: false,
  });

  const verify = async () => {
    try {
      const res = await shareService.verifyPassword(token!, password);
      if (res.valid) {
        setUnlocked(true);
        setError("");
      } else {
        setError("Incorrect password");
      }
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const download = () => {
    const url = `${API_BASE_URL}/share/${token}/download${
      password ? `?password=${encodeURIComponent(password)}` : ""
    }`;
    window.open(url, "_blank");
  };

  const needsPassword = data?.requires_password && !unlocked;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-strong w-full max-w-md animate-scale-in rounded-xl p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-accent-soft to-accent text-white">
            <HardDrive className="h-5 w-5" />
          </div>
          <span className="font-bold">StorageHub Share</span>
        </div>

        {isLoading && <p className="text-sm text-soft">Loading…</p>}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="h-8 w-8 text-danger" />
            <p className="text-sm font-medium">This link is unavailable</p>
            <p className="text-xs text-soft">It may have expired or been revoked.</p>
          </div>
        )}

        {data && (
          <>
            <div className="mb-5 flex items-center gap-3 rounded-md bg-black/5 p-4 dark:bg-white/5">
              {data.type === "folder" ? (
                <Folder className="h-8 w-8 text-accent" />
              ) : (
                <FileText className="h-8 w-8 text-accent" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{data.name}</p>
                <p className="text-xs text-soft">
                  {data.size_bytes ? formatBytes(data.size_bytes) : "Folder"}
                  {data.owner ? ` · ${data.owner}` : ""}
                </p>
              </div>
            </div>

            {needsPassword ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-soft">
                  <Lock className="h-4 w-4" /> This share is password protected
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  placeholder="Enter password"
                  className="input"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <button onClick={verify} className="btn-primary w-full">
                  Unlock
                </button>
              </div>
            ) : (
              data.type === "file" && (
                <button onClick={download} className="btn-primary w-full">
                  <Download className="h-4 w-4" /> Download
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
