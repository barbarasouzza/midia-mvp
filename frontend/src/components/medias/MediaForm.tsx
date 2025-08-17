// File: src/components/MediaForm.tsx
import { useMemo, useCallback } from "react";
import PeoplePickerChips from "../people/PeoplePickerChips";
import type {
  Line,
  System,
  Person,
  MediaIn,
  MediaPersonLink,
  Platform,
} from "../../types";

// mesmo tipo do container
type MediaFormT = Omit<MediaIn, "people"> & { people: MediaPersonLink[] };

interface MediaFormProps {
  form: MediaFormT;
  setForm: React.Dispatch<React.SetStateAction<MediaFormT>>;
  lines: Line[];
  systems: System[];
  people: Person[];
}

export default function MediaForm({
  form,
  setForm,
  lines,
  systems,
  people,
}: MediaFormProps) {
  // derivados
  const currentResponsavelId = useMemo(
    () => form.people.find((p) => p.role === "responsavel")?.person_id,
    [form.people]
  );

  const currentParticipantesIds = useMemo(
    () => form.people.filter((p) => p.role === "participante").map((p) => p.person_id),
    [form.people]
  );

  // handlers de pessoas
  const setResponsavel = useCallback((id: number | undefined) => {
    setForm((f) => {
      let people = f.people.filter((p) => p.role !== "responsavel");
      if (id !== undefined) {
        // remove de participantes se já estiver
        people = people.filter(
          (p) => !(p.role === "participante" && p.person_id === id)
        );
        people = [...people, { person_id: id, role: "responsavel" }];
      }
      return { ...f, people };
    });
  }, [setForm]);

  const setParticipantes = useCallback((ids: number[]) => {
    setForm((f) => {
      let people = f.people.filter((p) => p.role !== "participante");
      const respId = people.find((p) => p.role === "responsavel")?.person_id;
      const cleaned = ids.filter((pid) => pid !== respId);
      const novos = cleaned.map((pid) => ({ person_id: pid, role: "participante" as const }));
      return { ...f, people: [...people, ...novos] };
    });
  }, [setForm]);

  return (
    <>
      <input
        placeholder="Título"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        aria-label="Título"
      />

      <PeoplePickerChips
        people={people}
        responsavelId={currentResponsavelId}
        participantesIds={currentParticipantesIds}
        onChange={({ responsavelId, participantesIds }) => {
          setResponsavel(responsavelId);
          setParticipantes(participantesIds);
        }}
      />

      <input
        placeholder="URL"
        value={form.url}
        onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        aria-label="URL"
      />

      <input
        type="date"
        value={form.published_at}
        onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
        aria-label="Data de publicação"
      />

      <select
        value={form.platform}
        onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform }))}
        aria-label="Plataforma"
      >
        <option value="vimeo">Vimeo</option>
        <option value="youtube">YouTube</option>
      </select>

      <select
        value={form.line_id ?? ""}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            line_id: e.target.value ? Number(e.target.value) : undefined,
          }))
        }
        aria-label="Linha"
      >
        <option value="">-- Linha --</option>
        {lines.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <select
        value={form.system_id ?? ""}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            system_id: e.target.value ? Number(e.target.value) : undefined,
          }))
        }
        aria-label="Sistema"
      >
        <option value="">-- Sistema --</option>
        {systems.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </>
  );
}
