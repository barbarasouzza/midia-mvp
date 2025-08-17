// File: src/components/Modal.tsx
import React from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  confirmSlot?: React.ReactNode;
  loading?: boolean;
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  confirmSlot,
  loading,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button aria-label="Fechar modal" onClick={onClose} disabled={loading}>
            Fechar
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {confirmSlot && <div className="modal-footer">{confirmSlot}</div>}
      </div>
    </div>
  );
}
