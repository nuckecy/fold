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

export default function FieldConfigPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customField, setCustomField] = useState({
    fieldName: "",
    fieldType: "text",
    labelEn: "",
    labelDe: "",
    isRequired: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/fields`)
      .then((res) => res.json())
      .then((data) => {
        setFields(data);
        setLoading(false);
      });
  }, [eventId]);

  async function addFromLibrary(template: FieldTemplate) {
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldName: template.fieldName,
        fieldType: template.fieldType,
        fieldLabels: template.fieldLabels,
        isRequired: template.isRequired,
        sortOrder: fields.length,
      }),
    });
    const field = await res.json();
    if (res.ok) {
      setFields([...fields, field]);
    }
    setSaving(false);
  }

  async function addCustomField() {
    if (!customField.fieldName || !customField.labelEn) return;
    setSaving(true);

    const res = await fetch(`/api/events/${eventId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldName: customField.fieldName.toLowerCase().replace(/\s+/g, "_"),
        fieldType: customField.fieldType,
        fieldLabels: {
          en: customField.labelEn,
          ...(customField.labelDe ? { de: customField.labelDe } : {}),
        },
        isRequired: customField.isRequired,
        sortOrder: fields.length,
      }),
    });

    const field = await res.json();
    if (res.ok) {
      setFields([...fields, field]);
      setCustomField({ fieldName: "", fieldType: "text", labelEn: "", labelDe: "", isRequired: false });
      setShowCustom(false);
    }
    setSaving(false);
  }

  async function moveField(index: number, direction: "up" | "down") {
    const newFields = [...fields];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newFields.length) return;

    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    const reordered = newFields.map((f, i) => ({ ...f, sortOrder: i }));
    setFields(reordered);

    await fetch(`/api/events/${eventId}/fields`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: reordered.map((f) => ({ id: f.id, sortOrder: f.sortOrder })),
      }),
    });
  }

  // Group library fields by category, excluding already-added ones
  const existingNames = new Set(fields.map((f) => f.fieldName));
  const availableLibrary = fieldLibrary.filter((t) => !existingNames.has(t.fieldName));
  const categories = [...new Set(availableLibrary.map((t) => t.category))];

  if (loading) {
    return <div className="text-sm text-neutral-500">Loading fields...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to event
        </Link>
        <h1 className="text-2xl font-bold mt-2">Field Configuration</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Configure the fields for this event. These fields determine what data is captured from scans and digital forms.
        </p>
      </div>

      {/* Current fields */}
      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            No fields configured yet. Add fields from the library or create custom fields.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveField(index, "up")}
                  disabled={index === 0}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-20 dark:hover:text-neutral-100"
                  aria-label="Move up"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveField(index, "down")}
                  disabled={index === fields.length - 1}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-20 dark:hover:text-neutral-100"
                  aria-label="Move down"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {(field.fieldLabels as Record<string, string>)?.en || field.fieldName}
                </div>
                <div className="text-xs text-neutral-500">
                  {field.fieldType} &middot; {field.fieldName}
                  {field.isRequired && (
                    <span className="ml-1 text-red-500">required</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setShowLibrary(!showLibrary); setShowCustom(false); }}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {showLibrary ? "Hide library" : "Add from library"}
        </button>
        <button
          onClick={() => { setShowCustom(!showCustom); setShowLibrary(false); }}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {showCustom ? "Cancel" : "Create custom field"}
        </button>
      </div>

      {/* Field library */}
      {showLibrary && (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">
                {cat}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableLibrary
                  .filter((t) => t.category === cat)
                  .map((template) => (
                    <button
                      key={template.fieldName}
                      onClick={() => addFromLibrary(template)}
                      disabled={saving}
                      className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-left hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                    >
                      <div>
                        <div className="text-sm font-medium">{template.fieldLabels.en}</div>
                        <div className="text-xs text-neutral-500">
                          {template.fieldType}
                          {template.isRequired && " · required"}
                        </div>
                      </div>
                      <span className="text-xs text-neutral-400">+ Add</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom field form */}
      {showCustom && (
        <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Canonical name</label>
              <input
                type="text"
                value={customField.fieldName}
                onChange={(e) => setCustomField({ ...customField, fieldName: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                placeholder="e.g. preferred_contact"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Type</label>
              <select
                value={customField.fieldType}
                onChange={(e) => setCustomField({ ...customField, fieldType: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="date">Date</option>
                <option value="textarea">Text area</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
                <option value="select">Select</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Label (English)</label>
              <input
                type="text"
                value={customField.labelEn}
                onChange={(e) => setCustomField({ ...customField, labelEn: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Label (German, optional)</label>
              <input
                type="text"
                value={customField.labelDe}
                onChange={(e) => setCustomField({ ...customField, labelDe: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={customField.isRequired}
              onChange={(e) => setCustomField({ ...customField, isRequired: e.target.checked })}
              className="rounded border-neutral-300 dark:border-neutral-700"
            />
            Required field
          </label>
          <button
            onClick={addCustomField}
            disabled={saving || !customField.fieldName || !customField.labelEn}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {saving ? "Adding..." : "Add field"}
          </button>
        </div>
      )}
    </div>
  );
}
