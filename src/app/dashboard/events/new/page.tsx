"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    date: "",
    description: "",
    primaryLanguage: "en",
    secondaryLanguage: "",
    expectedAttendeesMin: "",
    expectedAttendeesMax: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        date: form.date,
        description: form.description || undefined,
        primaryLanguage: form.primaryLanguage,
        secondaryLanguage: form.secondaryLanguage || undefined,
        expectedAttendeesMin: form.expectedAttendeesMin
          ? parseInt(form.expectedAttendeesMin)
          : undefined,
        expectedAttendeesMax: form.expectedAttendeesMax
          ? parseInt(form.expectedAttendeesMax)
          : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create event");
      return;
    }

    router.push(`/dashboard/events/${data.id}`);
  }

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-3)" }}>
        <Link href="/dashboard/events" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", textDecoration: "none" }}>
          <ArrowLeft size={14} />
          Back to events
        </Link>
        <h1 style={{ fontSize: "var(--fold-type-title2)", fontWeight: 600, color: "var(--fold-text-primary)" }}>
          Create event
        </h1>
      </div>

      {error && (
        <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-5)" }}>
        {/* Event title + Event date */}
        <div className="input-group">
          <div className="input-wrapper">
            <label className="input-label">Event title</label>
            <input type="text" required value={form.title} onChange={(e) => update("title", e.target.value)} className="input-field" placeholder="e.g. Sunday Service - New Converts" />
          </div>
          <div className="input-wrapper">
            <label className="input-label">Event date</label>
            <input type="date" required value={form.date} onChange={(e) => update("date", e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Description */}
        <div className="input-group">
          <div className="input-wrapper">
            <label className="input-label">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="input-field" rows={3} />
          </div>
        </div>

        {/* Primary language + Secondary language */}
        <div className="input-group">
          <div className="input-wrapper">
            <label className="input-label">Primary language</label>
            <select value={form.primaryLanguage} onChange={(e) => update("primaryLanguage", e.target.value)} className="input-field">
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
            <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fold-text-secondary)", pointerEvents: "none" }} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">Secondary language</label>
            <select value={form.secondaryLanguage} onChange={(e) => update("secondaryLanguage", e.target.value)} className="input-field">
              <option value="">None</option>
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
            <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fold-text-secondary)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Expected attendees */}
        <div className="input-group">
          <div className="input-wrapper">
            <label className="input-label">Expected min attendees</label>
            <input type="number" min="0" value={form.expectedAttendeesMin} onChange={(e) => update("expectedAttendeesMin", e.target.value)} className="input-field" placeholder="e.g. 50" />
          </div>
          <div className="input-wrapper">
            <label className="input-label">Expected max attendees</label>
            <input type="number" min="0" value={form.expectedAttendeesMax} onChange={(e) => update("expectedAttendeesMax", e.target.value)} className="input-field" placeholder="e.g. 200" />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-3)" }}>
          <Button type="submit" loading={loading}>Create event</Button>
          <Button variant="secondary" type="button" onClick={() => router.push("/dashboard/events")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
