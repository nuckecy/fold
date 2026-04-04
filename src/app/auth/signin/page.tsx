"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--fold-bg)", padding: "0 var(--fold-space-8)", overflow: "hidden", position: "fixed", inset: 0 }}>
      <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", gap: "var(--fold-space-6)" }}>
        {/* Wordmark */}
        <h1 style={{ fontSize: "var(--fold-type-title1)", fontWeight: 700, color: "var(--fold-accent)", letterSpacing: "-0.03em" }}>
          Fold
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
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

          <div>
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingRight: 44 }}
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fold-text-secondary)", padding: 4 }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-3)" }}>
            <Button type="submit" loading={loading}>Log in</Button>
            <Button variant="secondary" type="button" onClick={() => signIn("google", { callbackUrl })}>
              Continue with Google
            </Button>
          </div>
        </form>

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
