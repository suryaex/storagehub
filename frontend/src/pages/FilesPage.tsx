import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  List,
  Upload,
  FolderPlus,
  ChevronRight,
  Home,
  FileX,
} from "lucide-react";
import { folderService } from "@/services/folderService";
import { fileService } from "@/services/fileService";
import { useUIStore } from "@/store/uiStore";
import { useUploadStore } from "@/store/uploadStore";
import { useToast } from "@/hooks/useToast";
import { apiErrorMessage } from "@/services/api";
import { FileGrid } from "@/components/file/FileGrid";
import { FileList } from "@/components/file/FileList";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Spinner } from "@/components/feedback/LoadingScreen";
import { ShareModal } from "@/components/share/ShareModal";
import { PromptModal } from "@/components/common/PromptModal";
import type { ItemAction } from "@/components/file/ItemMenu";
import type { FileItem, Folder } from "@/types";
import { cn } from "@/utils/cn";

export function FilesPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  const { viewMode, setViewMode, uploadPanelOpen, setUploadPanelOpen } = useUIStore();
  const enqueue = useUploadStore((s) => s.enqueue);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [shareTarget, setShareTarget] = useState<{ file?: FileItem; folder?: Folder } | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<
    { type: "file" | "folder"; id: number; name: string } | null
  >(null);

  const numericId = folderId ? Number(folderId) : null;

  const { data, isLoading } = useQuery({
    queryKey: ["folder-contents", numericId],
    queryFn: () =>
      numericId ? folderService.contents(numericId) : folderService.rootContents(),
  });

  const currentFolderId = data?.folder.id ?? null;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["folder-contents"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // Upload trigger from TopBar button
  useEffect(() => {
    if (uploadPanelOpen) {
      inputRef.current?.click();
      setUploadPanelOpen(false);
    }
  }, [uploadPanelOpen, setUploadPanelOpen]);

  const doUpload = (files: FileList | File[]) => {
    if (!currentFolderId) return;
    const arr = Array.from(files);
    if (arr.length === 0) return;
    enqueue(currentFolderId, arr, refresh);
    toast(`Uploading ${arr.length} file(s)`, "info");
  };

  const onFolderAction = async (folder: Folder, action: ItemAction) => {
    try {
      if (action === "open") navigate(`/app/files/${folder.id}`);
      if (action === "share") setShareTarget({ folder });
      if (action === "rename")
        setRenameTarget({ type: "folder", id: folder.id, name: folder.name });
      if (action === "delete") {
        await folderService.remove(folder.id);
        toast("Folder moved to trash", "success");
        refresh();
      }
      if (action === "move") toast("Use drag & drop or rename for now", "info");
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const onFileAction = async (file: FileItem, action: ItemAction) => {
    try {
      if (action === "download" || action === "open") {
        toast("Downloading…", "info");
        await fileService.download(file.id, file.filename);
      }
      if (action === "share") setShareTarget({ file });
      if (action === "rename")
        setRenameTarget({ type: "file", id: file.id, name: file.filename });
      if (action === "delete") {
        await fileService.remove(file.id);
        toast("File moved to trash", "success");
        refresh();
      }
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const handleRename = async (value: string) => {
    if (!renameTarget) return;
    try {
      if (renameTarget.type === "folder") await folderService.rename(renameTarget.id, value);
      else await fileService.rename(renameTarget.id, value);
      toast("Renamed", "success");
      setRenameTarget(null);
      refresh();
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const handleNewFolder = async (name: string) => {
    try {
      await folderService.create(name, currentFolderId);
      toast("Folder created", "success");
      setNewFolderOpen(false);
      refresh();
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const folders = data?.subfolders ?? [];
  const files = data?.files ?? [];
  const isEmpty = !isLoading && folders.length === 0 && files.length === 0;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        doUpload(e.dataTransfer.files);
      }}
      className={cn("relative min-h-[60vh]", dragging && "rounded-lg ring-2 ring-accent")}
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Breadcrumbs folder={data?.folder} onNavigate={(id) =>
          id ? navigate(`/app/files/${id}`) : navigate("/app/files")} />

        <div className="ml-auto flex items-center gap-2">
          <div className="glass flex rounded-md p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("rounded p-1.5", viewMode === "grid" && "bg-accent/15 text-accent")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("rounded p-1.5", viewMode === "list" && "bg-accent/15 text-accent")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setNewFolderOpen(true)} className="btn-glass !min-h-0 px-3 py-2">
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="btn-primary !min-h-0 px-3 py-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) doUpload(e.target.files);
          e.target.value = "";
        }}
      />

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon={FileX}
          title="No files yet"
          description="Upload your first file or create a folder to get started."
          action={
            <button onClick={() => inputRef.current?.click()} className="btn-primary">
              <Upload className="h-4 w-4" /> Upload
            </button>
          }
        />
      )}

      {!isLoading && !isEmpty && (
        <>
          {viewMode === "list" ? (
            <FileList
              folders={folders}
              files={files}
              onOpenFolder={(f) => navigate(`/app/files/${f.id}`)}
              onFolderAction={onFolderAction}
              onFileAction={onFileAction}
            />
          ) : (
            <FileGrid
              folders={folders}
              files={files}
              onOpenFolder={(f) => navigate(`/app/files/${f.id}`)}
              onFolderAction={onFolderAction}
              onFileAction={onFileAction}
            />
          )}
        </>
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-accent/10">
          <p className="glass-strong rounded-lg px-5 py-3 text-sm font-medium">Drop files to upload</p>
        </div>
      )}

      <ShareModal open={!!shareTarget} onClose={() => setShareTarget(null)} target={shareTarget} />
      <PromptModal
        open={newFolderOpen}
        title="New Folder"
        label="Folder name"
        confirmText="Create"
        onConfirm={handleNewFolder}
        onClose={() => setNewFolderOpen(false)}
      />
      <PromptModal
        open={!!renameTarget}
        title="Rename"
        initialValue={renameTarget?.name}
        onConfirm={handleRename}
        onClose={() => setRenameTarget(null)}
      />
    </div>
  );
}

function Breadcrumbs({
  folder,
  onNavigate,
}: {
  folder?: Folder;
  onNavigate: (id: number | null) => void;
}) {
  const isRoot = !folder || folder.parent_id === null;
  return (
    <div className="glass flex items-center gap-1 rounded-md px-3 py-2 text-sm">
      <button onClick={() => onNavigate(null)} className="flex items-center gap-1 text-soft hover:text-accent">
        <Home className="h-4 w-4" />
        Home
      </button>
      {!isRoot && folder && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-soft" />
          <span className="font-medium">{folder.name}</span>
        </>
      )}
    </div>
  );
}
