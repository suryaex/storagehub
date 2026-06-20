import {
  LayoutDashboard,
  Folder,
  Share2,
  Search,
  Trash2,
  Settings,
  Shield,
  User,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  /** Kunci i18n di namespace `nav` (mis. "dashboard" -> t("nav.dashboard")). */
  labelKey: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const sidebarNav: NavItem[] = [
  { to: "/app/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/app/files", labelKey: "files", icon: Folder },
  { to: "/app/shared", labelKey: "shared", icon: Share2 },
  { to: "/app/search", labelKey: "search", icon: Search },
  { to: "/app/trash", labelKey: "trash", icon: Trash2 },
  { to: "/app/admin", labelKey: "admin", icon: Shield, adminOnly: true },
  { to: "/app/settings", labelKey: "settings", icon: Settings },
];

export const mobileNav: NavItem[] = [
  { to: "/app/dashboard", labelKey: "home", icon: LayoutDashboard },
  { to: "/app/files", labelKey: "files", icon: Folder },
  { to: "/app/files", labelKey: "upload", icon: Upload },
  { to: "/app/shared", labelKey: "shared", icon: Share2 },
  { to: "/app/profile", labelKey: "profile", icon: User },
];
