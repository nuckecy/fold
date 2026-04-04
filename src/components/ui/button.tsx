"use client";

import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text" | "ghost" | "destructive";
  size?: "default" | "small";
  loading?: boolean;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", loading, children, className = "", disabled, ...props }, ref) => {
    const cls =
      variant === "primary" ? "btn-primary" :
      variant === "secondary" ? "btn-secondary" :
      variant === "text" ? "btn-text" :
      variant === "ghost" ? "btn-ghost" :
      variant === "destructive" ? "btn-primary" : "btn-primary";

    const style = {
      ...(size === "small" ? { height: 40, fontSize: "var(--fold-type-subhead)" } : {}),
      ...(variant === "destructive" ? { background: "var(--fold-error)" } : {}),
    };

    return (
      <button
        ref={ref}
        className={`${cls} ${className}`}
        disabled={disabled || loading}
        style={style}
        {...props}
      >
        {loading ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="40" strokeDashoffset="10" opacity="0.4" />
          </svg>
        ) : children}
      </button>
    );
  }
);
Button.displayName = "Button";
