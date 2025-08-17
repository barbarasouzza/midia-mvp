// File: src/components/medias/MediaTable.tsx
import type { Media, Line, System, Person } from "../../types";
import Button from "../common/Button";
import { TrashIcon, EditIcon } from "../common/icons";

interface MediaTableProps {
  media: Media[];
  lines: Line[];
  systems: System[];
  people: Person[];
  loading: boolean;
  onEdit: (m: Media) => void;
  onDelete: (m: Media) => void;
}

export default function MediaTable({
  media,
  lines,
  systems,
  people,
  loading,
  onEdit,
  onDelete,
}: MediaTableProps) {
  const getPersonName = (id: number) =>
    people.find((p) => p.id === id)?.name || "Desconhecido";

  const getLineName = (id?: number | null) =>
    id ? lines.find((l) => l.id === id)?.name || "-" : "-";

  const getSystemName = (id?: number | null) =>
    id ? systems.find((s) => s.id === id)?.name || "-" : "-";

  return (
    <table className="media-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Responsável</th>
          <th>Participantes</th>
          <th>Linha</th>
          <th>Sistema</th>
          <th>Link</th>
          <th>Plataforma</th>
          <th>Data</th>
          <th style={{ width: 180 }}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {media.map((m) => {
          const responsavel = (m.people || []).find((p) => p.role === "responsavel");
          const participantes = (m.people || []).filter((p) => p.role === "participante");

          return (
            <tr key={m.id}>
              <td>{m.title}</td>

              <td>
                {responsavel ? (
                  <span className="chip chip-primary" title="Responsável">
                    {getPersonName(responsavel.person_id)}
                  </span>
                ) : (
                  "-"
                )}
              </td>

              <td>
                {participantes.length > 0
                  ? participantes.map((p) => getPersonName(p.person_id)).join(", ")
                  : "-"}
              </td>

              <td>{getLineName(m.line_id)}</td>
              <td>{getSystemName(m.system_id)}</td>

              <td>
                <a href={m.url} target="_blank" rel="noreferrer">
                  Link
                </a>
              </td>

              <td>{m.platform}</td>
              <td>{(m.published_at || "").slice(0, 10)}</td>

              <td style={{ display: "flex", gap: 8 }}>
                <Button
                  variant="ghost"
                  iconLeft={<EditIcon />}
                  onClick={() => onEdit(m)}
                  disabled={loading}
                  aria-label={`Editar ${m.title}`}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  iconLeft={<TrashIcon />}
                  onClick={() => onDelete(m)}
                  disabled={loading}
                  aria-label={`Excluir ${m.title}`}
                >
                  Excluir
                </Button>
              </td>
            </tr>
          );
        })}

        {media.length === 0 && (
          <tr>
            <td colSpan={9} style={{ textAlign: "center", opacity: 0.7 }}>
              Nenhuma mídia cadastrada.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
