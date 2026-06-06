import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="glass flex h-16 w-16 items-center justify-center rounded-full">
        <Icon className="h-7 w-7 text-soft" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-xs text-sm text-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
