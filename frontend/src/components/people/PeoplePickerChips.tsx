import { useMemo, useRef, useState, useEffect, useId } from "react";
import type { Person } from "../../types";

type Props = {
  people: Person[];
  responsavelId?: number;               // 0/undefined = nenhum
  participantesIds: number[];           // array de IDs
  onChange: (next: { responsavelId?: number; participantesIds: number[] }) => void;
};

export default function PeoplePickerChips({
  people, responsavelId, participantesIds, onChange,
}: Props) {
  // -------- Responsável --------
  const resp = useMemo(() => people.find(p => p.id === responsavelId), [people, responsavelId]);
  const availableForResp = useMemo(
    () => people.filter(p => !participantesIds.includes(p.id)),
    [people, participantesIds]
  );

  // -------- Participantes --------
  const participantes = useMemo(
    () => participantesIds.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[],
    [participantesIds, people]
  );
  const availableForParts = useMemo(
    () => people.filter(p => p.id !== responsavelId && !participantesIds.includes(p.id)),
    [people, responsavelId, participantesIds]
  );

  return (
    <div className="people-picker">
      {/* RESPONSÁVEL */}
      <section className="pp-section">
        <label className="pp-label">Responsável</label>
        <div className="pp-field">
          {resp ? (
            <Chip
              text={resp.name}
              onRemove={() => onChange({ responsavelId: undefined, participantesIds })}
              variant="primary"
              title="Remover responsável"
            />
          ) : (
            <AutocompleteInput
              name="responsavel"
              placeholder="Buscar pessoa para responsável..."
              options={availableForResp}
              onSelect={(p) => onChange({ responsavelId: p.id, participantesIds })}
            />
          )}
        </div>
      </section>

      {/* PARTICIPANTES */}
      <section className="pp-section">
        <label className="pp-label">Participantes</label>
        <div className="pp-chips">
          {participantes.map(p => (
            <Chip
              key={p.id}
              text={p.name}
              onRemove={() =>
                onChange({
                  responsavelId,
                  participantesIds: participantesIds.filter(id => id !== p.id),
                })
              }
              title="Remover participante"
            />
          ))}
        </div>
        <div className="pp-field">
          <AutocompleteInput
            name="participantes"
            placeholder="Adicionar participante..."
            options={availableForParts}
            onSelect={(p) =>
              onChange({
                responsavelId,
                participantesIds: [...participantesIds, p.id],
              })
            }
          />
        </div>
      </section>
    </div>
  );
}

/* ----------------- Chip ----------------- */
function Chip({
  text, onRemove, variant = "default", title,
}: { text: string; onRemove: () => void; variant?: "default" | "primary"; title?: string }) {
  return (
    <span className={`chip chip-${variant}`} title={title}>
      <span className="chip-text">{text}</span>
      <button className="chip-x" onClick={onRemove} aria-label={`Remover ${text}`} type="button">×</button>
    </span>
  );
}

/* ------------- Autocomplete ------------- */
function AutocompleteInput({
  options, onSelect, placeholder, name,
}: {
  options: Person[];
  onSelect: (p: Person) => void;
  placeholder?: string;
  name?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // IDs para a11y
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 20);
    return options.filter(p => (p.name ?? "").toLowerCase().includes(q)).slice(0, 20);
  }, [options, query]);

  useEffect(() => { setHighlight(0); }, [query, open]);

  const selectIndex = (idx: number) => {
    const item = filtered[idx];
    if (item) {
      onSelect(item);
      setQuery("");
      setOpen(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const activeId = filtered[highlight] ? `${baseId}-opt-${filtered[highlight].id}` : undefined;

  return (
    <div
      className="ac"
      role="combobox"
      aria-haspopup="listbox"
      aria-owns={listId}
      aria-expanded={open}
    >
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        className="ac-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight(h => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight(h => Math.max(h - 1, 0));
          } else if (e.key === "Home") {
            e.preventDefault();
            setHighlight(0);
          } else if (e.key === "End") {
            e.preventDefault();
            setHighlight(Math.max(0, filtered.length - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            selectIndex(highlight);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={open ? activeId : undefined}
      />
      {open && filtered.length > 0 && (
        <ul className="ac-list" id={listId} role="listbox">
          {filtered.map((p, idx) => (
            <li
              key={p.id}
              id={`${baseId}-opt-${p.id}`}
              className={`ac-item ${idx === highlight ? "is-active" : ""}`}
              role="option"
              aria-selected={idx === highlight}
              onMouseDown={(e) => e.preventDefault()} // evita blur antes do click
              onClick={() => selectIndex(idx)}
            >
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
