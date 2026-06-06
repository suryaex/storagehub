import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, FileText, Folder } from "lucide-react";
import { trashService } from "@/services/trashService";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Spinner } from "@/components/feedback/LoadingScreen";
import { useToast } from "@/hooks/useToast";
import { formatRelative } from "@/utils/format";
import { apiErrorMessage } from "@/services/api";

export function TrashPage() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  const { data, isLoading } = useQuery({ queryKey: ["trash"], queryFn: trashService.list });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["trash"] });
    qc.invalidateQueries({ queryKey: ["folder-contents"] });
  };

  const restore = async (id: number) => {
    try {
      await trashService.restore(id);
      toast("Item restored", "success");
      refresh();
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const remove = async (id: number) => {
    try {
      await trashService.remove(id);
      toast("Permanently deleted", "success");
      refresh();
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Trash" subtitle="Restore or permanently delete items" />
      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}
      {!isLoading && data?.length === 0 && (
        <EmptyState icon={Trash2} title="Trash is empty" />
      )}
      <div className="space-y-2">
        {data?.map((item) => (
          <div key={item.id} className="card flex items-center gap-3">
            {item.item_type === "folder" ? (
              <Folder className="h-5 w-5 text-accent" />
            ) : (
              <FileText className="h-5 w-5 text-soft" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name || item.original_path}</p>
              <p className="text-xs text-soft">Deleted {formatRelative(item.deleted_at)}</p>
            </div>
            <button onClick={() => restore(item.id)} className="btn-ghost !min-h-0 gap-1.5 px-3 py-2 text-accent">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Restore</span>
            </button>
            <button onClick={() => remove(item.id)} className="btn-ghost !min-h-0 p-2 text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
