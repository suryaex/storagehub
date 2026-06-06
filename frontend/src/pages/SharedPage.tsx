import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2, Link2, Share2, Lock, Clock } from "lucide-react";
import { shareService } from "@/services/shareService";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Spinner } from "@/components/feedback/LoadingScreen";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/utils/format";
import { apiErrorMessage } from "@/services/api";

export function SharedPage() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  const { data, isLoading } = useQuery({ queryKey: ["shares"], queryFn: shareService.list });

  const copy = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast("Link copied", "success");
  };

  const revoke = async (id: number) => {
    try {
      await shareService.revoke(id);
      toast("Share revoked", "success");
      qc.invalidateQueries({ queryKey: ["shares"] });
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Shared" subtitle="Links you have created" />
      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}
      {!isLoading && data?.length === 0 && (
        <EmptyState icon={Share2} title="No shares yet" description="Share a file or folder to see it here." />
      )}
      <div className="space-y-2">
        {data?.map((s) => (
          <div key={s.id} className="card flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.token}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-soft">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    s.is_active ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}
                >
                  {s.is_active ? "Active" : "Revoked"}
                </span>
                {s.has_password && (
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Password
                  </span>
                )}
                {s.expires_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(s.expires_at)}
                  </span>
                )}
                <span>{s.download_count} downloads</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => copy(s.share_url)} className="btn-ghost !min-h-0 p-2">
                <Copy className="h-4 w-4" />
              </button>
              {s.is_active && (
                <button onClick={() => revoke(s.id)} className="btn-ghost !min-h-0 p-2 text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
