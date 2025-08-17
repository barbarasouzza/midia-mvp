// File: src/components/DeleteMediaModal.tsx
import Modal from "../Modal";

interface DeleteMediaModalProps {
  open: boolean;
  loading: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteMediaModal({
  open,
  loading,
  title,
  onClose,
  onConfirm,
}: DeleteMediaModalProps) {
  return (
    <Modal
      open={open}
      title="Excluir Mídia"
      onClose={onClose}
      loading={loading}
      confirmSlot={
        <button onClick={onConfirm} disabled={loading} aria-label="Confirmar exclusão">
          {loading ? "Excluindo..." : "Excluir"}
        </button>
      }
    >
      <p>
        Deseja realmente excluir <strong>"{title}"</strong>?
      </p>
    </Modal>
  );
}
