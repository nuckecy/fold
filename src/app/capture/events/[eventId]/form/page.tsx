"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";

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

  if (loading) return <div style={{ padding: 20, fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>Loading...</div>;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%" }}>
      <div className="page-header">
        <Link href={`/capture/events/${eventId}`} style={{ textDecoration: "none" }}>
          <ArrowLeft size={20} color="var(--text-primary)" />
        </Link>
        <span className="title">Online form</span>
      </div>

      {!settings?.exists ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>Create a digital form so attendees can submit online.</p>
          <button onClick={createForm} disabled={creating} className="btn-primary" style={{ width: "auto", padding: "0 32px" }}>
            {creating ? "Creating..." : "Create form"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 20px" }}>
          {/* QR Code placeholder */}
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <div style={{ width: 160, height: 160, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={`/api/events/${eventId}/form/qr?format=png`} alt="QR Code" style={{ width: 140, height: 140 }} />
            </div>
          </div>

          {/* URL */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: "var(--font-body-sm)", color: "var(--text-secondary)", fontFamily: "monospace" }}>
              {settings.formUrl?.replace("http://localhost:3000", "foldapp.com")}
            </span>
            <button onClick={copyUrl} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
              {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Download buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <a href={`/api/events/${eventId}/form/qr?format=png`} download className="btn-ghost" style={{ width: "auto", height: 36, padding: "0 20px", fontSize: "var(--font-body-sm)" }}>
              PNG
            </a>
            <a href={`/api/events/${eventId}/form/qr?format=svg`} download className="btn-ghost" style={{ width: "auto", height: 36, padding: "0 20px", fontSize: "var(--font-body-sm)" }}>
              SVG
            </a>
          </div>

          {/* Metrics */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: "16px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "var(--font-subtitle)", fontWeight: 600, color: "var(--text-primary)" }}>0</div>
              <div style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)" }}>submissions</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "var(--font-subtitle)", fontWeight: 600, color: "var(--text-primary)" }}>0%</div>
              <div style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)" }}>conversion</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href={settings.formUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Preview form
            </a>
            <button className="btn-ghost">
              Close form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
