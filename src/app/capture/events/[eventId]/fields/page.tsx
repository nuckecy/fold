"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fieldLibrary, FieldTemplate } from "@/lib/field-library";

interface Field { id: string; fieldName: string; fieldType: string; fieldLabels: Record<string, string>; isRequired: boolean; sortOrder: number; }

export default function CaptureFieldsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/fields`).then((r) => r.json()).then((d) => { setFields(d); setLoading(false); });
  }, [eventId]);

  async function toggleField(template: FieldTemplate) {
    const existing = fields.find((f) => f.fieldName === template.fieldName);
    if (existing) {
      // Would remove — for now just visual toggle
      setFields(fields.filter((f) => f.fieldName !== template.fieldName));
    } else {
      setSaving(true);
      const res = await fetch(`/api/events/${eventId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldName: template.fieldName, fieldType: template.fieldType, fieldLabels: template.fieldLabels, isRequired: template.isRequired, sortOrder: fields.length }),
      });
      const field = await res.json();
      if (res.ok) setFields([...fields, field]);
      setSaving(false);
    }
  }

  const activeNames = new Set(fields.map((f) => f.fieldName));

  if (loading) return <div style={{ padding: 20, fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>Loading...</div>;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px" }}>
        <Link href={`/capture/events/${eventId}`} style={{ textDecoration: "none" }}>
          <ArrowLeft size={20} color="var(--text-primary)" />
        </Link>
        <span style={{ fontSize: "var(--font-subtitle)", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>Fields detected</span>
        <span className="status-pill brand" style={{ padding: "4px 10px", fontSize: "var(--font-label)" }}>EN</span>
      </div>

      {/* Field rows */}
      <div style={{ padding: "0 20px" }}>
        {fieldLibrary.slice(0, 10).map((template) => {
          const isActive = activeNames.has(template.fieldName);
          return (
            <div
              key={template.fieldName}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border-light)" }}
            >
              <div>
                <div style={{ fontSize: "var(--font-body)", fontWeight: 500, color: "var(--text-primary)" }}>
                  {template.fieldLabels.en} &rarr; {template.fieldLabels.en}
                </div>
                <div style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)" }}>
                  {template.fieldType}
                </div>
              </div>
              <button
                onClick={() => toggleField(template)}
                disabled={saving}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 9999,
                  background: isActive ? "var(--brand)" : "var(--border)",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  background: "var(--bg)",
                  position: "absolute",
                  top: 3,
                  left: isActive ? 23 : 3,
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Multi-language prompt */}
      <div style={{ padding: "24px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "var(--font-body)", color: "var(--text-primary)", marginBottom: 12 }}>
          Is this form available in other languages?
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button className="btn-secondary" style={{ width: "auto", height: 40, padding: "0 24px", fontSize: "var(--font-body-sm)" }}>
            Add language
          </button>
          <button className="btn-secondary" style={{ width: "auto", height: 40, padding: "0 24px", fontSize: "var(--font-body-sm)" }}>
            No, continue
          </button>
        </div>
      </div>

      {/* Confirm */}
      <div style={{ padding: "0 20px 24px" }}>
        <Link href={`/capture/events/${eventId}`} className="btn-primary" style={{ textDecoration: "none" }}>
          Confirm fields
        </Link>
      </div>
    </div>
  );
}
