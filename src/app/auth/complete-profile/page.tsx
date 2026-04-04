"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({ organization: "", country: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to update profile");
      return;
    }

    router.push("/capture");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "0 32px" }}>
      <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", gap: 32 }}>
        <h1 style={{ fontSize: "var(--font-heading)", fontWeight: 700, color: "var(--brand)" }}>
          Fold
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 style={{ fontSize: "var(--font-subtitle)", fontWeight: 600, color: "var(--text-primary)" }}>
            Complete your profile
          </h2>
          <p style={{ fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>
            We need a few more details to get you started.
          </p>
        </div>

        {error && (
          <div style={{ background: "var(--error-light)", padding: 12, borderRadius: 4, fontSize: "var(--font-body-sm)", color: "var(--error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="input-label">Organization</label>
            <input type="text" required value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="input-field" placeholder="RCCG Example Parish" />
          </div>

          <div>
            <label className="input-label">Country</label>
            <div style={{ position: "relative" }}>
              <select required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input-field" style={{ appearance: "none", paddingRight: 36 }}>
                <option value="">Select country</option>
                <option value="DE">Germany</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="NG">Nigeria</option>
                <option value="GH">Ghana</option>
                <option value="ZA">South Africa</option>
                <option value="KE">Kenya</option>
                <option value="CA">Canada</option>
              </select>
              <ChevronDown size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
            {loading ? "Saving..." : "Complete setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
