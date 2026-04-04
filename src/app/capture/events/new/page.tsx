"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

export default function CaptureNewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    date: "",
    description: "",
    expectedAttendeesMin: 50,
    expectedAttendeesMax: 200,
    primaryLanguage: "en",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to create event"); return; }
    router.push(`/capture/events/${data.id}`);
  }

  return (
    <div style={{ background: "var(--fold-bg)", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--fold-space-4) var(--fold-space-5)" }}>
        <PageHeader title="New event" back="/capture" />
        <span style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>1 of 3</span>
      </div>

      {error && (
        <div style={{ margin: "0 var(--fold-space-5) var(--fold-space-4)", background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-5)", padding: "0 var(--fold-space-5)" }}>
        <Input label="Title" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Easter Sunday Service" />
        <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description of the event" helper="Optional" />

        <div>
          <label className="input-label">Expected attendees</label>
          <div style={{ display: "flex", gap: "var(--fold-space-3)" }}>
            <Input label="Min" type="number" min={0} value={form.expectedAttendeesMin} onChange={(e) => setForm({ ...form, expectedAttendeesMin: parseInt(e.target.value) || 0 })} />
            <Input label="Max" type="number" min={0} value={form.expectedAttendeesMax} onChange={(e) => setForm({ ...form, expectedAttendeesMax: parseInt(e.target.value) || 0 })} />
          </div>
        </div>

        <div>
          <label className="input-label">Language</label>
          <div style={{ display: "flex", gap: 0, borderRadius: "var(--fold-radius-sm)", overflow: "hidden", border: "1px solid var(--fold-border)" }}>
            {[
              { value: "en", label: "English" },
              { value: "de", label: "German" },
              { value: "both", label: "Both" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, primaryLanguage: opt.value })}
                style={{
                  flex: 1,
                  padding: "var(--fold-space-3) 0",
                  background: form.primaryLanguage === opt.value ? "var(--fold-accent-light)" : "var(--fold-bg)",
                  color: form.primaryLanguage === opt.value ? "var(--fold-accent)" : "var(--fold-text-secondary)",
                  border: "none",
                  borderRight: opt.value !== "both" ? "1px solid var(--fold-border)" : "none",
                  fontSize: "var(--fold-type-subhead)",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--fold-font)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={loading} style={{ marginTop: "var(--fold-space-2)" }}>Next</Button>
      </form>
    </div>
  );
}
