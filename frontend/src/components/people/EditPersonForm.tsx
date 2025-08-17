import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useId } from "react";
import type { PersonIn } from "../../types";

export type EditPersonFormProps = {
  defaultValues?: Partial<PersonIn>;
  loading?: boolean;
  onSubmit: (data: PersonIn) => void | Promise<void>;
  onStateChange?: (state: { dirty: boolean; valid: boolean }) => void;
  formId?: string;
};

export type EditPersonFormHandle = {
  submit: () => void;
  isValid: () => boolean;
  reset: () => void;
};

const EditPersonForm = forwardRef<EditPersonFormHandle, EditPersonFormProps>(
  ({ defaultValues, loading = false, onSubmit, onStateChange, formId }, ref) => {
    const [name, setName] = useState(defaultValues?.name ?? "");
    const [email, setEmail] = useState(defaultValues?.email ?? "");

    const nameId = useId();
    const emailId = useId();

    useEffect(() => {
      setName(defaultValues?.name ?? "");
      setEmail(defaultValues?.email ?? "");
    }, [defaultValues?.name, defaultValues?.email]);

    const trimmedName = name.trim();
    const trimmedEmail = (email ?? "").trim();

    const valid = useMemo(() => !!trimmedName, [trimmedName]);

    const dirty = useMemo(() => {
      const dn = (defaultValues?.name ?? "").trim();
      const de = (defaultValues?.email ?? "").trim();
      return trimmedName !== dn || trimmedEmail !== de;
    }, [trimmedName, trimmedEmail, defaultValues?.name, defaultValues?.email]);

    const prevStateRef = useRef<{ dirty: boolean; valid: boolean } | null>(null);
    const onChangeRef = useRef(onStateChange);
    useEffect(() => { onChangeRef.current = onStateChange; }, [onStateChange]);

    useEffect(() => {
      const next = { dirty, valid };
      const prev = prevStateRef.current;
      if (!prev || prev.dirty !== next.dirty || prev.valid !== next.valid) {
        prevStateRef.current = next;
        onChangeRef.current?.(next);
      }
    }, [dirty, valid]);

    const doSubmit = useCallback(async () => {
      if (!valid || loading) return;
      const payload: PersonIn = { name: trimmedName, email: trimmedEmail || undefined };
      await onSubmit(payload);
    }, [valid, loading, trimmedName, trimmedEmail, onSubmit]);

    useImperativeHandle(ref, () => ({
      submit: () => { hiddenSubmitRef.current?.click(); },
      isValid: () => valid,
      reset: () => {
        setName(defaultValues?.name ?? "");
        setEmail(defaultValues?.email ?? "");
      },
    }));

    const hiddenSubmitRef = useRef<HTMLButtonElement | null>(null);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSubmit();
      }
    }, [doSubmit]);

    return (
      <form
        id={formId}
        className="row"
        aria-label="Formulário de pessoa"
        onKeyDown={onKeyDown}
        onSubmit={(e) => { e.preventDefault(); doSubmit(); }}
      >
        <label htmlFor={nameId} style={{ display: "none" }}>Nome</label>
        <input
          id={nameId}
          name="name"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
          autoComplete="name"
          disabled={loading}
        />

        <label htmlFor={emailId} style={{ display: "none" }}>Email</label>
        <input
          id={emailId}
          name="email"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          disabled={loading}
        />

        <button ref={hiddenSubmitRef} type="submit" style={{ display: "none" }} />
      </form>
    );
  }
);

export default EditPersonForm;
