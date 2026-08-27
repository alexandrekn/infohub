import { forwardRef, type InputHTMLAttributes } from "react";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={`ih-field ${className}`}>
        <label htmlFor={inputId} className="ih-field__label">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`ih-field__input ${error ? "ih-field__input--error" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error ? (
          <span id={`${inputId}-error`} className="ih-field__error">
            {error}
          </span>
        ) : hint ? (
          <span className="ih-field__hint">{hint}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
