import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function fileIconColor(ext?: string | null): string {
  const map: Record<string, string> = {
    pdf: "text-red-500",
    zip: "text-amber-500",
    rar: "text-amber-500",
    bin: "text-purple-500",
    iso: "text-purple-500",
    img: "text-pink-500",
    png: "text-pink-500",
    jpg: "text-pink-500",
    jpeg: "text-pink-500",
    mp4: "text-indigo-500",
    mov: "text-indigo-500",
    md: "text-sky-500",
    txt: "text-sky-500",
    doc: "text-blue-500",
    docx: "text-blue-500",
    xls: "text-green-600",
    xlsx: "text-green-600",
  };
  return map[(ext ?? "").toLowerCase()] || "text-accent";
}
