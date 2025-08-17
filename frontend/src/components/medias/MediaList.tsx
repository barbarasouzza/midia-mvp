// File: src/components/medias/MediaList.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ApiClient, ApiError } from "../../api/api";
import MediaTable from "./MediaTable";
import EditMediaModal from "./EditMediaModal";
import ConfirmDialog from "../common/ConfirmDialog";

import Button from "../common/Button";
import { BTN } from "../common/strings";
import { PlusIcon } from "../common/icons";
import FilterBar, { type FilterField } from "../common/FilterBar";
import ExportMediaReport from "./ExportMediaReport";

import type {
  Media,
  MediaIn,
  Line,
  System,
  Person,
  MediaPersonLink,
  Platform,
} from "../../types";

const api = new ApiClient();
const DEBUG = false; // coloque true para ver logs

type MediaFormT = Omit<MediaIn, "people"> & { people: MediaPersonLink[] };

interface MediaListProps {
  lines: Line[];
  systems: System[];
  people: Person[];
}

const emptyForm: MediaFormT = {
  title: "",
  platform: "vimeo",
  url: "",
  published_at: "",
  people: [],
};

const toIsoDate = (value?: string) => (value ? value : "");

// ===== Tipo local dos filtros (genérico para FilterBar)
type UiFilters = {
  text: string;
  platform: "" | Platform;
  systemId: number | "";
  lineId: number | "";
  responsavelId: number | "";
  dateFrom: string;
  dateTo: string;
};

