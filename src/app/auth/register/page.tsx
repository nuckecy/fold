"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    country: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    router.push("/auth/signin?registered=true");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "0 32px" }}>
      <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", gap: 32, padding: "40px 0" }}>
        <h1 style={{ fontSize: "var(--font-heading)", fontWeight: 700, color: "var(--brand)" }}>
          Fold
        </h1>

        {error && (
          <div style={{ background: "var(--error-light)", padding: 12, borderRadius: 4, fontSize: "var(--font-body-sm)", color: "var(--error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="input-label">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field" placeholder="John Doe" />
          </div>

          <div>
            <label className="input-label">Email</label>
            <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" placeholder="you@example.com" />
          </div>

          <div>
            <label className="input-label">Organization</label>
            <input type="text" required value={form.organization} onChange={(e) => update("organization", e.target.value)} className="input-field" placeholder="RCCG Example Parish" />
          </div>

          <div>
            <label className="input-label">Country</label>
            <div style={{ position: "relative" }}>
              <select required value={form.country} onChange={(e) => update("country", e.target.value)} className="input-field" style={{ appearance: "none", paddingRight: 36 }}>
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
              <ChevronDown size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }} />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input-field"
                style={{ paddingRight: 44 }}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating account..." : "Create account"}
            </button>

            <button type="button" onClick={() => signIn("google", { callbackUrl: "/capture" })} className="btn-secondary">
              Continue with Google
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", fontSize: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
          We will send a verification email
        </p>
      </div>
    </div>
  );
}
