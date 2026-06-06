import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, FileText, Database, Share2, ShieldAlert } from "lucide-react";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/store/authStore";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PromptModal } from "@/components/common/PromptModal";
import { useToast } from "@/hooks/useToast";
import { formatBytes, formatRelative, percent } from "@/utils/format";
import { apiErrorMessage } from "@/services/api";
import type { User } from "@/types";

export function AdminPage() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  const me = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"users" | "logs">("users");
  const [quotaTarget, setQuotaTarget] = useState<User | null>(null);

  const isAdmin = me?.role === "admin";

  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: adminService.overview,
    enabled: isAdmin,
  });
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminService.users(1, 50),
    enabled: isAdmin,
  });
  const { data: logs } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: () => adminService.activityLogs(1, 40),
    enabled: isAdmin && tab === "logs",
  });

  if (!isAdmin) {
    return (
      <EmptyState icon={ShieldAlert} title="Admin only" description="You do not have access to this area." />
    );
  }

  const toggleStatus = async (u: User) => {
    try {
      if (u.status === "active") await adminService.disableUser(u.id);
      else await adminService.enableUser(u.id);
      toast("User updated", "success");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const updateQuota = async (value: string) => {
    if (!quotaTarget) return;
    const gb = parseFloat(value);
    if (Number.isNaN(gb)) return;
    try {
      await adminService.updateQuota(quotaTarget.id, Math.round(gb * 1024 ** 3));
      toast("Quota updated", "success");
      setQuotaTarget(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const stats = [
    { label: "Users", value: overview?.total_users ?? 0, icon: Users },
    { label: "Files", value: overview?.total_files ?? 0, icon: FileText },
    { label: "Storage", value: formatBytes(overview?.total_storage_bytes ?? 0), icon: Database },
    { label: "Shares", value: overview?.total_shares ?? 0, icon: Share2 },
  ];

  return (
    <div>
      <PageHeader title="Admin" subtitle="Manage users, quotas and activity" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-2 text-soft">
              <s.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex gap-2">
        {(["users", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-accent/15 text-accent" : "text-soft"
            }`}
          >
            {t === "users" ? "Users" : "Activity Logs"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="glass overflow-x-auto rounded-lg">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs text-soft dark:border-white/10">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Storage</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.items.map((u) => (
                <tr key={u.id} className="border-b border-black/5 last:border-0 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-soft">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.status === "active"
                          ? "bg-success/15 text-success"
                          : "bg-danger/15 text-danger"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-soft">
                    {formatBytes(u.used_bytes)} / {formatBytes(u.quota_bytes)} (
                    {percent(u.used_bytes, u.quota_bytes)}%)
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setQuotaTarget(u)}
                        className="rounded px-2 py-1 text-xs text-accent hover:bg-accent/10"
                      >
                        Quota
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        className="rounded px-2 py-1 text-xs text-soft hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {u.status === "active" ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "logs" && (
        <div className="glass overflow-hidden rounded-lg">
          {logs?.items.length === 0 && (
            <p className="py-10 text-center text-sm text-soft">No activity yet</p>
          )}
          {logs?.items.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 border-b border-black/5 px-4 py-3 text-sm last:border-0 dark:border-white/10"
            >
              <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                {log.action}
              </span>
              <span className="text-soft">{log.resource_type}</span>
              {log.resource_id && <span className="text-xs text-soft">#{log.resource_id}</span>}
              <span className="ml-auto text-xs text-soft">{formatRelative(log.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      <PromptModal
        open={!!quotaTarget}
        title={`Quota for ${quotaTarget?.full_name ?? ""}`}
        label="Quota (GB)"
        initialValue={quotaTarget ? String((quotaTarget.quota_bytes / 1024 ** 3).toFixed(0)) : ""}
        confirmText="Update"
        onConfirm={updateQuota}
        onClose={() => setQuotaTarget(null)}
      />
    </div>
  );
}
