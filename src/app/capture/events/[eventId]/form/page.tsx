"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Check, Download, ExternalLink } from "lucide-react";
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

  if (loading) return (
    <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%", padding: "var(--fold-space-5)" }}>
      <p style={{ color: "var(--fold-text-secondary)" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
      <PageHeader title="Online form" back={`/capture/events/${eventId}`} />

      {!settings?.exists ? (
        <div style={{
          padding: "var(--fold-space-10) var(--fold-space-5)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "var(--fold-space-4)",
          alignItems: "center",
        }}>
          <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
            Create a digital form so attendees can submit online.
          </p>
          <Button onClick={createForm} loading={creating} style={{ width: "auto", padding: "0 var(--fold-space-8)" }}>
            Create form
          </Button>
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--fold-space-4)",
          padding: "var(--fold-space-5)",
        }}>

          {/* ── QR Code Card ─────────────────────────────────────────── */}
          <div style={{
            background: "var(--fold-bg)",
            borderRadius: "var(--fold-radius-md)",
            boxShadow: "var(--fold-shadow-card)",
            padding: "var(--fold-space-8) var(--fold-space-6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--fold-space-5)",
          }}>
            {/* QR image */}
            <div style={{
              width: 200,
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <img
                src={`/api/events/${eventId}/form/qr?format=png`}
                alt="QR Code"
                style={{ width: 200, height: 200, display: "block" }}
              />
            </div>

            {/* Share URL pill */}
            <button
              onClick={copyUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--fold-space-2)",
                background: "var(--fold-bg-grouped)",
                border: "1px solid var(--fold-divider)",
                borderRadius: "var(--fold-radius-full)",
                padding: "var(--fold-space-2) var(--fold-space-3)",
                cursor: "pointer",
                maxWidth: "100%",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{
                fontFamily: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
                fontSize: "var(--fold-type-footnote)",
                color: "var(--fold-text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {settings.formUrl?.replace("http://localhost:3000", "foldapp.com")}
              </span>
              <span style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: copied ? "var(--fold-success)" : "var(--fold-text-tertiary)",
                transition: "color 150ms ease-out",
              }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </span>
            </button>

            {/* Download buttons */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--fold-space-3)",
            }}>
              <a
                href={`/api/events/${eventId}/form/qr?format=png`}
                download
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--fold-space-1)",
                  padding: "var(--fold-space-2) var(--fold-space-4)",
                  border: "1px solid var(--fold-border)",
                  borderRadius: "var(--fold-radius-full)",
                  background: "transparent",
                  color: "var(--fold-text-primary)",
                  fontSize: "var(--fold-type-footnote)",
                  fontWeight: 600,
                  fontFamily: "var(--fold-font)",
                  textDecoration: "none",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background 100ms ease",
                  minHeight: 36,
                }}
              >
                <Download size={14} style={{ flexShrink: 0 }} />
                PNG
              </a>
              <a
                href={`/api/events/${eventId}/form/qr?format=svg`}
                download
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--fold-space-1)",
                  padding: "var(--fold-space-2) var(--fold-space-4)",
                  border: "1px solid var(--fold-border)",
                  borderRadius: "var(--fold-radius-full)",
                  background: "transparent",
                  color: "var(--fold-text-primary)",
                  fontSize: "var(--fold-type-footnote)",
                  fontWeight: 600,
                  fontFamily: "var(--fold-font)",
                  textDecoration: "none",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background 100ms ease",
                  minHeight: 36,
                }}
              >
                <Download size={14} style={{ flexShrink: 0 }} />
                SVG
              </a>
            </div>
          </div>

          {/* ── Metrics Row ──────────────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--fold-space-3)",
          }}>
            <div className="metric-card">
              <span className="value">0</span>
              <span className="label">Submissions</span>
            </div>
            <div className="metric-card">
              <span className="value">0%</span>
              <span className="label">Conversion</span>
            </div>
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--fold-space-2)",
            paddingTop: "var(--fold-space-2)",
          }}>
            <Button
              variant="secondary"
              onClick={() => window.open(settings.formUrl, "_blank")}
            >
              <ExternalLink size={16} style={{ flexShrink: 0 }} />
              Preview form
            </Button>

            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fold-error)",
                fontSize: "var(--fold-type-subhead)",
                fontWeight: 500,
                fontFamily: "var(--fold-font)",
                padding: "var(--fold-space-3) 0",
                WebkitTapHighlightColor: "transparent",
                textAlign: "center",
              }}
            >
              Close form
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
