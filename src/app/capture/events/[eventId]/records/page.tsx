"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Check, X, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

interface RecordField { fieldName: string; label: string; value: string | null; confidence: string | null; }
interface EventRecord { id: string; captureMethod: string; status: string; defectiveReasons: string[]; createdAt: string; fields: RecordField[]; }

function RecordsList() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "";
  const [allRecords, setAllRecords] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ALL defective + captured (flagged) records for counts
    fetch(`/api/events/${eventId}/records?status=defective`)
      .then((r) => r.json())
      .then((defective) => {
        fetch(`/api/events/${eventId}/records?status=captured`)
          .then((r) => r.json())
          .then((captured) => {
            setAllRecords([...defective, ...captured]);
            setLoading(false);
          });
      });
  }, [eventId]);

  function getField(record: EventRecord, name: string) {
    return record.fields.find((f) => f.fieldName?.includes(name))?.value || null;
  }

  const missingEmailCount = useMemo(() =>
    allRecords.filter((r) => r.defectiveReasons.some((d) => d.includes("missing_email"))).length,
    [allRecords]
  );

  const malformedCount = useMemo(() =>
    allRecords.filter((r) => r.defectiveReasons.some((d) => d.includes("malformed"))).length,
    [allRecords]
  );

  const filteredRecords = useMemo(() => {
    if (!status || status === "all") return allRecords;
    if (status === "defective") return allRecords.filter((r) => r.defectiveReasons.some((d) => d.includes("missing_email")));
    if (status === "captured") return allRecords.filter((r) => r.defectiveReasons.some((d) => d.includes("malformed")));
    return allRecords;
  }, [allRecords, status]);

  const filters = [
    { key: "all", label: `All (${allRecords.length})` },
    { key: "defective", label: `Missing email (${missingEmailCount})` },
    { key: "captured", label: `Malformed (${malformedCount})` },
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
      <PageHeader title="Flagged records" back={`/capture/events/${eventId}`} badge={allRecords.length > 0 ? allRecords.length : undefined} />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "var(--fold-space-2)", padding: "0 var(--fold-space-5) var(--fold-space-4)", overflowX: "auto" }}>
        {filters.map((f) => {
          const isActive = status === f.key || (f.key === "all" && !status);
          return (
            <Link
              key={f.key}
              href={`/capture/events/${eventId}/records?status=${f.key === "all" ? "" : f.key}`}
              style={{ textDecoration: "none", whiteSpace: "nowrap" }}
            >
              <Badge variant={isActive ? "brand" : "muted"}>
                {f.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Record rows */}
      <div style={{ padding: "0 var(--fold-space-5)" }}>
        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--fold-space-10) 0" }}>
            <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>No flagged records</p>
          </div>
        ) : (
          <div style={{ background: "var(--fold-bg)", borderRadius: "var(--fold-radius-md)", overflow: "hidden", boxShadow: "var(--fold-shadow-card)" }}>
            {filteredRecords.map((r, i) => {
              const contactName = getField(r, "name") || "Unknown";
              const email = getField(r, "email");
              const phone = getField(r, "phone");
              const hasMissingEmail = r.defectiveReasons.some((d) => d.includes("missing_email"));
              const hasMalformed = r.defectiveReasons.some((d) => d.includes("malformed"));

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
                    <span style={{ fontSize: "var(--fold-type-caption)", color: hasMalformed ? "var(--fold-accent)" : "var(--fold-error)", fontWeight: 500 }}>
                      {hasMalformed ? "Malformed" : "Missing email"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-1)", fontSize: "var(--fold-type-subhead)", color: hasMissingEmail ? "var(--fold-error)" : "var(--fold-text-secondary)" }}>
                    {hasMissingEmail ? <X size={12} /> : <Check size={12} />}
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
