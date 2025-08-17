// File: src/components/common/Button.tsx
import React from "react";

export type Variant = "primary" | "danger" | "ghost"; // ⬅️ export
export type Size = "sm" | "md";                       // ⬅️ export

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  const cls = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    loading ? "btn--loading" : "",
    disabled ? "btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {iconLeft ? <span className="btn__icon">{iconLeft}</span> : null}
      <span className="btn__label">{children}</span>
      {iconRight ? <span className="btn__icon">{iconRight}</span> : null}
      {loading ? (
        <svg className="btn__spinner" viewBox="0 0 50 50" aria-hidden="true">
          <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
        </svg>
      ) : null}
    </button>
  );
}
