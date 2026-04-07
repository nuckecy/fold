"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Single-thumb slider ─────────────────────────────────────────────────── */

const SLIDER_MIN = 1;
const SLIDER_MAX = 5000;
const SLIDER_STEP = 10;

function AttendeeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pct = (v: number) =>
    ((v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  const valFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return SLIDER_MIN;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN);
    return Math.max(SLIDER_MIN, Math.round(raw / SLIDER_STEP) * SLIDER_STEP);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      onChange(valFromX(e.clientX));
    },
    [onChange, valFromX]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = SLIDER_STEP;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -SLIDER_STEP;
    if (!delta) return;
    e.preventDefault();
    onChange(Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, value + delta)));
  };

  const thumbSize = 24;

  return (
    <div
      style={{ position: "relative", width: "100%", height: 40, touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div ref={trackRef} style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 4, borderRadius: 2, background: "var(--fold-border)", transform: "translateY(-50%)" }} />
      <div style={{ position: "absolute", top: "50%", left: 0, width: `${pct(value)}%`, height: 4, borderRadius: 2, background: "var(--fold-accent)", transform: "translateY(-50%)" }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Expected attendees"
        aria-valuemin={SLIDER_MIN}
        aria-valuemax={SLIDER_MAX}
        aria-valuenow={value}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        style={{
          position: "absolute", top: "50%", left: `${pct(value)}%`,
          width: thumbSize, height: thumbSize, borderRadius: "50%",
          background: "#FFFFFF", border: "2px solid var(--fold-text-primary)",
          transform: "translate(-50%, -50%)", cursor: "grab", zIndex: 4,
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)", outline: "none",
        }}
      />
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    date: "",
    description: "",
    primaryLanguage: "en",
    secondaryLanguage: "",
    expectedAttendeesMin: 1,
    expectedAttendeesMax: 200,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateAttendees(max: number) {
    setForm((prev) => ({ ...prev, expectedAttendeesMax: max }));
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
        expectedAttendeesMin: form.expectedAttendeesMin,
        expectedAttendeesMax: form.expectedAttendeesMax,
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
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        display: "flex",
        flexDirection: "column",
        gap: "var(--fold-space-6)",
        paddingTop: "var(--fold-space-2)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--fold-space-3)",
        }}
      >
        <Link
          href="/dashboard/events"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--fold-type-subhead)",
            color: "var(--fold-text-secondary)",
            textDecoration: "none",
            paddingTop: "var(--fold-space-2)",
          }}
        >
          <ArrowLeft size={16} />
          Back to events
        </Link>
        <h1
          style={{
            fontSize: "var(--fold-type-title2)",
            fontWeight: 600,
            color: "var(--fold-text-primary)",
            marginTop: "var(--fold-space-1)",
          }}
        >
          Create event
        </h1>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            background: "var(--fold-error-light)",
            padding: "var(--fold-space-3)",
            borderRadius: "var(--fold-radius-sm)",
            fontSize: "var(--fold-type-subhead)",
            color: "var(--fold-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--fold-space-6)",
        }}
      >
        {/* 1. Event title + Description + Event date (grouped) */}
        <div>
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Event title <span style={{ color: "var(--fold-error)" }}>*</span></label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="input-field"
                placeholder="e.g. Sunday Service - New Converts"
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Add context about this event"
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">Event date <span style={{ color: "var(--fold-error)" }}>*</span></label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* 3. Languages (grouped) */}
        <div className="input-group">
          <div className="input-wrapper">
            <label className="input-label">Primary language</label>
            <select
              value={form.primaryLanguage}
              onChange={(e) => update("primaryLanguage", e.target.value)}
              className="input-field"
            >
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
            <ChevronDown
              size={16}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--fold-text-secondary)",
                pointerEvents: "none",
              }}
            />
          </div>
          <div className="input-wrapper">
            <label className="input-label">Secondary language</label>
            <select
              value={form.secondaryLanguage}
              onChange={(e) => update("secondaryLanguage", e.target.value)}
              className="input-field"
            >
              <option value="">None</option>
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
            <ChevronDown
              size={16}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--fold-text-secondary)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* 4. Expected attendees (dual range slider) */}
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
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--fold-text-secondary)",
              }}
            >
              Expected attendees
            </span>
            <span
              style={{
                fontSize: "var(--fold-type-body)",
                fontWeight: 600,
                color: "var(--fold-text-primary)",
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {form.expectedAttendeesMax}
            </span>
          </div>

          <AttendeeSlider
            value={form.expectedAttendeesMax}
            onChange={updateAttendees}
          />

        </div>

        {/* 5. Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--fold-space-3)",
            paddingTop: "var(--fold-space-1)",
          }}
        >
          <Button type="submit" loading={loading}>
            Create event
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push("/dashboard/events")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
