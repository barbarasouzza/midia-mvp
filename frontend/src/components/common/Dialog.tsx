import React, { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  loading?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  initialFocusSelector?: string;
};

export default function Dialog({
  open,
  title,
  onClose,
  loading = false,
  children,
  footer,
  closeOnEsc = true,
  closeOnBackdrop = true,
  initialFocusSelector = "[data-autofocus]",
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // efeitos SEMPRE antes de short-circuit render
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (!closeOnEsc) return;
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(initialFocusSelector)?.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, closeOnEsc, loading, onClose, initialFocusSelector]);

  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;

    const selector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(selector))
        .filter((el) => !el.hasAttribute("inert") && el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    root.addEventListener("keydown", handleKeyDown);
    return () => root.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop || loading) return;
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onBackdrop}
    >
      <div className="modal" ref={dialogRef} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} disabled={loading} data-autofocus aria-label="Fechar modal">
            Fechar
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
