// File: src/components/SystemsList.tsx
import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import type { System, SystemIn } from "../types";
import { ApiClient, ApiError } from "../api/api";
import { useToast } from "./common/toast";
import Dialog from "./common/Dialog";
import ConfirmDialog from "./common/ConfirmDialog";
import FilterBar, { type FilterField } from "./common/FilterBar";
import Button from "./common/Button";
import { BTN, LOADING } from "./common/strings";
import { PlusIcon, TrashIcon } from "./common/icons";

const api = new ApiClient();
const DEBUG = false; // true para ver logs

type Props = { onChange?: () => void };

export default function SystemsList({ onChange }: Props) {
  const [systems, setSystems] = useState<System[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");

  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<System | null>(null);

  const formId = useId();      // submit nativo
  const nameInputId = useId(); // acessibilidade

  // ---- Guards e helpers para efeito duplo do StrictMode e unmount ----
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const didFetchRef = useRef(false);
  const inFlightRef = useRef(false);
  const log = (...a: any[]) => { if (DEBUG) console.log("[SystemsList]", ...a); };

  const safeSet = useCallback(<T,>(setter: (v: T) => void, v: T) => {
    if (mountedRef.current) setter(v);
  }, []);

  // estabiliza o error() do toast
  const toastErrorRef = useRef(error);
  useEffect(() => { toastErrorRef.current = error; }, [error]);

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      log("load() - já em andamento, pulando");
      return;
    }
    inFlightRef.current = true;
    log("load() START");

    safeSet(setLoading, true);
    safeSet(setStatus, "");
    try {
      const list = await api.listSystems();
      const sorted = [...list].sort((a, b) =>
        new Intl.Collator("pt-BR", { sensitivity: "base" }).compare(a.name ?? "", b.name ?? "")
      );
      safeSet(setSystems, sorted);
      safeSet(setStatus, `Carregado ✔️ (${sorted.length})`);
      log("load() OK, count:", sorted.length);
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      safeSet(setStatus, msg);
      toastErrorRef.current?.(msg);
      log("load() ERROR:", e);
    } finally {
      safeSet(setLoading, false);
      inFlightRef.current = false;
      log("load() END");
    }
  }, [safeSet]); // ← sem depender de `error`

  useEffect(() => {
    if (didFetchRef.current) {
      log("useEffect mount: já buscou (StrictMode 2ª passada)");
      return;
    }
    didFetchRef.current = true;
    log("useEffect mount: chamando load()");
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = !t ? systems : systems.filter(s => (s.name ?? "").toLowerCase().includes(t));
    log("filtered memo", { q, in: systems.length, out: out.length });
    return out;
  }, [q, systems]);

  const fields = useMemo<FilterField[]>(
    () => [{ key: "q", type: "text", value: q, onChange: setQ, placeholder: "Buscar por nome...", id: "sys-q", name: "sys-q" }],
    [q]
  );

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setName("");
    setShowModal(true);
  };
  const openEdit = (s: System) => {
    setMode("edit");
    setEditingId(s.id);
    setName(s.name ?? "");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setMode("create");
    setEditingId(null);
    setName("");
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setStatus("Informe o nome do sistema");
      return;
    }
    safeSet(setLoading, true);
    safeSet(setStatus, "");
    try {
      const payload: SystemIn = { name: trimmed };
      if (mode === "create") {
        await api.createSystem(payload);
        success("Sistema criado ✔️");
      } else {
        if (!editingId) throw new Error("ID inválido.");
        await api.updateSystem(editingId, payload);
        success("Sistema atualizado ✔️");
      }
      setShowModal(false);
      await load();
      onChange?.();
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      setStatus(msg);
      toastErrorRef.current?.(msg);
    } finally {
      safeSet(setLoading, false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    safeSet(setLoading, true);
    safeSet(setStatus, "");
    try {
      await api.deleteSystem(selected.id);
      success("Sistema excluído ✔️");
      setShowDelete(false);
      setSelected(null);
      await load();
      onChange?.();
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      setStatus(msg);
      toastErrorRef.current?.(msg);
    } finally {
      safeSet(setLoading, false);
    }
  };

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2>Sistemas</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: 0.8, fontSize: 12 }}>
            Exibindo {filtered.length} de {systems.length}
          </span>
          <Button onClick={openCreate} aria-label="Novo sistema" iconLeft={<PlusIcon />}>
            {BTN.create} sistema
          </Button>
        </div>
      </div>

      <FilterBar fields={fields} onClear={() => setQ("")} />

      {status && <div className="status" role="status" aria-live="polite">{status}</div>}

      <table className="media-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th style={{ width: 180 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading && systems.length === 0 ? (
            <tr><td colSpan={2} style={{ textAlign: "center" }}>{"Carregando..."}</td></tr>
          ) : filtered.length > 0 ? (
            filtered.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  <div role="group" aria-label={`Ações de ${s.name}`} style={{ display: "flex", gap: 8 }}>
                    <Button onClick={() => openEdit(s)} disabled={loading}>Editar</Button>
                    <Button
                      variant="danger"
                      iconLeft={<TrashIcon />}
                      onClick={() => { setSelected(s); setShowDelete(true); }}
                      disabled={loading}
                    >
                      {BTN.delete}
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={2} style={{ textAlign: "center" }}>Nenhum sistema encontrado.</td></tr>
          )}
        </tbody>
      </table>

      <Dialog
        open={showModal}
        title={mode === "create" ? "Novo Sistema" : "Editar Sistema"}
        onClose={closeModal}
        loading={loading}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={loading}>
              {BTN.cancel}
            </Button>
            <Button type="submit" form={formId} loading={loading} disabled={!name.trim() || loading}>
              {loading ? LOADING.saving : (mode === "create" ? BTN.add : (BTN.save ?? "Salvar"))}
            </Button>
          </>
        }
      >
        <form
          id={formId}
          className="row"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          aria-label={mode === "create" ? "Criar sistema" : "Editar sistema"}
        >
          <label htmlFor={nameInputId} style={{ display: "none" }}>Nome do sistema</label>
          <input
            id={nameInputId}
            name="name"
            placeholder="Nome do sistema"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-autofocus
            autoComplete="organization"
            required
            disabled={loading}
          />
        </form>
      </Dialog>

      <ConfirmDialog
        open={showDelete && !!selected}
        title="Excluir Sistema"
        description={<>Tem certeza que deseja excluir <strong>{selected?.name}</strong>?</>}
        loading={loading}
        confirmLabel={BTN.delete}
        confirmVariant="danger"
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
