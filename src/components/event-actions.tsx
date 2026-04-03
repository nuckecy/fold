"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface EventActionsProps {
  eventId: string;
  currentStatus: string;
  recordCount: number;
}

const transitions: Record<string, { label: string; target: string; variant: string }[]> = {
  active: [{ label: "Close event", target: "closed", variant: "warning" }],
  closed: [
    { label: "Reopen event", target: "active", variant: "default" },
    { label: "Archive event", target: "archived", variant: "warning" },
  ],
  archived: [
    { label: "Hibernate event", target: "hibernated", variant: "danger" },
  ],
};

export function EventActions({
  eventId,
  currentStatus,
  recordCount,
}: EventActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const available = transitions[currentStatus] || [];
  const canDelete = recordCount < 4 && currentStatus === "active";
  const canDuplicate = currentStatus !== "hibernated";

  async function handleDuplicate() {
    setError("");
    setLoading("duplicate");

    const res = await fetch(`/api/events/${eventId}/duplicate`, {
      method: "POST",
    });

    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Failed to duplicate event");
      return;
    }

    router.push(`/dashboard/events/${data.id}`);
  }

  async function handleTransition(target: string) {
    setError("");
    setLoading(target);

    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target }),
    });

    setLoading(null);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update event");
      return;
    }

    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      return;
    }

    setError("");
    setLoading("delete");

    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });

    setLoading(null);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete event");
      return;
    }

    router.push("/dashboard/events");
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-500">Event actions</h3>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canDuplicate && (
          <button
            onClick={handleDuplicate}
            disabled={loading !== null}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {loading === "duplicate" ? "Duplicating..." : "Duplicate event"}
          </button>
        )}

        {available.map(({ label, target, variant }) => (
          <button
            key={target}
            onClick={() => handleTransition(target)}
            disabled={loading !== null}
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700"
                : variant === "warning"
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            }`}
          >
            {loading === target ? "Updating..." : label}
          </button>
        ))}

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={loading !== null}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading === "delete" ? "Deleting..." : "Delete event"}
          </button>
        )}

        {recordCount >= 4 && currentStatus !== "archived" && currentStatus !== "hibernated" && (
          <p className="text-xs text-neutral-500 self-center">
            This event has {recordCount} records and cannot be deleted (ADR-003).
          </p>
        )}
      </div>
    </div>
  );
}
