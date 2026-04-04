"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/capture";
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("Invalid email or password");
    else router.push(callbackUrl);
  }

  return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", padding: "0 var(--fold-space-6)", overflow: "hidden", position: "fixed", inset: 0 }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: "var(--fold-space-6)" }}>

        <h1 style={{ fontSize: "var(--fold-type-title2)", fontWeight: 600, color: "var(--fold-text-primary)", textAlign: "center" }}>
          Log in or sign up
        </h1>

        {registered && (
          <div style={{ background: "var(--fold-success-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-success)" }}>
            Account created. Please sign in.
          </div>
        )}

        {error && (
          <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>
          {/* Grouped inputs */}
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Password</label>
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" style={{ paddingRight: 48 }} placeholder="Enter your password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fold-text-secondary)", padding: 4 }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading}>Continue</Button>
        </form>

        {/* Divider */}
        <div className="divider-text"><span>or</span></div>

        {/* OAuth */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-3)" }}>
          <button type="button" onClick={() => signIn("google", { callbackUrl })} className="btn-oauth">
            <span className="btn-oauth-icon">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </span>
            <span className="btn-oauth-text">Continue with Google</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-2)" }}>
          <Link href="/auth/forgot-password" style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", textDecoration: "underline" }}>
            Forgot password?
          </Link>
          <span style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
            No account?{" "}
            <Link href="/auth/register" style={{ color: "var(--fold-text-primary)", textDecoration: "underline", fontWeight: 600 }}>
              Create one
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return <Suspense><SignInForm /></Suspense>;
}
