"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FieldData {
  id: string;
  fieldSchemaId: string;
  fieldName: string;
  label: string;
  fieldType: string;
  value: string | null;
  confidence: string | null;
  manuallyEdited: boolean | null;
}

interface EditLog {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  editedAt: string;
}

interface RecordData {
  record: {
    id: string;
    captureMethod: string;
    status: string;
    imageUrl: string | null;
    defectiveReasons: string[];
    contentLanguage: string | null;
    createdAt: string;
  };
  fields: FieldData[];
  editHistory: EditLog[];
}

export default function RecordDetailPage() {
  const { eventId, recordId } = useParams<{ eventId: string; recordId: string }>();
  const router = useRouter();

  const [data, setData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/events/${eventId}/records/${recordId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        // Initialize edit values
        const vals: Record<string, string> = {};
        d.fields?.forEach((f: FieldData) => {
          vals[f.id] = f.value || "";
        });
        setEditValues(vals);
      });
  }, [eventId, recordId]);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    // Only send changed fields
    const changes: Record<string, string> = {};
    data?.fields?.forEach((f) => {
      if (editValues[f.id] !== (f.value || "")) {
        changes[f.id] = editValues[f.id];
      }
    });

    if (Object.keys(changes).length === 0) {
      setEditing(false);
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/events/${eventId}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: changes }),
    });

    setSaving(false);

    if (res.ok) {
      setMessage("Record updated");
      setEditing(false);
      // Reload
      const d = await fetch(`/api/events/${eventId}/records/${recordId}`).then((r) => r.json());
      setData(d);
    }
  }

  async function handleResolve() {
    setSaving(true);
    await fetch(`/api/events/${eventId}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setSaving(false);
    router.refresh();
    const d = await fetch(`/api/events/${eventId}/records/${recordId}`).then((r) => r.json());
    setData(d);
  }

  if (loading || !data) {
    return <div className="text-sm text-neutral-500">Loading record...</div>;
  }

  const { record, fields, editHistory } = data;

  const confidenceColor = (c: string | null) => {
    if (c === "high") return "bg-green-500";
    if (c === "medium") return "bg-yellow-500";
    if (c === "low") return "bg-red-500";
    return "bg-neutral-300";
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}/records`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to records
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold">Record Detail</h1>
          <span
            className={`text-xs rounded-full px-2.5 py-1 font-medium ${
              record.status === "reviewed"
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : record.status === "defective"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800"
            }`}
          >
            {record.status}
          </span>
        </div>
        <div className="text-sm text-neutral-500 mt-1">
          {record.captureMethod} &middot; {new Date(record.createdAt).toLocaleString()}
          {record.contentLanguage && ` &middot; ${record.contentLanguage.toUpperCase()}`}
        </div>
      </div>

      {message && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {message}
        </div>
      )}

      {/* Side-by-side: image + fields (H2) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image (if scan) */}
        {record.imageUrl && !record.imageUrl.startsWith("archived:") && (
          <div className="rounded-lg border border-neutral-200 overflow-hidden dark:border-neutral-800">
            <img
              src={record.imageUrl}
              alt="Scanned card"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Field values with confidence indicators (H3) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Extracted Data</h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Edit fields
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs text-neutral-500"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-start gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            >
              {/* Confidence dot (H3) */}
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${confidenceColor(field.confidence)}`}
                title={`Confidence: ${field.confidence || "n/a"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-500">{field.label}</div>
                {editing ? (
                  <input
                    type="text"
                    value={editValues[field.id] || ""}
                    onChange={(e) =>
                      setEditValues({ ...editValues, [field.id]: e.target.value })
                    }
                    className="w-full rounded border border-neutral-300 px-2 py-1 text-sm mt-1 dark:border-neutral-700 dark:bg-neutral-900"
                  />
                ) : (
                  <div className="text-sm font-medium mt-0.5">
                    {field.value || "—"}
                    {field.manuallyEdited && (
                      <span className="ml-1 text-xs text-blue-500">(edited)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Defective reasons */}
          {record.defectiveReasons?.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-red-600">Issues:</div>
              {(record.defectiveReasons as string[]).map((r, i) => (
                <div
                  key={i}
                  className="text-xs bg-red-50 text-red-600 rounded px-2 py-1 dark:bg-red-900/20 dark:text-red-400"
                >
                  {r.replace(/_/g, " ")}
                </div>
              ))}
            </div>
          )}

          {/* Resolve button for defective records (H6) */}
          {record.status === "defective" && (
            <button
              onClick={handleResolve}
              disabled={saving}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Mark as resolved
            </button>
          )}
        </div>
      </div>

      {/* Edit history (H15) */}
      {editHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-500 mb-2">
            Edit History
          </h3>
          <div className="space-y-1">
            {editHistory.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-800"
              >
                <div>
                  <span className="font-medium">{log.fieldName}</span>:{" "}
                  <span className="text-neutral-500">{log.oldValue || "empty"}</span>
                  {" → "}
                  <span>{log.newValue}</span>
                </div>
                <span className="text-neutral-400">
                  {new Date(log.editedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
