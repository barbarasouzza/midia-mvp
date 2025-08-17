import { useEffect, useState } from "react";
import type { Line, LineIn, System } from "../types";
import { ApiClient, ApiError } from "../api/api";
import type { ReactNode } from "react";
import { useToast } from "../components/common/toast";

const api = new ApiClient();

type Props = { onChange?: () => void };

export default function LinesList({ onChange }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [name, setName] = useState("");
  const [systemId, setSystemId] = useState<number | "">("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [editName, setEditName] = useState("");
  const [editSystemId, setEditSystemId] = useState<number | "">("");
  const { success, error } = useToast(); // <-- add

  const loadAll = async () => {
    setLoading(true);
    setStatus("");
    try {
      const [ls, ss] = await Promise.all([api.listLines(), api.listSystems()]);
      setLines(ls);
      setSystems(ss);
      setStatus(`Carregado ✔️ (${ls.length} linhas)`);
    } catch (e: any) {
      setStatus(e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return setStatus("Informe o nome da linha");
    setLoading(true);
    setStatus("");
    try {
      const payload: LineIn = { name: name.trim(), system_id: systemId ? Number(systemId) : null };
      await api.createLine(payload);
      setName(""); setSystemId("");
      await loadAll();
      onChange?.();
      success("Linha criada ✔️");            // <-- toast
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      setStatus(msg);
      error(msg);                             // <-- toast
    } finally { setLoading(false); }
  };

  const openEditModal = (line: Line) => {
    setSelectedLine(line);
    setEditName(line.name);
    setEditSystemId(line.system_id ?? "");
    setShowEditModal(true);
  };
   const handleEdit = async () => {
    if (!selectedLine) return;
    setLoading(true);
    setStatus("");
    try {
      const payload: LineIn = { name: editName.trim(), system_id: editSystemId ? Number(editSystemId) : null };
      await api.updateLine(selectedLine.id, payload);
      setShowEditModal(false); setSelectedLine(null);
      await loadAll();
      onChange?.();
      success("Linha atualizada ✔️");        // <-- toast
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      setStatus(msg);
      error(msg);                             // <-- toast
    } finally { setLoading(false); }
  };

  const openDeleteModal = (line: Line) => {
    setSelectedLine(line);
    setShowDeleteModal(true);
  };
  
  const handleDelete = async () => {
    if (!selectedLine) return;
    setLoading(true);
    setStatus("");
    try {
      await api.deleteLine(selectedLine.id);
      setShowDeleteModal(false); setSelectedLine(null);
      await loadAll();
      onChange?.();
      success("Linha excluída ✔️");          // <-- toast
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      setStatus(msg);
      error(msg);                             // <-- toast
    } finally { setLoading(false); }
  };

  // Componente Modal reutilizável
  function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Modal">
        <div className="modal">
          {children}
          <div className="modal-footer">
            <button onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="card">
      <h2>Linhas</h2>
      {status && <div className="status">{status}</div>}

      {/* Formulário de criação */}
      <div className="row">
        <input
          placeholder="Nome da linha"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <select
          value={systemId}
          onChange={e => setSystemId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Selecione o sistema (opcional)</option>
          {systems.map(sys => (
            <option key={sys.id} value={sys.id}>{sys.name}</option>
          ))}
        </select>
        <button onClick={handleAdd} disabled={loading}>
          {loading ? "Salvando..." : "Adicionar"}
        </button>
      </div>

      {/* Tabela de linhas */}
      <table className="media-table">
        <thead>
          <tr>
            <th>Sistema</th>
            <th>Linha</th>
            <th style={{ width: 160 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(l => (
            <tr key={l.id}>
              <td>{l.system_name || "-"}</td>
              <td>{l.name}</td>
              <td>
                <button onClick={() => openEditModal(l)} disabled={loading}>✏️ Editar</button>
                <button onClick={() => openDeleteModal(l)} disabled={loading}>🗑️ Excluir</button>
              </td>
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", opacity: 0.7 }}>
                Nenhuma linha cadastrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal de edição */}
      {showEditModal && selectedLine && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3>Editar Linha</h3>
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
          <select
            value={editSystemId}
            onChange={e => setEditSystemId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Nenhum</option>
            {systems.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button onClick={handleEdit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </Modal>
      )}

      {/* Modal de exclusão */}
      {showDeleteModal && selectedLine && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <h3>Excluir Linha</h3>
          <p>Tem certeza que deseja excluir a linha "{selectedLine.name}"?</p>
          <button onClick={handleDelete} disabled={loading}>
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </Modal>
      )}
    </section>
  );
}
