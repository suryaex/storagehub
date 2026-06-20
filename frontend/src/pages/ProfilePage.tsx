import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Shield, HardDrive } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { PageHeader } from "@/components/common/PageHeader";
import { formatBytes, percent } from "@/utils/format";
import { useTranslation } from "@/i18n";

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  if (!user) return null;
  const pct = percent(user.used_bytes, user.quota_bytes);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div>
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-2xl font-bold text-accent">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              user.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user.full_name}</h2>
            <p className="flex items-center gap-1.5 text-sm text-soft">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoTile icon={<Shield className="h-4 w-4" />} label={t("profile.role")} value={user.role} />
          <InfoTile icon={<HardDrive className="h-4 w-4" />} label={t("profile.status")} value={user.status} />
          <InfoTile
            icon={<HardDrive className="h-4 w-4" />}
            label={t("profile.storage")}
            value={`${formatBytes(user.used_bytes)} / ${formatBytes(user.quota_bytes)}`}
          />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-soft">
            <span>{t("profile.storageUsed")}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className={`h-full rounded-full ${pct > 90 ? "bg-danger" : "bg-accent"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button onClick={handleLogout} className="btn-ghost mt-6 w-full text-danger">
          <LogOut className="h-4 w-4" /> {t("profile.logout")}
        </button>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-black/5 p-3 dark:bg-white/5">
      <div className="flex items-center gap-1.5 text-xs text-soft">
        {icon} {label}
      </div>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
