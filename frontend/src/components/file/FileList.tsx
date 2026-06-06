import { Folder as FolderIcon, FileText } from "lucide-react";
import type { FileItem, Folder } from "@/types";
import { ItemMenu, type ItemAction } from "./ItemMenu";
import { formatBytes, formatRelative } from "@/utils/format";
import { fileIconColor } from "@/utils/cn";

interface Props {
  folders: Folder[];
  files: FileItem[];
  onOpenFolder: (folder: Folder) => void;
  onFolderAction: (folder: Folder, action: ItemAction) => void;
  onFileAction: (file: FileItem, action: ItemAction) => void;
}

export function FileList({ folders, files, onOpenFolder, onFolderAction, onFileAction }: Props) {
  return (
    <div className="glass rounded-lg">
      <div className="hidden grid-cols-[1fr_120px_160px_40px] gap-3 rounded-t-lg border-b border-black/5 px-4 py-2.5 text-xs font-medium text-soft dark:border-white/10 sm:grid">
        <span>Name</span>
        <span>Size</span>
        <span>Modified</span>
        <span />
      </div>
      {folders.map((folder) => (
        <div
          key={`f-${folder.id}`}
          onClick={() => onOpenFolder(folder)}
          className="grid cursor-pointer grid-cols-[1fr_40px] items-center gap-3 border-b border-black/5 px-4 py-3 transition hover:bg-accent/5 dark:border-white/10 sm:grid-cols-[1fr_120px_160px_40px]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <FolderIcon className="h-5 w-5 shrink-0 text-accent" fill="currentColor" fillOpacity={0.15} />
            <span className="truncate text-sm font-medium">{folder.name}</span>
          </div>
          <span className="hidden text-sm text-soft sm:block">—</span>
          <span className="hidden text-sm text-soft sm:block">{formatRelative(folder.updated_at)}</span>
          <ItemMenu isFolder onAction={(a) => onFolderAction(folder, a)} />
        </div>
      ))}
      {files.map((file) => (
        <div
          key={`x-${file.id}`}
          onClick={() => onFileAction(file, "download")}
          className="grid cursor-pointer grid-cols-[1fr_40px] items-center gap-3 border-b border-black/5 px-4 py-3 transition last:border-0 hover:bg-accent/5 dark:border-white/10 sm:grid-cols-[1fr_120px_160px_40px]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <FileText className={`h-5 w-5 shrink-0 ${fileIconColor(file.extension)}`} />
            <span className="truncate text-sm font-medium">{file.filename}</span>
          </div>
          <span className="hidden text-sm text-soft sm:block">{formatBytes(file.size_bytes)}</span>
          <span className="hidden text-sm text-soft sm:block">{formatRelative(file.updated_at)}</span>
          <ItemMenu isFolder={false} onAction={(a) => onFileAction(file, a)} />
        </div>
      ))}
    </div>
  );
}
