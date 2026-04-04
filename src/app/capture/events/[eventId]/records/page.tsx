"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, AlertTriangle, Phone } from "lucide-react";

interface RecordField { fieldName: string; label: string; value: string | null; confidence: string | null; }
interface EventRecord { id: string; captureMethod: string; status: string; defectiveReasons: string[]; createdAt: string; fields: RecordField[]; }

function RecordsList() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "defective";
  const [records, setRecords] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/records?status=${status}`).then((r) => r.json()).then((d) => { setRecords(d); setLoading(false); });
  }, [eventId, status]);

  if (loading) return <div style={{ padding: 20, fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>Loading...</div>;

  // Get name and email from fields
  function getField(record: EventRecord, name: string) {
    return record.fields.find((f) => f.fieldName?.includes(name))?.value || null;
  }

  const filters = [
    { key: "all", label: `All (${records.length})` },
    { key: "defective", label: `Missing email` },
    { key: "captured", label: `Malformed` },
  ];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <Link href={`/capture/events/${eventId}`} style={{ textDecoration: "none" }}>
          <ArrowLeft size={20} color="var(--text-primary)" />
        </Link>
        <span className="title">Flagged records</span>
        {records.length > 0 && <span className="badge">{records.length}</span>}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, padding: "0 20px 16px", overflowX: "auto" }}>
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/capture/events/${eventId}/records?status=${f.key === "all" ? "" : f.key}`}
            className={`status-pill ${status === f.key || (f.key === "all" && !status) ? "brand" : "muted"}`}
            style={{ textDecoration: "none", whiteSpace: "nowrap", padding: "6px 14px" }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Record cards */}
      <div style={{ padding: "0 20px" }}>
        {records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>No flagged records.</p>
          </div>
        ) : (
          records.map((r) => {
            const contactName = getField(r, "name") || "Contact Name";
            const email = getField(r, "email");
            const phone = getField(r, "phone");
            const emailOk = email && !r.defectiveReasons.some((d) => d.includes("email"));

            return (
              <Link
                key={r.id}
                href={`/capture/events/${eventId}/records/${r.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "14px 0",
                  borderBottom: "1px solid var(--border-light)",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--font-body)", fontWeight: 600, color: "var(--text-primary)" }}>{contactName}</span>
                  <span style={{ fontSize: "var(--font-body-sm)", color: "var(--success)", fontWeight: 500 }}>Valid</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--font-body-sm)", color: emailOk ? "var(--text-secondary)" : "var(--error)" }}>
                  {emailOk ? <Check size={12} /> : <X size={12} />}
                  <span>{email || "No email captured"}</span>
                </div>
                {phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
                    <Phone size={12} />
                    <span>{phone}</span>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CaptureRecordsPage() {
  return <Suspense><RecordsList /></Suspense>;
}
