import React, { useId } from "react";

export type FilterOption = { value: string | number; label: string };

type BaseField = {
  key: string;
  label?: string;
  id?: string;          // base id (a gente gera se não vier)
  name?: string;        // name do campo (default: key)
  disabled?: boolean;   // ⬅️ NOVO: pode desabilitar o campo
};

type TextLikeField = BaseField & {
  type: "text" | "number" | "date" | "search";
  value: string | number | undefined;
  onChange: (v: any) => void;
  placeholder?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

type SelectField = BaseField & {
  type: "select";
  value: string | number | undefined;
  onChange: (v: any) => void;
  options: FilterOption[];
  placeholder?: string; // para option vazia
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
};

type CheckboxField = BaseField & {
  type: "checkbox";
  value: boolean;
  onChange: (v: boolean) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

// ⬇️ NOVO tipo: range de datas num único campo
type DateRangeField = {
  type: "daterange";
  key: string;
  value: { from?: string; to?: string };
  onChange: (v: { from?: string; to?: string }) => void;
  label?: string;          // label do grupo
  id?: string;             // base id (gera dois: -from / -to)
  name?: string;           // base name (gera dois: NameFrom / NameTo)
  disabled?: boolean;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

export type FilterField =
  | TextLikeField
  | SelectField
  | CheckboxField
  | DateRangeField; // ⬅️ incluído no union

type Props = {
  fields: FilterField[];
  onClear?: () => void;
  className?: string;
};

export default function FilterBar({ fields, onClear, className = "" }: Props) {
  const barId = useId();

  return (
    <div className={`filter-bar ${className}`.trim()}>
      {fields.map((f) => {
        // base id/name
        const generatedId = (f as any).id ?? `filter-${f.key}-${barId}`;
        const baseName = (f as any).name ?? f.key;
        const isDisabled = (f as any).disabled ?? false;

        switch (f.type) {
          case "select": {
            const field = f as SelectField;
            return (
              <div key={field.key} className="filter-field">
                {field.label ? (
                  <label htmlFor={generatedId} className="filter-label">
                    {field.label}
                  </label>
                ) : null}
                <select
                  id={generatedId}
                  name={baseName}
                  className="filter-input"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    const next =
                      v === "" ? "" : isFinite(Number(v)) && v.trim() !== "" ? Number(v) : v;
                    field.onChange(next);
                  }}
                  disabled={isDisabled || field.selectProps?.disabled}
                  {...(field.selectProps || {})}
                >
                  {field.placeholder !== undefined && (
                    <option value="">{field.placeholder}</option>
                  )}
                  {field.options.map((opt) => (
                    <option key={`${field.key}-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          case "checkbox": {
            const field = f as CheckboxField;
            return (
              <div key={field.key} className="filter-field filter-checkbox">
                <input
                  id={generatedId}
                  name={baseName}
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isDisabled || field.inputProps?.disabled}
                  {...(field.inputProps || {})}
                />
                {field.label ? (
                  <label htmlFor={generatedId} className="filter-label">
                    {field.label}
                  </label>
                ) : null}
              </div>
            );
          }

          case "daterange": {
            const field = f as DateRangeField;
            const fromId = `${generatedId}-from`;
            const toId = `${generatedId}-to`;
            const fromName = `${baseName}From`;
            const toName = `${baseName}To`;
            return (
              <div key={field.key} className="filter-field filter-daterange">
                {field.label ? <div className="filter-label">{field.label}</div> : null}

                <div className="filter-daterange__row">
                  <div className="filter-daterange__col">
                    <label htmlFor={fromId} className="sr-only">De</label>
                    <input
                      id={fromId}
                      name={fromName}
                      type="date"
                      className="filter-input"
                      placeholder={field.fromPlaceholder ?? "De"}
                      value={field.value.from ?? ""}
                      onChange={(e) => field.onChange({ ...field.value, from: e.target.value })}
                      disabled={isDisabled || field.inputProps?.disabled}
                      {...(field.inputProps || {})}
                    />
                  </div>

                  <div className="filter-daterange__col">
                    <label htmlFor={toId} className="sr-only">Até</label>
                    <input
                      id={toId}
                      name={toName}
                      type="date"
                      className="filter-input"
                      placeholder={field.toPlaceholder ?? "Até"}
                      value={field.value.to ?? ""}
                      onChange={(e) => field.onChange({ ...field.value, to: e.target.value })}
                      disabled={isDisabled || field.inputProps?.disabled}
                      {...(field.inputProps || {})}
                    />
                  </div>
                </div>
              </div>
            );
          }

          default: {
            const field = f as TextLikeField;
            return (
              <div key={field.key} className="filter-field">
                {field.label ? (
                  <label htmlFor={generatedId} className="filter-label">
                    {field.label}
                  </label>
                ) : null}
                <input
                  id={generatedId}
                  name={baseName}
                  type={field.type === "text" ? "text" : field.type}
                  className="filter-input"
                  placeholder={field.placeholder}
                  value={(field.value as any) ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={isDisabled || field.inputProps?.disabled}
                  {...(field.inputProps || {})}
                />
              </div>
            );
          }
        }
      })}

      {onClear ? (
        <button type="button" className="filter-clear" onClick={onClear}>
          Limpar
        </button>
      ) : null}
    </div>
  );
}
