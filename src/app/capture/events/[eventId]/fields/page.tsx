"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fieldLibrary, FieldTemplate } from "@/lib/field-library";

interface Field {
  id: string;
  fieldName: string;
  fieldType: string;
  fieldLabels: Record<string, string>;
  isRequired: boolean;
  sortOrder: number;
}

export default function CaptureFieldsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/fields`)
      .then((r) => r.json())
      .then((d) => { setFields(d); setLoading(false); });
  }, [eventId]);

  async function addFromLibrary(t: FieldTemplate) {
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldName: t.fieldName, fieldType: t.fieldType, fieldLabels: t.fieldLabels, isRequired: t.isRequired, sortOrder: fields.length }),
    });
    const field = await res.json();
    if (res.ok) setFields([...fields, field]);
    setSaving(false);
  }

  const existing = new Set(fields.map((f) => f.fieldName));
  const available = fieldLibrary.filter((t) => !existing.has(t.fieldName));
  const categories = [...new Set(available.map((t) => t.category))];

  if (loading) return <div className="text-sm text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/capture/events/${eventId}`} className="text-sm text-neutral-500">&larr; Back</Link>
        <h1 className="text-xl font-bold mt-1">Fields</h1>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No fields yet. Add from the library below.
        </div>
      ) : (
        <div className="space-y-1">
          {fields.map((f) => (
            <div key={f.id} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="text-sm font-medium">{(f.fieldLabels as Record<string, string>)?.en || f.fieldName}</div>
              <div className="text-xs text-neutral-500">{f.fieldType}{f.isRequired && " · required"}</div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowLibrary(!showLibrary)}
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium dark:border-neutral-700"
      >
        {showLibrary ? "Hide library" : "+ Add fields from library"}
      </button>

      {showLibrary && categories.map((cat) => (
        <div key={cat}>
          <div className="text-xs font-medium uppercase text-neutral-500 mb-1">{cat}</div>
          <div className="space-y-1">
            {available.filter((t) => t.category === cat).map((t) => (
              <button
                key={t.fieldName}
                onClick={() => addFromLibrary(t)}
                disabled={saving}
                className="w-full flex items-center justify-between rounded-xl border border-neutral-200 p-3 text-left text-sm active:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800"
              >
                <span>{t.fieldLabels.en}</span>
                <span className="text-xs text-neutral-400">+ Add</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
