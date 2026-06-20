import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useTranslation } from "@/i18n";

interface Props {
  open: boolean;
  title: string;
  label?: string;
  initialValue?: string;
  confirmText?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function PromptModal({
  open,
  title,
  label,
  initialValue = "",
  confirmText,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            {t("common.cancel")}
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            disabled={!value.trim()}
            className="btn-primary"
          >
            {confirmText ?? t("common.save")}
          </button>
        </>
      }
    >
      <label className="mb-1 block text-xs font-medium text-soft">{label ?? t("common.name")}</label>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && value.trim() && onConfirm(value.trim())}
        className="input"
      />
    </Modal>
  );
}
