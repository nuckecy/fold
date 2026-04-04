"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({ organization: "", country: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/complete-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to update profile"); return; }
    router.push("/capture");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--fold-bg)", padding: "0 var(--fold-space-8)" }}>
      <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", gap: "var(--fold-space-8)" }}>
        <h1 style={{ fontSize: "var(--fold-type-title1)", fontWeight: 700, color: "var(--fold-accent)", letterSpacing: "-0.03em" }}>Fold</h1>

        <div>
          <h2 style={{ fontSize: "var(--fold-type-title3)", fontWeight: 600, color: "var(--fold-text-primary)", letterSpacing: "-0.02em" }}>Complete your profile</h2>
          <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", marginTop: "var(--fold-space-1)" }}>We need a few more details to get you started.</p>
        </div>

        {error && (
          <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-4)" }}>
          <Input label="Organization" type="text" required value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="RCCG Example Parish" />

          <Select label="Country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
            <option value="">Select country</option>
            <option value="DE">Germany</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="NG">Nigeria</option>
            <option value="GH">Ghana</option>
            <option value="ZA">South Africa</option>
            <option value="KE">Kenya</option>
            <option value="CA">Canada</option>
          </Select>

          <Button type="submit" loading={loading} style={{ marginTop: "var(--fold-space-2)" }}>Complete setup</Button>
        </form>
      </div>
    </div>
  );
}
