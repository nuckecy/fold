"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Check, X, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

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

  function getField(record: EventRecord, name: string) {
    return record.fields.find((f) => f.fieldName?.includes(name))?.value || null;
  }

  const filters = [
    { key: "all", label: `All (${records.length})` },
    { key: "defective", label: "Missing email" },
    { key: "captured", label: "Malformed" },
  ];

  if (loading) {
    return (
      <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
        <PageHeader title="Flagged records" back={`/capture/events/${eventId}`} />
        <div style={{ padding: "var(--fold-space-10)", textAlign: "center" }}>
          <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
      <PageHeader title="Flagged records" back={`/capture/events/${eventId}`} badge={records.length > 0 ? records.length : undefined} />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "var(--fold-space-2)", padding: "0 var(--fold-space-5) var(--fold-space-4)", overflowX: "auto" }}>
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/capture/events/${eventId}/records?status=${f.key === "all" ? "" : f.key}`}
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <Badge variant={status === f.key || (f.key === "all" && !status) ? "brand" : "muted"}>
              {f.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Record rows */}
      <div style={{ padding: "0 var(--fold-space-5)" }}>
        {records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--fold-space-10) 0" }}>
            <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>No flagged records</p>
          </div>
        ) : (
          <div style={{ background: "var(--fold-bg)", borderRadius: "var(--fold-radius-md)", overflow: "hidden", boxShadow: "var(--fold-shadow-card)" }}>
            {records.map((r, i) => {
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
                    gap: "var(--fold-space-1)",
                    padding: "var(--fold-space-3) var(--fold-space-4)",
                    borderTop: i > 0 ? "0.5px solid var(--fold-divider)" : "none",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--fold-type-body)", fontWeight: 600, color: "var(--fold-text-primary)" }}>{contactName}</span>
                    <span style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-success)", fontWeight: 500 }}>Valid</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-1)", fontSize: "var(--fold-type-subhead)", color: emailOk ? "var(--fold-text-secondary)" : "var(--fold-error)" }}>
                    {emailOk ? <Check size={12} /> : <X size={12} />}
                    <span>{email || "No email captured"}</span>
                  </div>
                  {phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-1)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
                      <Phone size={12} />
                      <span>{phone}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaptureRecordsPage() {
  return <Suspense><RecordsList /></Suspense>;
}
