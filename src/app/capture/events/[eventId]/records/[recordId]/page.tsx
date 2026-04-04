"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FieldData { id: string; fieldName: string; label: string; value: string | null; confidence: string | null; }
interface RecordData { record: { id: string; captureMethod: string; status: string; imageUrl: string | null; defectiveReasons: string[]; }; fields: FieldData[]; }

export default function CaptureRecordDetailPage() {
  const { eventId, recordId } = useParams<{ eventId: string; recordId: string }>();
  const router = useRouter();
  const [data, setData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/records/${recordId}`)
      .then((r) => r.json())
      .then((d) => {
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
    await fetch(`/api/events/${eventId}/records/${recordId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: changes }),
    });
    setSaving(false); setEditing(false);
    const d = await fetch(`/api/events/${eventId}/records/${recordId}`).then((r) => r.json());
    setData(d);
  }

  async function handleResolve() {
    setSaving(true);
    await fetch(`/api/events/${eventId}/records/${recordId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setSaving(false);
    router.push(`/capture/events/${eventId}/records?status=defective`);
  }

  if (loading || !data) return <div className="text-sm text-neutral-500">Loading...</div>;
  const { record, fields } = data;

  const dot = (c: string | null) => c === "high" ? "bg-green-500" : c === "medium" ? "bg-yellow-500" : c === "low" ? "bg-red-500" : "bg-neutral-300";

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/capture/events/${eventId}/records?status=defective`} className="text-sm text-neutral-500">&larr; Back</Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold">Record</h1>
          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${record.status === "defective" ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>{record.status}</span>
        </div>
      </div>

      {/* Image */}
      {record.imageUrl && !record.imageUrl.startsWith("archived:") && (
        <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <img src={record.imageUrl} alt="Scan" className="w-full" />
        </div>
      )}

      {/* Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Data</span>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-neutral-500">Edit</button>
          )}
        </div>
        {fields.map((f) => (
          <div key={f.id} className="flex items-start gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot(f.confidence)}`} />
            <div className="flex-1">
              <div className="text-xs text-neutral-500">{f.label}</div>
              {editing ? (
                <input type="text" value={editValues[f.id] || ""} onChange={(e) => setEditValues({ ...editValues, [f.id]: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1 text-sm mt-1 dark:border-neutral-700 dark:bg-neutral-900" />
              ) : (
                <div className="text-sm font-medium mt-0.5">{f.value || "—"}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {editing && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900">
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button onClick={() => setEditing(false)} className="rounded-xl border border-neutral-300 px-4 py-3 text-sm dark:border-neutral-700">Cancel</button>
          </div>
        )}
        {record.status === "defective" && !editing && (
          <button onClick={handleResolve} disabled={saving} className="w-full rounded-xl bg-green-600 py-3 text-sm font-medium text-white disabled:opacity-50">
            Mark as resolved
          </button>
        )}
      </div>

      {/* Defective reasons */}
      {record.defectiveReasons?.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-red-600">Issues:</div>
          {(record.defectiveReasons as string[]).map((r, i) => (
            <div key={i} className="text-xs bg-red-50 text-red-600 rounded-lg px-2 py-1 dark:bg-red-900/20 dark:text-red-400">{r.replace(/_/g, " ")}</div>
          ))}
        </div>
      )}
    </div>
  );
}
