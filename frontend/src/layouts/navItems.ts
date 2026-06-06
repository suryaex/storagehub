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
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const sidebarNav: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/files", label: "Files", icon: Folder },
  { to: "/app/shared", label: "Shared", icon: Share2 },
  { to: "/app/search", label: "Search", icon: Search },
  { to: "/app/trash", label: "Trash", icon: Trash2 },
  { to: "/app/admin", label: "Admin", icon: Shield, adminOnly: true },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export const mobileNav: NavItem[] = [
  { to: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/app/files", label: "Files", icon: Folder },
  { to: "/app/files", label: "Upload", icon: Upload },
  { to: "/app/shared", label: "Shared", icon: Share2 },
  { to: "/app/profile", label: "Profile", icon: User },
];
