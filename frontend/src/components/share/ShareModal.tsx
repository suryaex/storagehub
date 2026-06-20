import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, Check, Link2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { shareService } from "@/services/shareService";
import { apiErrorMessage } from "@/services/api";
import { useToast } from "@/hooks/useToast";
import type { FileItem, Folder, Share } from "@/types";
import { useTranslation } from "@/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  target: { file?: FileItem; folder?: Folder } | null;
}

export function ShareModal({ open, onClose, target }: Props) {
  const { t } = useTranslation();
  const toast = useToast((s) => s.push);
  const [mode, setMode] = useState<"public" | "password">("public");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [created, setCreated] = useState<Share | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      shareService.create({
        file_id: target?.file?.id ?? null,
        folder_id: target?.folder?.id ?? null,
        password: mode === "password" ? password : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        max_downloads: maxDownloads ? Number(maxDownloads) : null,
      }),
    onSuccess: (share) => {
      setCreated(share);
      toast(t("shareModal.linkCreated"), "success");
    },
    onError: (e) => toast(apiErrorMessage(e), "error"),
  });

  const name = target?.file?.filename ?? target?.folder?.name ?? t("shareModal.item");

  const copy = () => {
    if (!created?.share_url) return;
    navigator.clipboard.writeText(created.share_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const close = () => {
    setCreated(null);
    setPassword("");
    setExpiresAt("");
    setMaxDownloads("");
    setMode("public");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t("shareModal.title")}
      footer={
        !created ? (
          <>
            <button onClick={close} className="btn-ghost">
              {t("common.cancel")}
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (mode === "password" && !password)}
              className="btn-primary"
            >
              {mutation.isPending ? t("shareModal.creating") : t("shareModal.createLink")}
            </button>
          </>
        ) : (
          <button onClick={close} className="btn-primary">
            {t("shareModal.done")}
          </button>
        )
      }
    >
      <p className="mb-4 text-sm text-soft">
        {t("shareModal.sharing", { name })}
      </p>

      {!created ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["public", "password"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${
                  mode === m
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-black/10 text-soft dark:border-white/10"
                }`}
              >
                {m === "public" ? t("shareModal.publicLink") : t("shareModal.password")}
              </button>
            ))}
          </div>

          {mode === "password" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-soft">{t("shareModal.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder={t("shareModal.setPassword")}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-soft">{t("shareModal.expires")}</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-soft">{t("shareModal.maxDownloads")}</label>
              <input
                type="number"
                min={1}
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                className="input"
                placeholder="∞"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-black/10 bg-white/50 p-2 dark:border-white/10 dark:bg-white/5">
            <Link2 className="h-4 w-4 shrink-0 text-accent" />
            <input
              readOnly
              value={created.share_url}
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button onClick={copy} className="btn-primary !min-h-0 px-3 py-1.5 text-xs">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          {created.has_password && (
            <p className="text-xs text-soft">🔒 {t("shareModal.passwordProtected")}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
