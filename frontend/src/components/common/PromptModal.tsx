import { useEffect, useState } from "react";
import { Modal } from "./Modal";

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
  label = "Name",
  initialValue = "",
  confirmText = "Save",
  onConfirm,
  onClose,
}: Props) {
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
            Cancel
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            disabled={!value.trim()}
            className="btn-primary"
          >
            {confirmText}
          </button>
        </>
      }
    >
      <label className="mb-1 block text-xs font-medium text-soft">{label}</label>
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
