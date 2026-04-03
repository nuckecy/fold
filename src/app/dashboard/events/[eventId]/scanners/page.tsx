"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Member {
  id: string;
  role: string;
  scannerEmail: string | null;
  status: string;
  joinedAt: string | null;
  invitationMethod: string | null;
}

export default function ScannersPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [data, setData] = useState<{
    members: Member[];
    joinUrl: string | null;
    joinCode: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/events/${eventId}/scanners`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [eventId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setMessage("");

    const res = await fetch(`/api/events/${eventId}/scanners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });

    setInviting(false);

    if (res.ok) {
      setMessage(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      // Reload
      const d = await fetch(`/api/events/${eventId}/scanners`).then((r) => r.json());
      setData(d);
    } else {
      const err = await res.json();
      setMessage(err.error || "Failed to send invitation");
    }
  }

  if (loading || !data) {
    return <div className="text-sm text-neutral-500">Loading...</div>;
  }

  const scanners = data.members.filter((m) => m.role === "scanner");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to event
        </Link>
        <h1 className="text-2xl font-bold mt-2">Scanners</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Invite others to help scan registration cards.
        </p>
      </div>

      {/* QR / Code sharing */}
      {data.joinCode && (
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 space-y-3">
          <h3 className="text-sm font-medium">Share join code</h3>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-mono font-bold tracking-widest">
              {data.joinCode}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(data.joinCode || "")}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Copy code
            </button>
          </div>
          {data.joinUrl && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={data.joinUrl}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
              />
              <button
                onClick={() => navigator.clipboard.writeText(data.joinUrl || "")}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Copy link
              </button>
            </div>
          )}
          <p className="text-xs text-neutral-500">
            Scanners can join by visiting the link or entering the code at /scan
          </p>
        </div>
      )}

      {/* Email invitation */}
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 space-y-3">
        <h3 className="text-sm font-medium">Invite by email</h3>
        {message && (
          <div className="text-sm text-green-600 dark:text-green-400">{message}</div>
        )}
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="scanner@example.com"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            required
          />
          <button
            type="submit"
            disabled={inviting}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {inviting ? "Sending..." : "Invite"}
          </button>
        </form>
      </div>

      {/* Active scanners */}
      <div>
        <h3 className="text-sm font-medium text-neutral-500 mb-2">
          Active scanners ({scanners.length})
        </h3>
        {scanners.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No scanners have joined yet.
          </p>
        ) : (
          <div className="space-y-1">
            {scanners.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <div>
                  <div className="text-sm font-medium">
                    {s.scannerEmail || "Unknown scanner"}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Joined {s.joinedAt ? new Date(s.joinedAt).toLocaleString() : "—"}{" "}
                    via {s.invitationMethod}
                  </div>
                </div>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    s.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
