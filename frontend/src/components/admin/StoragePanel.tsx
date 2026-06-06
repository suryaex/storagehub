import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HardDrive,
  Server,
  Cloud,
  Plus,
  Trash2,
  Star,
  Cpu,
  Database,
  Layers,
} from "lucide-react";
import {
  adminService,
  type CloudInput,
  type NodeInput,
} from "@/services/adminService";
import { Modal } from "@/components/common/Modal";
import { Spinner } from "@/components/feedback/LoadingScreen";
import { useToast } from "@/hooks/useToast";
import { apiErrorMessage } from "@/services/api";
import { formatBytes, percent } from "@/utils/format";
import { cn } from "@/utils/cn";

type Sub = "overview" | "nodes" | "cloud";

const NODE_DEFAULT: NodeInput = {
  name: "",
  node_type: "local",
  location: "",
  storage_type: "auto",
  raid_level: "none",
};
const CLOUD_DEFAULT: CloudInput = {
  name: "",
  provider: "s3",
  endpoint: "",
  bucket: "",
  access_key: "",
  secret_key: "",
  sync_mode: "backup",
  enabled: false,
};

export function StoragePanel() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  const [sub, setSub] = useState<Sub>("overview");
  const [nodeOpen, setNodeOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [nodeForm, setNodeForm] = useState<NodeInput>(NODE_DEFAULT);
  const [cloudForm, setCloudForm] = useState<CloudInput>(CLOUD_DEFAULT);

  const overview = useQuery({ queryKey: ["admin-storage"], queryFn: adminService.storageOverview });
  const nodes = useQuery({ queryKey: ["admin-nodes"], queryFn: adminService.listNodes });
  const clouds = useQuery({ queryKey: ["admin-clouds"], queryFn: adminService.listClouds });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-storage"] });
    qc.invalidateQueries({ queryKey: ["admin-nodes"] });
    qc.invalidateQueries({ queryKey: ["admin-clouds"] });
  };

  const run = async (p: Promise<unknown>, ok: string) => {
    try {
      await p;
      toast(ok, "success");
      refresh();
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const submitNode = async () => {
    if (!nodeForm.name.trim() || !nodeForm.location.trim()) {
      toast("Name and location are required", "error");
      return;
    }
    try {
      await adminService.createNode(nodeForm);
      toast("Node added", "success");
      setNodeOpen(false);
      setNodeForm(NODE_DEFAULT);
      refresh();
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const submitCloud = async () => {
    if (!cloudForm.name.trim()) {
      toast("Name is required", "error");
      return;
    }
    try {
      await adminService.createCloud(cloudForm);
      toast("Cloud target added", "success");
      setCloudOpen(false);
      setCloudForm(CLOUD_DEFAULT);
      refresh();
    } catch (e) {
      toast(apiErrorMessage(e), "error");
    }
  };

  const subTabs: { key: Sub; label: string; icon: typeof HardDrive }[] = [
    { key: "overview", label: "Overview", icon: HardDrive },
    { key: "nodes", label: "Nodes", icon: Server },
    { key: "cloud", label: "Cloud Sync", icon: Cloud },
  ];

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium",
              sub === t.key ? "bg-accent/15 text-accent" : "text-soft",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {sub === "overview" && (
        <div className="space-y-3">
          {overview.isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
          {overview.data && (
            <>
              <div className="card">
                <div className="mb-3 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold">Primary storage</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Meta label="Media" value={overview.data.host.media.type} />
                  <Meta label="Filesystem" value={overview.data.host.filesystem || "—"} />
                  <Meta label="Device" value={overview.data.host.device || "—"} />
                  <Meta label="Platform" value={overview.data.host.platform} />
                </div>
                {overview.data.host.media.model && (
                  <p className="mt-2 text-xs text-soft">Model: {overview.data.host.media.model}</p>
                )}
                <UsageBar
                  used={overview.data.host.usage.used_bytes}
                  total={overview.data.host.usage.total_bytes}
                />
              </div>

              <div className="card">
                <div className="mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold">RAID arrays</h3>
                </div>
                {overview.data.host.raid.length === 0 ? (
                  <p className="text-sm text-soft">No software RAID (mdadm) detected.</p>
                ) : (
                  <div className="space-y-2">
                    {overview.data.host.raid.map((r) => (
                      <div key={r.name} className="rounded-md bg-black/5 p-3 text-sm dark:bg-white/5">
                        <span className="font-medium">{r.name}</span>{" "}
                        <span className="uppercase text-accent">{r.level}</span> · {r.state}
                        <span className="ml-2 text-xs text-soft">[{r.members.join(", ")}]</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Nodes ── */}
      {sub === "nodes" && (
        <div>
          <div className="mb-3 flex justify-end">
            <button onClick={() => setNodeOpen(true)} className="btn-primary !min-h-0 px-3 py-2">
              <Plus className="h-4 w-4" /> Add node
            </button>
          </div>
          {nodes.isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
          <div className="space-y-2">
            {nodes.data?.map((n) => (
              <div key={n.id} className="card flex flex-wrap items-center gap-3">
                <Server className="h-5 w-5 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {n.name}
                    {n.is_primary && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
                        primary
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        n.status === "online"
                          ? "bg-success/15 text-success"
                          : "bg-black/10 text-soft dark:bg-white/10",
                      )}
                    >
                      {n.status}
                    </span>
                  </p>
                  <p className="text-xs text-soft">
                    {n.node_type} · {n.storage_type}
                    {n.raid_level !== "none" ? ` · ${n.raid_level}` : ""} · {n.location}
                  </p>
                  {n.capacity_bytes > 0 && (
                    <p className="text-xs text-soft">
                      {formatBytes(n.used_bytes)} / {formatBytes(n.capacity_bytes)} (
                      {percent(n.used_bytes, n.capacity_bytes)}%)
                    </p>
                  )}
                </div>
                {!n.is_primary && (
                  <button
                    onClick={() => run(adminService.setPrimaryNode(n.id), "Primary node set")}
                    className="btn-ghost !min-h-0 gap-1 px-2 py-1.5 text-xs"
                  >
                    <Star className="h-3.5 w-3.5" /> Primary
                  </button>
                )}
                {!n.is_primary && (
                  <button
                    onClick={() => run(adminService.deleteNode(n.id), "Node removed")}
                    className="btn-ghost !min-h-0 p-2 text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cloud ── */}
      {sub === "cloud" && (
        <div>
          <div className="mb-3 flex justify-end">
            <button onClick={() => setCloudOpen(true)} className="btn-primary !min-h-0 px-3 py-2">
              <Plus className="h-4 w-4" /> Add target
            </button>
          </div>
          {clouds.isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
          {clouds.data?.length === 0 && (
            <p className="py-10 text-center text-sm text-soft">
              No cloud targets yet. Add an S3 / WebDAV destination to sync or back up to.
            </p>
          )}
          <div className="space-y-2">
            {clouds.data?.map((c) => (
              <div key={c.id} className="card flex flex-wrap items-center gap-3">
                <Database className="h-5 w-5 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {c.name} <span className="uppercase text-xs text-soft">{c.provider}</span>
                  </p>
                  <p className="text-xs text-soft">
                    {c.sync_mode}
                    {c.bucket ? ` · ${c.bucket}` : ""}
                    {c.endpoint ? ` · ${c.endpoint}` : ""}
                  </p>
                </div>
                <button
                  onClick={() =>
                    run(adminService.updateCloud(c.id, { enabled: !c.enabled }),
                      c.enabled ? "Disabled" : "Enabled")
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    c.enabled ? "bg-success/15 text-success" : "bg-black/10 text-soft dark:bg-white/10",
                  )}
                >
                  {c.enabled ? "Enabled" : "Disabled"}
                </button>
                <button
                  onClick={() => run(adminService.deleteCloud(c.id), "Cloud target removed")}
                  className="btn-ghost !min-h-0 p-2 text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add node modal ── */}
      <Modal
        open={nodeOpen}
        onClose={() => setNodeOpen(false)}
        title="Add storage node"
        footer={
          <>
            <button onClick={() => setNodeOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={submitNode} className="btn-primary">Add node</button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Name">
            <input className="input" value={nodeForm.name}
              onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className="input" value={nodeForm.node_type}
                onChange={(e) => setNodeForm({ ...nodeForm, node_type: e.target.value })}>
                <option value="local">local</option>
                <option value="remote">remote</option>
                <option value="s3">s3</option>
                <option value="webdav">webdav</option>
              </select>
            </Field>
            <Field label="Storage type">
              <select className="input" value={nodeForm.storage_type}
                onChange={(e) => setNodeForm({ ...nodeForm, storage_type: e.target.value })}>
                <option value="auto">auto-detect</option>
                <option value="ssd">SSD</option>
                <option value="hdd">HDD</option>
                <option value="nvme">NVMe</option>
                <option value="raid">RAID</option>
              </select>
            </Field>
          </div>
          <Field label="Location (path or URL)">
            <input className="input" value={nodeForm.location} placeholder="/mnt/data or https://…"
              onChange={(e) => setNodeForm({ ...nodeForm, location: e.target.value })} />
          </Field>
          <Field label="RAID level">
            <select className="input" value={nodeForm.raid_level}
              onChange={(e) => setNodeForm({ ...nodeForm, raid_level: e.target.value })}>
              {["none", "raid0", "raid1", "raid5", "raid6", "raid10"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      {/* ── Add cloud modal ── */}
      <Modal
        open={cloudOpen}
        onClose={() => setCloudOpen(false)}
        title="Add cloud sync target"
        footer={
          <>
            <button onClick={() => setCloudOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={submitCloud} className="btn-primary">Add target</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input className="input" value={cloudForm.name}
                onChange={(e) => setCloudForm({ ...cloudForm, name: e.target.value })} />
            </Field>
            <Field label="Provider">
              <select className="input" value={cloudForm.provider}
                onChange={(e) => setCloudForm({ ...cloudForm, provider: e.target.value })}>
                <option value="s3">S3 / compatible</option>
                <option value="webdav">WebDAV</option>
                <option value="gdrive">Google Drive</option>
                <option value="dropbox">Dropbox</option>
              </select>
            </Field>
          </div>
          <Field label="Endpoint">
            <input className="input" value={cloudForm.endpoint ?? ""} placeholder="https://s3.region.amazonaws.com"
              onChange={(e) => setCloudForm({ ...cloudForm, endpoint: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bucket / path">
              <input className="input" value={cloudForm.bucket ?? ""}
                onChange={(e) => setCloudForm({ ...cloudForm, bucket: e.target.value })} />
            </Field>
            <Field label="Sync mode">
              <select className="input" value={cloudForm.sync_mode}
                onChange={(e) => setCloudForm({ ...cloudForm, sync_mode: e.target.value })}>
                <option value="backup">backup</option>
                <option value="mirror">mirror</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Access key">
              <input className="input" value={cloudForm.access_key ?? ""}
                onChange={(e) => setCloudForm({ ...cloudForm, access_key: e.target.value })} />
            </Field>
            <Field label="Secret key">
              <input className="input" type="password" value={cloudForm.secret_key ?? ""}
                onChange={(e) => setCloudForm({ ...cloudForm, secret_key: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cloudForm.enabled}
              onChange={(e) => setCloudForm({ ...cloudForm, enabled: e.target.checked })} />
            Enable this target
          </label>
        </div>
      </Modal>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-black/5 p-2.5 dark:bg-white/5">
      <p className="text-[11px] text-soft">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = percent(used, total);
  return (
    <div className="mt-4">
      <div className="mb-1 flex justify-between text-xs text-soft">
        <span>{formatBytes(used)} used</span>
        <span>{formatBytes(total)} total · {pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={cn("h-full rounded-full", pct > 90 ? "bg-danger" : "bg-accent")}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-soft">{label}</label>
      {children}
    </div>
  );
}
