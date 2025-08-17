import { useMemo } from "react";
import type { Line, System, Person, Platform } from "../../types";

export type MediaFilterState = {
  text: string;
  platform: "" | Platform;
  systemId: number | "";
  lineId: number | "";
  responsavelId: number | "";
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
};

type Props = {
  value: MediaFilterState;
  onChange: (next: MediaFilterState) => void;
  lines: Line[];
  systems: System[];
  people: Person[];
};

export default function MediaFilters({ value, onChange, lines, systems, people }: Props) {
  const { text, platform, systemId, lineId, responsavelId, dateFrom, dateTo } = value;

  // Se sistema selecionado, mostra só as linhas dele
  const visibleLines = useMemo(() => {
    if (!systemId) return lines;
    return lines.filter(l => (l.system_id ?? null) === systemId);
  }, [lines, systemId]);

  const set = <K extends keyof MediaFilterState>(key: K, v: MediaFilterState[K]) =>
    onChange({ ...value, [key]: v });

  const clear = () =>
    onChange({
      text: "",
      platform: "",
      systemId: "",
      lineId: "",
      responsavelId: "",
      dateFrom: "",
      dateTo: "",
    });

  return (
    <div className="filters">
      <div className="filters-row">
        <input
          className="filters-input"
          placeholder="Buscar por título, pessoa..."
          value={text}
          onChange={(e) => set("text", e.target.value)}
          aria-label="Buscar"
        />

        <select
          className="filters-select"
          value={platform}
          onChange={(e) => set("platform", (e.target.value || "") as "" | Platform)}
          aria-label="Plataforma"
        >
          <option value="">Plataforma (todas)</option>
          <option value="vimeo">Vimeo</option>
          <option value="youtube">YouTube</option>
        </select>

        <select
          className="filters-select"
          value={systemId}
          onChange={(e) => set("systemId", e.target.value ? Number(e.target.value) : "")}
          aria-label="Sistema"
        >
          <option value="">Sistema (todos)</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="filters-select"
          value={lineId}
          onChange={(e) => set("lineId", e.target.value ? Number(e.target.value) : "")}
          aria-label="Linha"
          disabled={visibleLines.length === 0}
        >
          <option value="">Linha (todas)</option>
          {visibleLines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          className="filters-select"
          value={responsavelId}
          onChange={(e) => set("responsavelId", e.target.value ? Number(e.target.value) : "")}
          aria-label="Responsável"
        >
          <option value="">Responsável (todos)</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="filters-input"
          value={dateFrom}
          onChange={(e) => set("dateFrom", e.target.value)}
          aria-label="De (data)"
        />
        <input
          type="date"
          className="filters-input"
          value={dateTo}
          onChange={(e) => set("dateTo", e.target.value)}
          aria-label="Até (data)"
        />

        <button className="filters-clear" onClick={clear} aria-label="Limpar filtros">
          Limpar
        </button>
      </div>
    </div>
  );
}
