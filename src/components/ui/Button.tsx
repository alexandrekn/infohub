import { type ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  loading,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`ih-btn ih-btn--${variant} ${fullWidth ? "ih-btn--full" : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="ih-btn__spinner" aria-hidden /> : null}
      <span>{loading ? "Enviando..." : children}</span>
    </button>
  );
}
