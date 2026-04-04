"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--fold-bg)", padding: "0 var(--fold-space-8)" }}>
      <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", gap: "var(--fold-space-8)", padding: "var(--fold-space-10) 0" }}>
        <h1 style={{ fontSize: "var(--fold-type-title1)", fontWeight: 700, color: "var(--fold-accent)", letterSpacing: "-0.03em" }}>
          Fold
        </h1>

        {error && (
          <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-4)" }}>
          <Input label="Full name" type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
          <Input label="Organization" type="text" required value={form.organization} onChange={(e) => update("organization", e.target.value)} placeholder="RCCG Example Parish" />

          <Select label="Country" required value={form.country} onChange={(e) => update("country", e.target.value)}>
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
          </Select>

          <div>
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field" style={{ paddingRight: 44 }} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fold-text-secondary)", padding: 4 }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-3)", marginTop: "var(--fold-space-2)" }}>
            <Button type="submit" loading={loading}>Create account</Button>
            <Button variant="secondary" type="button" onClick={() => signIn("google", { callbackUrl: "/capture" })}>
              Continue with Google
            </Button>
          </div>
        </form>

        <p style={{ textAlign: "center", fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
          We will send a verification email
        </p>
      </div>
    </div>
  );
}
