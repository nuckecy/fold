"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }
    setSent(true);
  }

  return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", padding: "0 var(--fold-space-6)", position: "fixed", inset: 0 }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>

        <h1 style={{ fontSize: "var(--fold-type-title2)", fontWeight: 600, color: "var(--fold-text-primary)", textAlign: "center" }}>
          Reset password
        </h1>

        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-4)", textAlign: "center" }}>
            <p style={{ fontSize: "var(--fold-type-body)", color: "var(--fold-text-secondary)" }}>
              If an account exists with <strong style={{ color: "var(--fold-text-primary)" }}>{email}</strong>, we have sent a password reset link. Check your inbox.
            </p>
            <Link href="/auth/signin" style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-primary)", textDecoration: "underline", fontWeight: 600 }}>
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", textAlign: "center" }}>
              Enter your email and we will send you a link to reset your password.
            </p>

            {error && (
              <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>
              <div className="input-group">
                <div className="input-wrapper">
                  <label className="input-label">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
                </div>
              </div>

              <Button type="submit" loading={loading}>Send reset link</Button>
            </form>

            <div style={{ textAlign: "center" }}>
              <Link href="/auth/signin" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", textDecoration: "underline" }}>
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
