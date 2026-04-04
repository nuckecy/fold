"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = "", ...props }, ref) => {
    return (
      <div>
        {label && <label className="input-label">{label}</label>}
        <input
          ref={ref}
          className={`input-field ${error ? "error" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-error)", marginTop: 4 }}>
            {error}
          </p>
        )}
        {helper && !error && (
          <p style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)", marginTop: 4 }}>
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, className = "", ...props }, ref) => {
    return (
      <div>
        {label && <label className="input-label">{label}</label>}
        <textarea
          ref={ref}
          className={`input-field ${error ? "error" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-error)", marginTop: 4 }}>
            {error}
          </p>
        )}
        {helper && !error && (
          <p style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)", marginTop: 4 }}>
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = "", children, ...props }, ref) => {
    return (
      <div>
        {label && <label className="input-label">{label}</label>}
        <select ref={ref} className={`input-field ${className}`} {...props}>
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
