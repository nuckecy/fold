"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { TipTapEditor } from "@/components/tiptap-editor";

export default function NewTemplatePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    language: "en",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create template");
      return;
    }

    router.push(`/dashboard/events/${eventId}/templates`);
  }

  const mergeFields = [
    "{{first_name}}",
    "{{last_name}}",
    "{{full_name}}",
    "{{email}}",
    "{{event_name}}",
    "{{event_date}}",
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}/templates`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to templates
        </Link>
        <h1 className="text-2xl font-bold mt-2">New Email Template</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Template name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="e.g. Welcome email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email subject
          </label>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="e.g. Welcome to {{event_name}}"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email body</label>
          <TipTapEditor
            content={form.body}
            onChange={(html) => update("body", html)}
            placeholder="Dear {{first_name}}, thank you for attending {{event_name}}..."
            mergeFields={mergeFields}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Use the toolbar to format text and insert merge fields.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Creating..." : "Create template"}
          </button>
          <Link
            href={`/dashboard/events/${eventId}/templates`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
