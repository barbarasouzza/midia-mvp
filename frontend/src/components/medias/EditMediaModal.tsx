import React, { useEffect, useRef } from "react";
import MediaForm from "./MediaForm";
import type { Line, System, Person, MediaIn, MediaPersonLink } from "../../types";

export type MediaFormLike = Omit<MediaIn, "people"> & { people: MediaPersonLink[] };

import Button from "../common/Button";
import { BTN, LOADING } from "../common/strings";
import { XIcon, SaveIcon } from "../common/icons";

type Props = {
  open: boolean;
  loading: boolean;
  form: MediaFormLike;
  setForm: React.Dispatch<React.SetStateAction<MediaFormLike>>;
  systems: System[];
  lines: Line[];
  people: Person[];
  onClose: () => void;
  onSave: () => void;
  mode?: "create" | "edit";
  title?: string;
  confirmLabel?: string;
};

export default function EditMediaModal({
  open,
  loading,
  form,
  setForm,
  systems,
  lines,
  people,
  onClose,
  onSave,
  mode = "edit",
  title,
  confirmLabel,
}: Props) {
  if (!open) return null;

  const finalTitle = title ?? (mode === "create" ? "Nova Mídia" : "Editar Mídia");
  const finalConfirm = confirmLabel ?? (mode === "create" ? BTN.create : BTN.save);

  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC + trava de scroll + foco inicial
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, loading, onClose]);

  // Focus trap
  useEffect(() => {
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

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (loading) return;
    if (e.target === e.currentTarget) onClose();
  };
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={finalTitle} onMouseDown={onBackdrop}>
      <div className="modal" ref={dialogRef} onMouseDown={stop}>
        <div className="modal-header">
          <h3>{finalTitle}</h3>
          <Button onClick={onClose} disabled={loading} data-autofocus variant="ghost" aria-label={BTN.close} iconLeft={<XIcon />}>
            {BTN.close}
          </Button>
        </div>

        <div className="modal-body">
          <MediaForm
            form={form}
            setForm={setForm}
            lines={lines}
            systems={systems}
            people={people}
          />
        </div>

        <div className="modal-footer" style={{ display: "flex", gap: 8 }}>
          <Button onClick={onClose} disabled={loading} variant="ghost">
            {BTN.cancel}
          </Button>
          <Button onClick={onSave} disabled={loading} loading={loading} variant="primary" iconLeft={<SaveIcon />}>
            {loading ? (mode === "create" ? LOADING.creating : LOADING.saving) : finalConfirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
