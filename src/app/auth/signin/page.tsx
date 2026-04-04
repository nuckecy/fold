"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/capture";
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success] = useState(registered ? "Account created. Please sign in." : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "0 32px" }}>
      <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Wordmark */}
        <h1 style={{ fontSize: "var(--font-heading)", fontWeight: 700, color: "var(--brand)", fontFamily: "'Inter', sans-serif" }}>
          Fold
        </h1>

        {success && (
          <div style={{ background: "var(--success-light)", padding: 12, borderRadius: 4, fontSize: "var(--font-body-sm)", color: "var(--success)" }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ background: "var(--error-light)", padding: 12, borderRadius: 4, fontSize: "var(--font-body-sm)", color: "var(--error)" }}>
            {error}
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

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
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Signing in..." : "Log in"}
            </button>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="btn-secondary"
            >
              Continue with Google
            </button>
          </div>
        </form>

        {/* Links */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <Link href="/auth/forgot-password" style={{ fontSize: "var(--font-body-sm)", color: "var(--brand)", textDecoration: "none" }}>
            Forgot password?
          </Link>
          <span style={{ fontSize: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
            No account?{" "}
            <Link href="/auth/register" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
              Create one
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
