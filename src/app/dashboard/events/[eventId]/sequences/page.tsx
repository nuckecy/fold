"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Countdown {
  id: string;
  status: string;
  scheduledSendAt: string;
  pausedAt: string | null;
  resetCount: number;
}

interface Sequence {
  id: string;
  templateId: string;
  sequenceOrder: number;
  sendType: string;
  status: string;
  countdown: Countdown | null;
}

export default function SequencesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(new Date());

  const loadSequences = useCallback(() => {
    fetch(`/api/events/${eventId}/sequences`)
      .then((res) => res.json())
      .then((data) => {
        setSequences(data);
        setLoading(false);
      });
  }, [eventId]);

  useEffect(() => {
    loadSequences();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadSequences]);

  async function performAction(action: string, extra: Record<string, string> = {}) {
    setActing(action);
    setMessage("");

    const res = await fetch(`/api/events/${eventId}/sequences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });

    const data = await res.json();
    setActing(null);

    if (res.ok) {
      if (action === "send") {
        setMessage(`Sent ${data.sent} email${data.sent !== 1 ? "s" : ""}. ${data.skipped} skipped, ${data.failed} failed.`);
      }
      loadSequences();
    } else {
      setMessage(data.error || "Action failed");
    }
  }

  function formatCountdown(scheduledAt: string): string {
    const target = new Date(scheduledAt);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "Ready to send";
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s remaining`;
  }

  if (loading) {
    return <div className="text-sm text-neutral-500">Loading sequences...</div>;
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
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold">Email Sequences</h1>
          <Link
            href={`/dashboard/events/${eventId}/templates`}
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Manage templates &rarr;
          </Link>
        </div>
        <p className="text-sm text-neutral-500 mt-1">
          Every email send requires a mandatory 1-hour countdown. No bypass.
        </p>
      </div>

      {message && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          {message}
        </div>
      )}

      {sequences.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            No email sequences configured. Create a template first, then set up your email sequence.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    Step {seq.sequenceOrder}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {seq.sendType} &middot; Template: {seq.templateId.slice(0, 8)}...
                  </div>
                </div>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    seq.status === "sent"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : seq.status === "scheduled"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  }`}
                >
                  {seq.status}
                </span>
              </div>

              {/* Countdown display */}
              {seq.countdown && (
                <div className="rounded-md bg-neutral-50 p-3 dark:bg-neutral-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium tabular-nums">
                        {seq.countdown.status === "paused"
                          ? "Paused"
                          : formatCountdown(seq.countdown.scheduledSendAt)}
                      </div>
                      {seq.countdown.resetCount > 0 && (
                        <div className="text-xs text-neutral-500">
                          Reset {seq.countdown.resetCount} time{seq.countdown.resetCount > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {seq.countdown.status === "counting" && (
                        <>
                          <button
                            onClick={() =>
                              performAction("pause", { countdownId: seq.countdown!.id })
                            }
                            disabled={acting !== null}
                            className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            Pause
                          </button>
                          <button
                            onClick={() =>
                              performAction("cancel", { countdownId: seq.countdown!.id })
                            }
                            disabled={acting !== null}
                            className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                          >
                            Cancel
                          </button>
                          {new Date(seq.countdown.scheduledSendAt) <= now && (
                            <button
                              onClick={() =>
                                performAction("send", { sequenceId: seq.id })
                              }
                              disabled={acting !== null}
                              className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              {acting === "send" ? "Sending..." : "Send now"}
                            </button>
                          )}
                        </>
                      )}
                      {seq.countdown.status === "paused" && (
                        <button
                          onClick={() =>
                            performAction("resume", { countdownId: seq.countdown!.id })
                          }
                          disabled={acting !== null}
                          className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                        >
                          Resume (restarts 1h)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions for draft sequences */}
              {seq.status === "draft" && !seq.countdown && (
                <button
                  onClick={() =>
                    performAction("start_countdown", { sequenceId: seq.id })
                  }
                  disabled={acting !== null}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {acting === "start_countdown"
                    ? "Starting..."
                    : "Start 1-hour countdown"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
