"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Info } from "lucide-react";

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

  if (loading || !data) return <div style={{ padding: 20, fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>Loading...</div>;
  const { record, fields } = data;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <Link href={`/capture/events/${eventId}/records?status=defective`} style={{ textDecoration: "none" }}>
          <ArrowLeft size={20} color="var(--text-primary)" />
        </Link>
        <span className="title">Record #{recordId.slice(0, 7).toUpperCase()}</span>
        {record.status === "defective" && <span className="badge">!</span>}
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Image preview */}
        {record.imageUrl && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Camera size={24} color="var(--text-secondary)" />
            <span style={{ fontSize: "var(--font-body-sm)", color: "var(--text-secondary)" }}>Tap to expand</span>
          </div>
        )}

        {/* Editable fields */}
        {fields.map((field) => {
          const isError = record.defectiveReasons.some((r) => r.includes(field.fieldName || ""));
          const confidenceLabel = field.confidence === "high" ? "High" : field.confidence === "low" ? "Low" : field.confidence === "medium" ? "Medium" : "";

          return (
            <div key={field.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label className="input-label" style={{ marginBottom: 0 }}>{field.label}</label>
                {confidenceLabel && (
                  <span style={{
                    fontSize: "var(--font-caption)",
                    fontWeight: 500,
                    color: field.confidence === "high" ? "var(--success)" : field.confidence === "low" ? "var(--error)" : "var(--warning)",
                  }}>
                    {confidenceLabel}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={editValues[field.id] || ""}
                onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                className="input-field"
                style={{
                  borderColor: isError ? "var(--error)" : undefined,
                  background: isError ? "var(--error-light)" : undefined,
                }}
              />
              {isError && (
                <span style={{ fontSize: "var(--font-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
                  {field.label} is missing
                </span>
              )}
            </div>
          );
        })}

        {/* Info callout */}
        {fields.some((f) => f.fieldName?.includes("phone") && f.value) && (
          <div style={{ display: "flex", gap: 12, background: "var(--info-light)", padding: 16, borderRadius: 4 }}>
            <Info size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: "var(--font-body)", fontWeight: 600, color: "var(--text-primary)" }}>Phone available</div>
              <div style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)" }}>This person can be reached by phone</div>
            </div>
          </div>
        )}

        {/* Save button */}
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save and resolve"}
        </button>

        {/* Skip link */}
        <div style={{ textAlign: "center", paddingBottom: 24 }}>
          <Link
            href={`/capture/events/${eventId}/records?status=defective`}
            style={{ fontSize: "var(--font-body-sm)", color: "var(--text-secondary)", textDecoration: "none" }}
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
