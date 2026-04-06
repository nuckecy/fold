"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", padding: "0 var(--fold-space-6)", position: "fixed", inset: 0 }}>
        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: "var(--fold-space-5)", textAlign: "center" }}>
          <h1 style={{ fontSize: "var(--fold-type-title2)", fontWeight: 600, color: "var(--fold-text-primary)" }}>
            Invalid link
          </h1>
          <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
            This password reset link is invalid or has expired.
          </p>
          <Link href="/auth/forgot-password" style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-primary)", textDecoration: "underline", fontWeight: 600 }}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Something went wrong"); return; }
    router.push("/auth/signin?reset=true");
  }

  return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", padding: "0 var(--fold-space-6)", position: "fixed", inset: 0 }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>

        <h1 style={{ fontSize: "var(--fold-type-title2)", fontWeight: 600, color: "var(--fold-text-primary)", textAlign: "center" }}>
          Set new password
        </h1>

        {error && (
          <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">New password</label>
              <input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" style={{ paddingRight: 48 }} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fold-text-secondary)", padding: 4 }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="input-wrapper">
              <label className="input-label">Confirm password</label>
              <input type={showConfirm ? "text" : "password"} required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" style={{ paddingRight: 48 }} placeholder="Re-enter your password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fold-text-secondary)", padding: 4 }}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading}>Reset password</Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
