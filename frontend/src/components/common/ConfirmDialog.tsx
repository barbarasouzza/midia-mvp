// File: src/components/common/ConfirmDialog.tsx
import { useId, type ReactNode } from "react";
import Dialog from "./Dialog";
import Button from "./Button";
import { BTN, LOADING } from "./strings";
import type { Variant as ButtonVariant } from "./Button";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = BTN.delete,
  cancelLabel = BTN.cancel,
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onClose,
  children,
}: Props) {
  const descriptionId = useId(); // para aria-describedby

  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      loading={loading}
      describedById={description ? descriptionId : undefined}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {loading ? LOADING.saving : confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p id={descriptionId} style={{ marginBottom: 8 }}>{description}</p>}
      {children}
    </Dialog>
  );
}
