"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

/* ─── Dual-thumb range slider ─────────────────────────────────────────────── */

const SLIDER_MIN = 0;
const SLIDER_MAX = 5000;
const SLIDER_STEP = 10;

function DualRangeSlider({
  minVal,
  maxVal,
  onChange,
}: {
  minVal: number;
  maxVal: number;
  onChange: (min: number, max: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const pct = (v: number) =>
    ((v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  const valFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN);
    return Math.round(raw / SLIDER_STEP) * SLIDER_STEP;
  }, []);

  const handlePointerDown =
    (thumb: "min" | "max") => (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = thumb;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const v = valFromX(e.clientX);
      if (dragging.current === "min") {
        onChange(Math.min(v, maxVal - SLIDER_STEP), maxVal);
      } else {
        onChange(minVal, Math.max(v, minVal + SLIDER_STEP));
      }
    },
    [minVal, maxVal, onChange, valFromX]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const handleKeyDown =
    (thumb: "min" | "max") => (e: React.KeyboardEvent) => {
      let delta = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = SLIDER_STEP;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -SLIDER_STEP;
      if (!delta) return;
      e.preventDefault();
      if (thumb === "min") {
        const next = Math.max(SLIDER_MIN, Math.min(maxVal - SLIDER_STEP, minVal + delta));
        onChange(next, maxVal);
      } else {
        const next = Math.min(SLIDER_MAX, Math.max(minVal + SLIDER_STEP, maxVal + delta));
        onChange(minVal, next);
      }
    };

  const thumbSize = 24;

  return (
    <div
      style={{ position: "relative", width: "100%", height: 40, touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Track background */}
      <div
        ref={trackRef}
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 4,
          borderRadius: 2,
          background: "var(--fold-border)",
          transform: "translateY(-50%)",
        }}
      />

      {/* Active range */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${pct(minVal)}%`,
          width: `${pct(maxVal) - pct(minVal)}%`,
          height: 4,
          borderRadius: 2,
          background: "var(--fold-accent)",
          transform: "translateY(-50%)",
        }}
      />

      {/* Min thumb */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Minimum expected attendees"
        aria-valuemin={SLIDER_MIN}
        aria-valuemax={SLIDER_MAX}
        aria-valuenow={minVal}
        onPointerDown={handlePointerDown("min")}
        onKeyDown={handleKeyDown("min")}
        style={{
          position: "absolute",
          top: "50%",
          left: `${pct(minVal)}%`,
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          background: "#FFFFFF",
          border: "2px solid var(--fold-text-primary)",
          transform: "translate(-50%, -50%)",
          cursor: "grab",
          zIndex: minVal > SLIDER_MAX - SLIDER_STEP * 2 ? 5 : 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          outline: "none",
        }}
      />

      {/* Max thumb */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Maximum expected attendees"
        aria-valuemin={SLIDER_MIN}
        aria-valuemax={SLIDER_MAX}
        aria-valuenow={maxVal}
        onPointerDown={handlePointerDown("max")}
        onKeyDown={handleKeyDown("max")}
        style={{
          position: "absolute",
          top: "50%",
          left: `${pct(maxVal)}%`,
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          background: "#FFFFFF",
          border: "2px solid var(--fold-text-primary)",
          transform: "translate(-50%, -50%)",
          cursor: "grab",
          zIndex: 4,
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          outline: "none",
        }}
      />
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

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

  function updateAttendees(min: number, max: number) {
    setForm((prev) => ({ ...prev, expectedAttendeesMin: min, expectedAttendeesMax: max }));
  }

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
      <PageHeader title="New event" back="/capture" />

      {error && (
        <div style={{ margin: "0 var(--fold-space-5) var(--fold-space-4)", background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-5)", padding: "0 var(--fold-space-5)" }}>
        {/* Title + Description + Date grouped */}
        <div>
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Title <span style={{ color: "var(--fold-error)" }}>*</span></label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Easter Sunday Service" />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Brief description of the event" />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Date <span style={{ color: "var(--fold-error)" }}>*</span></label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
          </div>
        </div>

        {/* Expected attendees — range slider */}
        <div
          style={{
            border: "1px solid var(--fold-border)",
            borderRadius: "var(--fold-radius-sm)",
            padding: "var(--fold-space-4) var(--fold-space-4) var(--fold-space-5)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--fold-space-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--fold-text-secondary)" }}>
              Expected attendees
            </span>
            <span style={{ fontSize: "var(--fold-type-body)", fontWeight: 600, color: "var(--fold-text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {form.expectedAttendeesMin} &mdash; {form.expectedAttendeesMax}
            </span>
          </div>

          <DualRangeSlider
            minVal={form.expectedAttendeesMin}
            maxVal={form.expectedAttendeesMax}
            onChange={updateAttendees}
          />

        </div>

        {/* Language toggle */}
        <div>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--fold-text-secondary)", display: "block", marginBottom: "var(--fold-space-2)" }}>
            Language
          </span>
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
