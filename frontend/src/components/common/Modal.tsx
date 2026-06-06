import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-md animate-scale-in rounded-t-xl rounded-b-none sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold">{title}</h2>
            <button onClick={onClose} className="btn-ghost h-8 w-8 rounded-full !p-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-black/5 px-5 py-4 dark:border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
