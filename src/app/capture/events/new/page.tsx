"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";

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

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create event");
      return;
    }

    router.push(`/capture/events/${data.id}`);
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
        <Link href="/capture" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} color="var(--text-primary)" />
        </Link>
        <span style={{ fontSize: "var(--font-subtitle)", fontWeight: 600, color: "var(--text-primary)" }}>New event</span>
        <span style={{ fontSize: "var(--font-body-sm)", color: "var(--text-secondary)" }}>1 of 3</span>
      </div>

      {error && (
        <div style={{ margin: "0 20px 16px", background: "var(--error-light)", padding: 12, borderRadius: 4, fontSize: "var(--font-body-sm)", color: "var(--error)" }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 20px" }}>
        <div>
          <label className="input-label">Title</label>
          <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Easter Sunday Service" />
        </div>

        <div>
          <label className="input-label">Date</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Description</label>
            <span style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)" }}>Optional</span>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Brief description of the event" />
        </div>

        {/* Expected attendees */}
        <div>
          <label className="input-label">Expected attendees</label>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "var(--font-label)", color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Min</span>
              <input type="number" min={0} value={form.expectedAttendeesMin} onChange={(e) => setForm({ ...form, expectedAttendeesMin: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "var(--font-label)", color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Max</span>
              <input type="number" min={0} value={form.expectedAttendeesMax} onChange={(e) => setForm({ ...form, expectedAttendeesMax: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="input-label">Language</label>
          <div style={{ display: "flex", gap: 0, border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
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
                  padding: "10px 0",
                  background: form.primaryLanguage === opt.value ? "var(--brand-light)" : "var(--bg)",
                  color: form.primaryLanguage === opt.value ? "var(--brand)" : "var(--text-secondary)",
                  border: "none",
                  borderRight: opt.value !== "both" ? "1px solid var(--border)" : "none",
                  fontSize: "var(--font-body-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
          {loading ? "Creating..." : "Next"}
        </button>
      </form>
    </div>
  );
}
