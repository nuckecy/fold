"use client";

import { useEffect, useState } from "react";

export default function AdminEmailsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); });
  }, []);

  if (loading || !stats) return <div className="text-sm text-neutral-500">Loading email insights...</div>;

  const deliveryRate = stats.emails.total > 0
    ? Math.round((stats.emails.delivered / stats.emails.total) * 100)
    : 0;
  const bounceRate = stats.emails.total > 0
    ? Math.round((stats.emails.bounced / stats.emails.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Email Insights</h1>
        <p className="text-sm text-neutral-500 mt-1">Delivery rates, bounces, and delivery issues across the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        <Card label="Total sent" value={stats.emails.total} />
        <Card label="Delivered" value={stats.emails.delivered} />
        <Card label="Sent" value={stats.emails.sent} />
        <Card label="Bounced" value={stats.emails.bounced} color={stats.emails.bounced > 0 ? "red" : undefined} />
        <Card label="Failed" value={stats.emails.failed} color={stats.emails.failed > 0 ? "red" : undefined} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Delivery rate</div>
          <div className="text-3xl font-bold mt-1">{deliveryRate}%</div>
          <div className="h-2 rounded-full bg-neutral-200 mt-2 dark:bg-neutral-800">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${deliveryRate}%` }} />
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Bounce rate</div>
          <div className={`text-3xl font-bold mt-1 ${bounceRate > 5 ? "text-red-600 dark:text-red-400" : ""}`}>{bounceRate}%</div>
          <div className="h-2 rounded-full bg-neutral-200 mt-2 dark:bg-neutral-800">
            <div className={`h-full rounded-full ${bounceRate > 5 ? "bg-red-500" : "bg-yellow-500"}`} style={{ width: `${bounceRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color === "red" ? "text-red-600 dark:text-red-400" : ""}`}>{value}</div>
    </div>
  );
}
