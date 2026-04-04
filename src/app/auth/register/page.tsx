"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", organization: "", country: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    router.push("/auth/signin?registered=true");
  }

  return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", padding: "0 var(--fold-space-6)", position: "fixed", inset: 0, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: "var(--fold-space-5)", padding: "var(--fold-space-6) 0" }}>

        <h1 style={{ fontSize: "var(--fold-type-title2)", fontWeight: 600, color: "var(--fold-text-primary)", textAlign: "center" }}>
          Finish signing up
        </h1>

        {error && (
          <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>
          {/* Name group */}
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Full name</label>
              <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field" placeholder="John Doe" />
            </div>
          </div>
          <p style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)", marginTop: -12 }}>
            Make sure it matches the name on your government ID.
          </p>

          {/* Email */}
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Email</label>
              <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" placeholder="you@example.com" />
            </div>
          </div>

          {/* Organization */}
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Organization</label>
              <input type="text" required value={form.organization} onChange={(e) => update("organization", e.target.value)} className="input-field" placeholder="RCCG Example Parish" />
            </div>
          </div>

          {/* Country */}
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Country</label>
              <select required value={form.country} onChange={(e) => update("country", e.target.value)} className="input-field">
                <option value="">Select country</option>
                <option value="DE">Germany</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="NG">Nigeria</option>
                <option value="GH">Ghana</option>
                <option value="ZA">South Africa</option>
                <option value="KE">Kenya</option>
                <option value="CA">Canada</option>
                <option value="FR">France</option>
                <option value="NL">Netherlands</option>
                <option value="AT">Austria</option>
                <option value="CH">Switzerland</option>
              </select>
              <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fold-text-secondary)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Password</label>
              <input type={showPassword ? "text" : "password"} required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field" style={{ paddingRight: 48 }} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fold-text-secondary)", padding: 4 }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading}>Agree and continue</Button>
        </form>

        {/* Divider */}
        <div className="divider-text"><span>or</span></div>

        {/* OAuth */}
        <button type="button" onClick={() => signIn("google", { callbackUrl: "/capture" })} className="btn-oauth">
          <span className="btn-oauth-icon">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          </span>
          <span className="btn-oauth-text">Continue with Google</span>
        </button>

        <p style={{ textAlign: "center", fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/auth/signin" style={{ color: "var(--fold-text-primary)", textDecoration: "underline", fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
