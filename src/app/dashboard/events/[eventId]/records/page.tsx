"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface RecordField {
  fieldName: string;
  label: string;
  value: string | null;
  confidence: string | null;
  manuallyEdited: boolean | null;
}

interface EventRecord {
  id: string;
  captureMethod: string;
  status: string;
  defectiveReasons: string[];
  createdAt: string;
  fields: RecordField[];
}

export default function RecordsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [records, setRecords] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  useEffect(() => {
    const url =
      filter === "all"
        ? `/api/events/${eventId}/records`
        : `/api/events/${eventId}/records?status=${filter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setRecords(data);
        setLoading(false);
      });
  }, [eventId, filter]);

  async function handleProcess() {
    setProcessing(true);
    setProcessResult(null);

    const res = await fetch(`/api/events/${eventId}/process`, {
      method: "POST",
    });

    const data = await res.json();
    setProcessing(false);

    if (res.ok) {
      setProcessResult(
        `Processed ${data.processed} record${data.processed !== 1 ? "s" : ""}. ${data.flagged} flagged, ${data.failed} failed.`
      );
      // Reload records
      const reloadRes = await fetch(`/api/events/${eventId}/records`);
      setRecords(await reloadRes.json());
    } else {
      setProcessResult(data.error || "Processing failed");
    }
  }

  const statusCounts = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const confidenceColor = (c: string | null) => {
    if (c === "high") return "text-green-600 dark:text-green-400";
    if (c === "medium") return "text-yellow-600 dark:text-yellow-400";
    if (c === "low") return "text-red-600 dark:text-red-400";
    return "text-neutral-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to event
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold">Records</h1>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {processing ? "Processing..." : "Process scans"}
          </button>
        </div>
      </div>

      {processResult && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          {processResult}
        </div>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "captured", "processing", "reviewed", "defective", "resolved"].map(
          (s) => (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setLoading(true);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              }`}
            >
              {s === "all" ? "All" : s}{" "}
              {s !== "all" && statusCounts[s] ? `(${statusCounts[s]})` : ""}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading records...</div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            {filter === "all"
              ? "No records yet. Start scanning or share the digital form."
              : `No ${filter} records.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      record.status === "reviewed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : record.status === "defective"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : record.status === "captured"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {record.status}
                  </span>
                  <span className="text-xs text-neutral-500 capitalize">
                    {record.captureMethod}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(record.createdAt).toLocaleString()}
                </span>
              </div>

              {record.fields.length > 0 ? (
                <div className="grid gap-1 sm:grid-cols-2">
                  {record.fields.map((field, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-neutral-500">{field.label}: </span>
                      <span className="font-medium">
                        {field.value || "—"}
                      </span>
                      {field.confidence && (
                        <span
                          className={`ml-1 text-xs ${confidenceColor(field.confidence)}`}
                        >
                          ({field.confidence})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">
                  No extracted data yet
                </p>
              )}

              {record.defectiveReasons?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(record.defectiveReasons as string[]).map((reason, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5 dark:bg-red-900/20 dark:text-red-400"
                    >
                      {reason.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
