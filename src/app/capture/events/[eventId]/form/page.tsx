"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

interface FormSettings { exists: boolean; shortCode?: string; formUrl?: string; }

export default function CaptureFormPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/form`).then((r) => r.json()).then((d) => { setSettings(d); setLoading(false); });
  }, [eventId]);

  async function createForm() {
    setCreating(true);
    const res = await fetch(`/api/events/${eventId}/form`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    setSettings({ exists: true, ...data });
    setCreating(false);
  }

  function copyUrl() {
    navigator.clipboard.writeText(settings?.formUrl || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%", padding: "var(--fold-space-5)" }}><p style={{ color: "var(--fold-text-secondary)" }}>Loading...</p></div>;

  return (
    <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
      <PageHeader title="Online form" back={`/capture/events/${eventId}`} />

      {!settings?.exists ? (
        <div style={{ padding: "var(--fold-space-10) var(--fold-space-5)", textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--fold-space-4)", alignItems: "center" }}>
          <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>Create a digital form so attendees can submit online.</p>
          <Button onClick={createForm} loading={creating} style={{ width: "auto", padding: "0 var(--fold-space-8)" }}>Create form</Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-4)", padding: "var(--fold-space-4) var(--fold-space-5)" }}>
          {/* QR Code */}
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--fold-space-6) 0" }}>
            <div style={{ width: 160, height: 160, background: "var(--fold-bg)", border: "0.5px solid var(--fold-divider)", borderRadius: "var(--fold-radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--fold-shadow-card)" }}>
              <img src={`/api/events/${eventId}/form/qr?format=png`} alt="QR Code" style={{ width: 140, height: 140 }} />
            </div>
          </div>

          {/* URL */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--fold-space-2)" }}>
            <span style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", fontFamily: "monospace" }}>
              {settings.formUrl?.replace("http://localhost:3000", "foldapp.com")}
            </span>
            <button onClick={copyUrl} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fold-text-secondary)", padding: 4 }}>
              {copied ? <Check size={14} color="var(--fold-success)" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Downloads */}
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--fold-space-2)" }}>
            <a href={`/api/events/${eventId}/form/qr?format=png`} download className="btn-text" style={{ fontSize: "var(--fold-type-subhead)" }}>PNG</a>
            <a href={`/api/events/${eventId}/form/qr?format=svg`} download className="btn-text" style={{ fontSize: "var(--fold-type-subhead)" }}>SVG</a>
          </div>

          {/* Metrics */}
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--fold-space-6)", padding: "var(--fold-space-4) 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "var(--fold-type-title3)", fontWeight: 600, color: "var(--fold-text-primary)", fontVariantNumeric: "tabular-nums" }}>0</div>
              <div style={{ fontSize: "var(--fold-type-caption)", color: "var(--fold-text-secondary)" }}>submissions</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "var(--fold-type-title3)", fontWeight: 600, color: "var(--fold-text-primary)" }}>0%</div>
              <div style={{ fontSize: "var(--fold-type-caption)", color: "var(--fold-text-secondary)" }}>conversion</div>
            </div>
          </div>

          <Button variant="secondary" onClick={() => window.open(settings.formUrl, "_blank")}>Preview form</Button>
          <Button variant="ghost">Close form</Button>
        </div>
      )}
    </div>
  );
}
