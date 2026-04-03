"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    date: "",
    description: "",
    primaryLanguage: "en",
    secondaryLanguage: "",
    expectedAttendeesMin: "",
    expectedAttendeesMax: "",
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

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        date: form.date,
        description: form.description || undefined,
        primaryLanguage: form.primaryLanguage,
        secondaryLanguage: form.secondaryLanguage || undefined,
        expectedAttendeesMin: form.expectedAttendeesMin
          ? parseInt(form.expectedAttendeesMin)
          : undefined,
        expectedAttendeesMax: form.expectedAttendeesMax
          ? parseInt(form.expectedAttendeesMax)
          : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create event");
      return;
    }

    router.push(`/dashboard/events/${data.id}`);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/dashboard/events"
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to events
        </Link>
        <h1 className="text-2xl font-bold mt-2">Create event</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Event title
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
            placeholder="e.g. Sunday Service - New Converts"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Event date
          </label>
          <input
            id="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="primaryLanguage"
              className="block text-sm font-medium mb-1"
            >
              Primary language
            </label>
            <select
              id="primaryLanguage"
              value={form.primaryLanguage}
              onChange={(e) => update("primaryLanguage", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
            >
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="secondaryLanguage"
              className="block text-sm font-medium mb-1"
            >
              Secondary language
            </label>
            <select
              id="secondaryLanguage"
              value={form.secondaryLanguage}
              onChange={(e) => update("secondaryLanguage", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
            >
              <option value="">None</option>
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="expectedMin"
              className="block text-sm font-medium mb-1"
            >
              Expected min attendees
            </label>
            <input
              id="expectedMin"
              type="number"
              min="0"
              value={form.expectedAttendeesMin}
              onChange={(e) => update("expectedAttendeesMin", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>
          <div>
            <label
              htmlFor="expectedMax"
              className="block text-sm font-medium mb-1"
            >
              Expected max attendees
            </label>
            <input
              id="expectedMax"
              type="number"
              min="0"
              value={form.expectedAttendeesMax}
              onChange={(e) => update("expectedAttendeesMax", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Creating..." : "Create event"}
          </button>
          <Link
            href="/dashboard/events"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
