"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface RecordField { fieldName: string; label: string; value: string | null; confidence: string | null; }
interface EventRecord { id: string; captureMethod: string; status: string; defectiveReasons: string[]; createdAt: string; fields: RecordField[]; }

function RecordsList() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "defective";
  const [records, setRecords] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/records?status=${status}`)
      .then((r) => r.json())
      .then((d) => { setRecords(d); setLoading(false); });
  }, [eventId, status]);

  if (loading) return <div className="text-sm text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/capture/events/${eventId}`} className="text-sm text-neutral-500">&larr; Back</Link>
        <h1 className="text-xl font-bold mt-1">
          {status === "defective" ? "Flagged Records" : "Records"}
        </h1>
        <p className="text-xs text-neutral-500">{records.length} record{records.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto">
        {["defective", "captured", "reviewed", "all"].map((s) => (
          <Link
            key={s}
            href={`/capture/events/${eventId}/records?status=${s === "all" ? "" : s}`}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              status === s || (s === "all" && !status)
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {s === "all" ? "All" : s}
          </Link>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No {status} records.
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Link
              key={r.id}
              href={`/capture/events/${eventId}/records/${r.id}`}
              className="block rounded-xl border border-neutral-200 p-3 active:bg-neutral-50 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                  r.status === "defective" ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  : r.status === "reviewed" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                }`}>{r.status}</span>
                <span className="text-xs text-neutral-400">{r.captureMethod}</span>
              </div>
              {r.fields.slice(0, 3).map((f, i) => (
                <div key={i} className="text-xs">
                  <span className="text-neutral-500">{f.label}: </span>
                  <span>{f.value || "—"}</span>
                </div>
              ))}
              {r.defectiveReasons?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(r.defectiveReasons as string[]).map((reason, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5 dark:bg-red-900/20 dark:text-red-400">
                      {reason.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaptureRecordsPage() {
  return <Suspense><RecordsList /></Suspense>;
}
