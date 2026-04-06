"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
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

  if (loading) return <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%", padding: "var(--fold-space-5)" }}><p style={{ color: "var(--fold-text-secondary)" }}>Loading...</p></div>;

  return (
    <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
      <PageHeader title="Fields detected" back={`/capture/events/${eventId}`} />

      {/* Field rows */}
      <div style={{ padding: "0 var(--fold-space-5)" }}>
        <div style={{ background: "var(--fold-bg)", borderRadius: "var(--fold-radius-md)", overflow: "hidden", boxShadow: "var(--fold-shadow-card)" }}>
          {fieldLibrary.slice(0, 10).map((template, i) => {
            const isActive = activeNames.has(template.fieldName);
            return (
              <div
                key={template.fieldName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--fold-space-3) var(--fold-space-4)",
                  borderTop: i > 0 ? "0.5px solid var(--fold-divider)" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: "var(--fold-type-body)", fontWeight: 500, color: "var(--fold-text-primary)" }}>
                    {template.fieldLabels.en} &rarr; {template.fieldLabels.en}
                  </div>
                  <div style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)" }}>
                    {template.fieldType}
                  </div>
                </div>
                <button
                  onClick={() => toggleField(template)}
                  disabled={saving}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: "var(--fold-radius-full)",
                    background: isActive ? "var(--fold-accent)" : "var(--fold-disabled)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 200ms ease",
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: "var(--fold-radius-full)",
                    background: "var(--fold-bg)",
                    position: "absolute",
                    top: 3,
                    left: isActive ? 23 : 3,
                    transition: "left 200ms ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-language prompt */}
      <div style={{ padding: "var(--fold-space-6) var(--fold-space-5)", textAlign: "center" }}>
        <p style={{ fontSize: "var(--fold-type-body)", color: "var(--fold-text-primary)", marginBottom: "var(--fold-space-3)" }}>
          Is this form available in other languages?
        </p>
        <div style={{ display: "flex", gap: "var(--fold-space-2)", justifyContent: "center" }}>
          <Button variant="secondary" style={{ width: "auto", padding: "0 var(--fold-space-6)", height: 40 }}>Add language</Button>
          <Button variant="secondary" style={{ width: "auto", padding: "0 var(--fold-space-6)", height: 40 }}>No, continue</Button>
        </div>
      </div>

      <div style={{ padding: "0 var(--fold-space-5) var(--fold-space-6)" }}>
        <Link href={`/capture/events/${eventId}`} className="btn-primary" style={{ textDecoration: "none" }}>
          Confirm fields
        </Link>
      </div>
    </div>
  );
}
