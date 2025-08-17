// File: src/components/PeopleList.tsx
import { useState, useEffect, useMemo, useCallback, useRef, useId } from "react";
import type { Person, PersonIn } from "../types";
import { ApiClient, ApiError } from "../api/api";
import { useToast } from "./common/toast";
import FilterBar, { type FilterField } from "./common/FilterBar";
import Dialog from "./common/Dialog";
import ConfirmDialog from "./common/ConfirmDialog";
import Button from "./common/Button";
import { BTN, LOADING } from "./common/strings";
import { PlusIcon, TrashIcon } from "./common/icons";
import EditPersonForm from "./people/EditPersonForm";

const api = new ApiClient();

type Props = { onChange?: () => void };

export default function PeopleList({ onChange }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  // confirmação de exclusão
  const [showDelete, setShowDelete] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // filtros
  const [q, setQ] = useState("");

  // criação/edição
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDefaults, setFormDefaults] = useState<Partial<PersonIn>>({ name: "", email: "" });
  const [formState, setFormState] = useState<{ dirty: boolean; valid: boolean }>({ dirty: false, valid: false });

  // submit do form via botão no footer do Dialog
  const modalFormId = useId();

  // ---- Proteções: StrictMode & unmount ----
  const didFetchRef = useRef(false);    // evita 2ª chamada do StrictMode no DEV
  const inFlightRef = useRef(false);    // evita reentrância
  const mountedRef = useRef(true);      // evita setState após unmount
  useEffect(() => () => { mountedRef.current = false; }, []);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, v: T) => {
    if (mountedRef.current) setter(v);
  }, []);

  const loadPeople = useCallback(async () => {
    if (inFlightRef.current) return; // já tem uma request rolando
    inFlightRef.current = true;

    safeSet(setLoading, true);
    safeSet(setStatus, "");
    try {
      const list = await api.listPeople();
      const sorted = [...list].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
      );
      safeSet(setPeople, sorted);
      safeSet(setStatus, `Carregado ✔️ (${sorted.length} pessoas)`);
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      safeSet(setStatus, msg);
      error(msg);
    } finally {
      safeSet(setLoading, false);
      inFlightRef.current = false;
    }
  }, [error, safeSet]);

  useEffect(() => {
    if (didFetchRef.current) return; // evita a 2ª chamada do StrictMode (apenas DEV)
    didFetchRef.current = true;
    loadPeople();
  }, [loadPeople]);

  const filteredPeople = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return people;
    return people.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const mail = (p.email || "").toLowerCase();
      return name.includes(t) || mail.includes(t);
    });
  }, [people, q]);

  const fields = useMemo<FilterField[]>(
    () => [{ key: "q", type: "text", value: q, onChange: setQ, placeholder: "Buscar por nome ou e-mail..." }],
    [q]
  );

  // abrir modal criar/editar
  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setFormDefaults({ name: "", email: "" });
    setFormState({ dirty: false, valid: false });
    setShowModal(true);
  };
  const openEdit = (p: Person) => {
    setMode("edit");
    setEditingId(p.id);
    setFormDefaults({ name: p.name || "", email: p.email || "" });
    setFormState({ dirty: false, valid: !!(p.name && p.name.trim()) });
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setMode("create");
    setEditingId(null);
    setFormDefaults({ name: "", email: "" });
    setFormState({ dirty: false, valid: false });
  };

  // submit do formulário (create/edit)
  const submitPerson = useCallback(async (data: PersonIn) => {
    setStatus("");
    setLoading(true);
    try {
      if (mode === "create") {
        await api.createPerson(data);
        success("Pessoa adicionada ✔️");
      } else {
        if (!editingId) throw new Error("ID inválido para edição.");
        await api.updatePerson(editingId, data);
        success("Pessoa atualizada ✔️");
      }
      setShowModal(false);
      await loadPeople();
      onChange?.();
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      setStatus(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  }, [mode, editingId, loadPeople, onChange, success, error]);

  // exclusão (confirmada)
  const handleDelete = useCallback(async () => {
    if (!selectedPerson || loading) return;
    setLoading(true);
    setStatus("");
    try {
      await api.deletePerson(selectedPerson.id);
      setShowDelete(false);
      setSelectedPerson(null);
      await loadPeople();
      onChange?.();
      success("Pessoa excluída ✔️");
    } catch (e: any) {
      const msg = e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e);
      setStatus(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedPerson, loading, loadPeople, onChange, success, error]);

  const onFormStateChange = useCallback((s: { dirty: boolean; valid: boolean }) => {
    setFormState(s);
  }, []);

  return (
    <section className="card" aria-labelledby="people-title">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 id="people-title">Pessoas</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: 0.8, fontSize: 12 }}>
            Exibindo {filteredPeople.length} de {people.length}
          </span>
          <Button onClick={openCreate} aria-label="Nova pessoa" iconLeft={<PlusIcon />}>
            {BTN.create} pessoa
          </Button>
        </div>
      </div>

      <FilterBar fields={fields} onClear={() => setQ("")} />

      {status && <div className="status" role="status" aria-live="polite">{status}</div>}

      <table className="media-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th style={{ width: 220 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading && people.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", opacity: 0.7 }}>{"Carregando..."}</td>
            </tr>
          ) : filteredPeople.length > 0 ? (
            filteredPeople.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email || "-"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => openEdit(p)} disabled={loading} aria-label={`Editar ${p.name}`}>
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    iconLeft={<TrashIcon />}
                    onClick={() => { setSelectedPerson(p); setShowDelete(true); }}
                    disabled={loading}
                    aria-label={`Excluir ${p.name}`}
                  >
                    {BTN.delete}
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", opacity: 0.7 }}>Nenhuma pessoa encontrada.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal criar/editar */}
      <Dialog
        open={showModal}
        title={mode === "create" ? "Nova Pessoa" : "Editar Pessoa"}
        onClose={closeModal}
        loading={loading}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={loading}>
              {BTN.cancel}
            </Button>
            {/* submit nativo do <form id={modalFormId}> do EditPersonForm */}
            <Button
              type="submit"
              form={modalFormId}
              disabled={!formState.valid || loading}
              loading={loading}
              iconLeft={<PlusIcon />}
            >
              {loading ? LOADING.saving : (mode === "create" ? BTN.add : (BTN.save ?? "Salvar"))}
            </Button>
          </>
        }
      >
        <EditPersonForm
          formId={modalFormId}
          defaultValues={formDefaults}
          loading={loading}
          onStateChange={onFormStateChange}
          onSubmit={submitPerson}
        />
      </Dialog>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={showDelete && !!selectedPerson}
        title="Excluir Pessoa"
        description={<>Tem certeza que deseja excluir <strong>{selectedPerson?.name}</strong>?</>}
        confirmLabel={BTN.delete}
        confirmVariant="danger"
        loading={loading}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
