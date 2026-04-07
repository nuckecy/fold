"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

interface FieldData { id: string; fieldName: string; label: string; value: string | null; confidence: string | null; }
interface RecordData { record: { id: string; captureMethod: string; status: string; imageUrl: string | null; defectiveReasons: string[]; }; fields: FieldData[]; editHistory: any[]; }

export default function CaptureRecordDetailPage() {
  const { eventId, recordId } = useParams<{ eventId: string; recordId: string }>();
  const router = useRouter();
  const [data, setData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/records/${recordId}`).then((r) => r.json()).then((d) => {
      setData(d); setLoading(false);
      const vals: Record<string, string> = {};
      d.fields?.forEach((f: FieldData) => { vals[f.id] = f.value || ""; });
      setEditValues(vals);
    });
  }, [eventId, recordId]);

  async function handleSave() {
    setSaving(true);
    const changes: Record<string, string> = {};
    data?.fields?.forEach((f) => { if (editValues[f.id] !== (f.value || "")) changes[f.id] = editValues[f.id]; });
    await fetch(`/api/events/${eventId}/records/${recordId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: changes, status: "resolved" }) });
    setSaving(false);
    router.push(`/capture/events/${eventId}/records?status=defective`);
  }

  if (loading || !data) {
    return (
      <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
        <PageHeader title="Record" back={`/capture/events/${eventId}/records?status=defective`} />
        <div style={{ padding: "var(--fold-space-10)", textAlign: "center" }}>
          <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const { record, fields } = data;

  return (
    <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
      <PageHeader
        title={`Record #${recordId.slice(0, 7).toUpperCase()}`}
        back={`/capture/events/${eventId}/records?status=defective`}
        badge={record.status === "defective" ? 1 : undefined}
      />

      <div style={{ padding: "0 var(--fold-space-5)", display: "flex", flexDirection: "column", gap: "var(--fold-space-4)" }}>
        {/* Image preview */}
        {record.imageUrl && (
          <div style={{ borderRadius: "var(--fold-radius-md)", overflow: "hidden", border: "0.5px solid var(--fold-divider)", background: "var(--fold-bg-secondary)" }}>
            <img
              src={record.imageUrl}
              alt="Scanned card"
              style={{ width: "100%", height: "auto", maxHeight: 300, objectFit: "contain", display: "block" }}
            />
          </div>
        )}

        {/* Valid fields (read-only) */}
        {fields.filter((f) => !record.defectiveReasons.some((r) => r.includes(f.fieldName || "")) && f.value).length > 0 && (
          <div style={{ background: "var(--fold-bg)", borderRadius: "var(--fold-radius-md)", overflow: "hidden", boxShadow: "var(--fold-shadow-card)" }}>
            {fields
              .filter((f) => !record.defectiveReasons.some((r) => r.includes(f.fieldName || "")) && f.value)
              .map((field, i) => (
                <div
                  key={field.id}
                  style={{
                    padding: "var(--fold-space-3) var(--fold-space-4)",
                    borderTop: i > 0 ? "0.5px solid var(--fold-divider)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.03em", fontWeight: 500 }}>
                    {field.label}
                  </span>
                  <span style={{ fontSize: "var(--fold-type-body)", color: "var(--fold-text-primary)", fontWeight: 500 }}>
                    {field.value}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Defective fields (editable) */}
        {fields
          .filter((f) => record.defectiveReasons.some((r) => r.includes(f.fieldName || "")) || !f.value)
          .map((field) => (
            <div key={field.id}>
              <Input
                label={field.label}
                value={editValues[field.id] || ""}
                onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                error={!editValues[field.id] ? `${field.label} is required` : undefined}
                placeholder={`Enter ${field.label?.toLowerCase()}`}
              />
            </div>
          ))}

        {/* Info callout */}
        {fields.some((f) => f.fieldName?.includes("phone") && f.value) && (
          <div style={{ display: "flex", gap: "var(--fold-space-3)", background: "var(--fold-info-light)", padding: "var(--fold-space-4)", borderRadius: "var(--fold-radius-sm)" }}>
            <Info size={20} color="var(--fold-info)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: "var(--fold-type-body)", fontWeight: 600, color: "var(--fold-text-primary)" }}>Phone available</div>
              <div style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)" }}>This person can be reached by phone</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <Button onClick={handleSave} loading={saving}>Save and resolve</Button>

        <div style={{ textAlign: "center", paddingBottom: "var(--fold-space-6)" }}>
          <button
            onClick={() => router.push(`/capture/events/${eventId}/records?status=defective`)}
            className="btn-text"
            style={{ color: "var(--fold-text-secondary)" }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
