"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get("record");
  const eventId = searchParams.get("event");
  const token = searchParams.get("token");

  const [scope, setScope] = useState<"event" | "global">("event");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUnsubscribe() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, eventId, token, scope }),
    });

    setLoading(false);

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to process unsubscribe request");
    }
  }

  if (!recordId || !eventId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-sm text-neutral-500 mt-2">
            This unsubscribe link is not valid.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <h1 className="text-2xl font-bold">Unsubscribed</h1>
          <p className="text-sm text-neutral-500">
            You have been successfully unsubscribed
            {scope === "global"
              ? " from all future emails."
              : " from this event's emails."}
          </p>
          <p className="text-xs text-neutral-400">
            Changed your mind? You can re-subscribe within 30 days using the link sent to your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Unsubscribe</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Choose how you would like to unsubscribe.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4 cursor-pointer hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
            <input
              type="radio"
              name="scope"
              checked={scope === "event"}
              onChange={() => setScope("event")}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium">This event only</div>
              <div className="text-xs text-neutral-500">
                Stop receiving emails from this specific event
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4 cursor-pointer hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
            <input
              type="radio"
              name="scope"
              checked={scope === "global"}
              onChange={() => setScope("global")}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium">All events</div>
              <div className="text-xs text-neutral-500">
                Stop receiving all emails from this organization
              </div>
            </div>
          </label>
        </div>

        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Unsubscribe"}
        </button>

        <p className="text-center text-xs text-neutral-400">
          Powered by Fold
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeForm />
    </Suspense>
  );
}
