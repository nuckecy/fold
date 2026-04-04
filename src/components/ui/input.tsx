"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = "", ...props }, ref) => {
    return (
      <div>
        <div className="input-wrapper">
          {label && <label className="input-label">{label}</label>}
          <input
            ref={ref}
            className={`input-field ${error ? "error" : ""} ${className}`}
            {...props}
          />
        </div>
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
        <div className="input-wrapper">
          {label && <label className="input-label">{label}</label>}
          <textarea
            ref={ref}
            className={`input-field ${error ? "error" : ""} ${className}`}
            {...props}
          />
        </div>
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
        <div className="input-wrapper">
          {label && <label className="input-label">{label}</label>}
          <select ref={ref} className={`input-field ${className}`} {...props}>
            {children}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fold-text-secondary)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
