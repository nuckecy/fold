"use client";

import { useEffect, useState } from "react";

interface ActivityLog {
  id: string;
  actionType: string;
  actorLabel: string | null;
  actedAsDelegate: boolean | null;
  description: string;
  createdAt: string;
}

const actionIcons: Record<string, string> = {
  event_created: "plus",
  event_updated: "edit",
  event_status_changed: "arrow",
  event_duplicated: "copy",
  event_deleted: "trash",
  scan_uploaded: "camera",
  record_processed: "check",
  email_sent: "mail",
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityTimeline({ eventId }: { eventId: string }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/activity`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-500">Activity</h3>
        <div className="text-sm text-neutral-400">Loading activity...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-500">Activity</h3>
        <div className="text-sm text-neutral-400">No activity yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-500">Activity</h3>
      <div className="space-y-0">
        {logs.map((log, i) => (
          <div key={log.id} className="flex gap-3 py-2">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 dark:bg-neutral-600" />
              {i < logs.length - 1 && (
                <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-3">
              <p className="text-sm">{log.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-500">
                  {formatTime(log.createdAt)}
                </span>
                {log.actedAsDelegate && (
                  <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 dark:bg-blue-900/20 dark:text-blue-400">
                    delegate
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