export default function MediaList({ lines, systems, people }: MediaListProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // criação
  const [createForm, setCreateForm] = useState<MediaFormT>(emptyForm);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [editForm, setEditForm] = useState<MediaFormT>(emptyForm);

  // exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ----- Guards: StrictMode/unmount/reentrância -----
  const didFetchRef = useRef(false);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const log = (...args: any[]) => { if (DEBUG) console.log("[MediaList]", ...args); };

  const safeSet = useCallback(<T,>(setter: (v: T) => void, v: T) => {
    if (mountedRef.current) setter(v);
  }, []);

  const loadMedia = useCallback(async () => {
    if (inFlightRef.current) {
      log("skip loadMedia(): in-flight");
      return;
    }
    inFlightRef.current = true;
    log("loadMedia() START");

    safeSet(setLoading, true);
    safeSet(setStatus, "");
    try {
      const list = await api.listMedia();
      log("loadMedia() response length:", list.length);
      safeSet(setMedia, list);
      safeSet(setStatus, `Carregado ✔️ (${list.length} mídias)`);
    } catch (e: unknown) {
      const err = e as ApiError;
      const msg = err?.status ? `Erro (${err.status}): ${err.message}` : `Erro: ${String(e)}`;
      safeSet(setStatus, msg);
      log("loadMedia() ERROR:", e);
    } finally {
      safeSet(setLoading, false);
      inFlightRef.current = false;
      log("loadMedia() END");
    }
  }, [safeSet]);

  useEffect(() => {
    if (didFetchRef.current) {
      log("useEffect mount: already fetched (StrictMode 2ª passada)");
      return;
    }
    didFetchRef.current = true;
    log("useEffect mount: calling loadMedia()");
    loadMedia();
  }, [loadMedia]);

  const buildCreatePayload = useCallback((src: MediaFormT): MediaIn => {
    const base: MediaIn = {
      title: src.title.trim(),
      url: src.url.trim(),
      published_at: toIsoDate(src.published_at),
      platform: src.platform,
      people: src.people,
      ...(src.description ? { description: src.description.trim() } : {}),
    };
    return {
      ...base,
      ...(src.line_id !== undefined ? { line_id: src.line_id } : {}),
      ...(src.system_id !== undefined ? { system_id: src.system_id } : {}),
    };
  }, []);

  const buildPatchPayload = useCallback((src: MediaFormT): Partial<MediaIn> => {
    const base: Partial<MediaIn> = {
      title: src.title?.trim(),
      url: src.url?.trim(),
      published_at: toIsoDate(src.published_at),
      platform: src.platform,
      ...(src.description ? { description: src.description.trim() } : {}),
    };
    return {
      ...base,
      ...(src.people ? { people: src.people } : {}),
      ...(src.line_id !== undefined ? { line_id: src.line_id } : {}),
      ...(src.system_id !== undefined ? { system_id: src.system_id } : {}),
    };
  }, []);

  const isValidHttpUrl = (str: string) => {
    try {
      const u = new URL(str);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validateForm = useCallback((f: MediaFormT): string | null => {
    if (!f.title.trim()) return "Informe o título.";
    if (!f.url.trim()) return "Informe a URL.";
    if (!isValidHttpUrl(f.url.trim())) return "URL inválida. Use http(s)://...";
    if (!f.published_at) return "Informe a data.";
    return null;
  }, []);

  const openCreateModal = useCallback(() => {
    setCreateForm(emptyForm);
    setShowCreateModal(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleAdd = useCallback(async () => {
    const msg = validateForm(createForm);
    if (msg) return setStatus(msg);

    setLoading(true);
    setStatus("");
    try {
      await api.createMedia(buildCreatePayload(createForm));
      setCreateForm(emptyForm);
      setShowCreateModal(false);
      await loadMedia();
      setStatus("Mídia adicionada ✔️");
    } catch (e: unknown) {
      const err = e as ApiError;
      setStatus(err?.status ? `Erro (${err.status}): ${err.message}` : `Erro: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [createForm, validateForm, buildCreatePayload, loadMedia]);

  const openEditModal = useCallback((m: Media) => {
    setSelectedMedia(m);
    setEditForm({
      title: m.title ?? "",
      platform: m.platform as Platform,
      url: m.url ?? "",
      published_at: (m.published_at || "").slice(0, 10),
      line_id: m.line_id,
      system_id: m.system_id,
      description: m.description,
      people: (m.people ?? []) as MediaPersonLink[],
    });
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedMedia(null);
    setEditForm(emptyForm);
  }, []);

  const handleEdit = useCallback(async () => {
    if (!selectedMedia) return;

    const msg = validateForm(editForm);
    if (msg) return setStatus(msg);

    setLoading(true);
    setStatus("");
    try {
      await api.updateMediaPartial(selectedMedia.id, buildPatchPayload(editForm));
      closeEditModal();
      await loadMedia();
      setStatus("Mídia atualizada ✔️");
    } catch (e: unknown) {
      const err = e as ApiError;
      setStatus(err?.status ? `Erro (${err.status}): ${err.message}` : `Erro: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [selectedMedia, editForm, validateForm, buildPatchPayload, closeEditModal, loadMedia]);

  const openDeleteModal = useCallback((m: Media) => {
    setSelectedMedia(m);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedMedia(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedMedia) return;
    setLoading(true);
    setStatus("");
    try {
      await api.deleteMedia(selectedMedia.id);
      closeDeleteModal();
      await loadMedia();
      setStatus("Mídia excluída ✔️");
    } catch (e: unknown) {
      const err = e as ApiError;
      setStatus(err?.status ? `Erro (${err.status}): ${err.message}` : `Erro: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [selectedMedia, closeDeleteModal, loadMedia]);

  /* =========================
     Filtros (FilterBar)
  ========================= */
  const [filters, setFilters] = useState<UiFilters>({
    text: "",
    platform: "",
    systemId: "",
    lineId: "",
    responsavelId: "",
    dateFrom: "",
    dateTo: "",
  });

  const toInputDate = (value?: string) => (value ? value.slice(0, 10) : "");

  const visibleLines = useMemo(
    () => (!filters.systemId ? lines : lines.filter((l: any) => (l.system_id ?? null) === filters.systemId)),
    [lines, filters.systemId]
  );

  const clearFilters = useCallback(
    () =>
      setFilters({
        text: "",
        platform: "",
        systemId: "",
        lineId: "",
        responsavelId: "",
        dateFrom: "",
        dateTo: "",
      }),
    []
  );

  const filterFields = useMemo<FilterField[]>(
    () => [
      { key: "text", type: "text", value: filters.text, onChange: (v) => setFilters((f) => ({ ...f, text: v })), placeholder: "Buscar por título, pessoa...", id: "flt-text", name: "flt-text" },
      { key: "platform", type: "select", value: filters.platform || "", onChange: (v) => setFilters((f) => ({ ...f, platform: (v as "" | Platform) || "" })), placeholder: "Plataforma (todas)", options: [{ label: "Vimeo", value: "vimeo" }, { label: "YouTube", value: "youtube" }], id: "flt-platform", name: "flt-platform" },
      { key: "systemId", type: "select", value: filters.systemId, onChange: (v) => setFilters((f) => ({ ...f, systemId: v as number | "", lineId: "" })), placeholder: "Sistema (todos)", options: systems.map((s) => ({ label: s.name, value: s.id })), id: "flt-system", name: "flt-system" },
      { key: "lineId", type: "select", value: filters.lineId, onChange: (v) => setFilters((f) => ({ ...f, lineId: v as number | "" })), placeholder: "Linha (todas)", options: visibleLines.map((l) => ({ label: l.name, value: l.id })), selectProps: { disabled: visibleLines.length === 0 }, id: "flt-line", name: "flt-line" },
      { key: "responsavelId", type: "select", value: filters.responsavelId, onChange: (v) => setFilters((f) => ({ ...f, responsavelId: v as number | "" })), placeholder: "Responsável (todos)", options: people.map((p) => ({ label: p.name, value: p.id })), id: "flt-resp", name: "flt-resp" },
      { key: "dateFrom", type: "date", value: filters.dateFrom, onChange: (v) => setFilters((f) => ({ ...f, dateFrom: v as string })), placeholder: "De", id: "flt-date-from", name: "dateFrom" },
      { key: "dateTo", type: "date", value: filters.dateTo, onChange: (v) => setFilters((f) => ({ ...f, dateTo: v as string })), placeholder: "Até", id: "flt-date-to", name: "dateTo" },
    ],
    [filters, systems, people, visibleLines]
  );

  const filteredMedia = useMemo(() => {
    const t = filters.text.trim().toLowerCase();
    const from = filters.dateFrom || "";
    const to = filters.dateTo || "";

    return media.filter((m) => {
      const titleMatch = (m.title || "").toLowerCase().includes(t);
      const peopleNames = (m.people || [])
        .map((p) => people.find((pp) => pp.id === p.person_id)?.name || "")
        .join(" ")
        .toLowerCase();
      const textOk = !t || titleMatch || peopleNames.includes(t);

      const platformOk = !filters.platform || m.platform === filters.platform;

      const systemOk = !filters.systemId || m.system_id === filters.systemId;
      const lineOk = !filters.lineId || m.line_id === filters.lineId;

      const responsavel = (m.people || []).find((p) => p.role === "responsavel");
      const respOk = !filters.responsavelId || (responsavel && responsavel.person_id === filters.responsavelId);

      const d = toInputDate(m.published_at);
      const fromOk = !from || (d && d >= from);
      const toOk = !to || (d && d <= to);

      return textOk && platformOk && systemOk && lineOk && respOk && fromOk && toOk;
    });
  }, [media, people, filters]);

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2>Mídias</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: 0.8, fontSize: 12 }}>
            Exibindo {filteredMedia.length} de {media.length}
          </span>
          <Button onClick={openCreateModal} aria-label="Criar mídia" iconLeft={<PlusIcon />}>
            {BTN.create} mídia
          </Button>
          <ExportMediaReport media={filteredMedia} lines={lines} systems={systems} people={people} />
        </div>
      </div>

      <FilterBar fields={filterFields} onClear={clearFilters} />

      {status && <div className="status" role="status">{status}</div>}

      <MediaTable
        media={filteredMedia}
        systems={systems}
        lines={lines}
        people={people}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      {/* Modal de CRIAÇÃO — só monta quando abrir */}
      {showCreateModal && (
        <EditMediaModal
          key="create"                // 👈 chave estável
          open
          loading={loading}
          form={createForm}
          setForm={setCreateForm}
          systems={systems}
          lines={lines}
          people={people}
          onClose={closeCreateModal}
          onSave={handleAdd}
          mode="create"
          title="Nova Mídia"
          confirmLabel={BTN.create}
        />
      )}

      {/* Modal de EDIÇÃO — só monta quando abrir e tiver seleção */}
      {showEditModal && selectedMedia && (
        <EditMediaModal
          key={`edit-${selectedMedia.id}`} // 👈 chave estável por item
          open
          loading={loading}
          form={editForm}
          setForm={setEditForm}
          systems={systems}
          lines={lines}
          people={people}
          onClose={closeEditModal}
          onSave={handleEdit}
          mode="edit"
          title="Editar Mídia"
          confirmLabel={BTN.save}
        />
      )}

      <ConfirmDialog
        open={showDeleteModal && !!selectedMedia}
        title="Excluir Mídia"
        description={
          <>
            Tem certeza que deseja excluir a mídia{" "}
            <strong>{selectedMedia?.title}</strong>?
          </>
        }
        confirmLabel="Excluir"
        confirmVariant="danger"
        loading={loading}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </section>
  );
}
