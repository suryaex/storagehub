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

export function FileGrid({ folders, files, onOpenFolder, onFolderAction, onFileAction }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {folders.map((folder) => (
        <div
          key={`f-${folder.id}`}
          onDoubleClick={() => onOpenFolder(folder)}
          onClick={() => onOpenFolder(folder)}
          className="card group cursor-pointer hover:-translate-y-0.5 hover:shadow-glass-lg"
        >
          <div className="flex items-start justify-between">
            <FolderIcon className="h-9 w-9 text-accent" fill="currentColor" fillOpacity={0.15} />
            <ItemMenu isFolder onAction={(a) => onFolderAction(folder, a)} />
          </div>
          <p className="mt-3 truncate text-sm font-medium">{folder.name}</p>
          <p className="text-[11px] text-soft">Folder</p>
        </div>
      ))}

      {files.map((file) => (
        <div
          key={`x-${file.id}`}
          onClick={() => onFileAction(file, "download")}
          className="card group cursor-pointer hover:-translate-y-0.5 hover:shadow-glass-lg"
        >
          <div className="flex items-start justify-between">
            <FileText className={`h-9 w-9 ${fileIconColor(file.extension)}`} />
            <ItemMenu isFolder={false} onAction={(a) => onFileAction(file, a)} />
          </div>
          <p className="mt-3 truncate text-sm font-medium">{file.filename}</p>
          <p className="text-[11px] text-soft">
            {formatBytes(file.size_bytes)} · {formatRelative(file.updated_at)}
          </p>
        </div>
      ))}
    </div>
  );
}
