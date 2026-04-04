"use client";

import { useState } from "react";

interface GdprResult {
  recordId: string;
  eventId: string;
  eventTitle: string;
  captureMethod: string;
  status: string;
  fields: Record<string, string>;
  createdAt: string;
}

export default function GdprPage() {
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<GdprResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSearching(true);
    setMessage("");

    const res = await fetch(`/api/gdpr?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    setResults(data.results || []);
    setSearching(false);
    setSearched(true);
  }

  async function handleExport() {
    setExporting(true);
    setMessage("");

    const res = await fetch("/api/gdpr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export", email }),
    });

    const data = await res.json();
    setExporting(false);

    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpr-export-${email}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setMessage("Data exported successfully");
  }

  async function handleErase() {
    if (
      !confirm(
        `This will permanently erase all personal data for ${email} across all events. This action cannot be undone. Are you sure?`
      )
    ) {
      return;
    }

    setErasing(true);
    setMessage("");

    const res = await fetch("/api/gdpr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "erase", email }),
    });

    const data = await res.json();
    setErasing(false);
    setMessage(data.message || "Erasure complete");
    setResults([]);
    setSearched(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GDPR Data Management</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Search, export, or erase personal data across all events.
        </p>
      </div>

      {message && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          {message}
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Search by email address"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              {results.length} record{results.length !== 1 ? "s" : ""} found for{" "}
              <strong>{email}</strong>
            </div>
            {results.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700"
                >
                  {exporting ? "Exporting..." : "Export data (L15)"}
                </button>
                <button
                  onClick={handleErase}
                  disabled={erasing}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {erasing ? "Erasing..." : "Erase data (L16)"}
                </button>
              </div>
            )}
          </div>

          {results.map((r) => (
            <div
              key={r.recordId}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">{r.eventTitle}</div>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    r.status === "reviewed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="grid gap-1 sm:grid-cols-2 text-sm">
                {Object.entries(r.fields).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-neutral-500">{key}: </span>
                    <span>{value || "—"}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-neutral-400 mt-2">
                {r.captureMethod} &middot; {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
