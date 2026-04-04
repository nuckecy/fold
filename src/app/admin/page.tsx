"use client";

import { useEffect, useState } from "react";

interface AdminStats {
  users: { total: number };
  events: { total: number; active: number; closed: number; archived: number };
  records: { total: number; scans: number; digital: number };
  ai: {
    totalRequests: number;
    geminiRequests: number;
    claudeRequests: number;
    totalCost: string;
    avgLatency: number;
    successRate: number;
  };
  emails: {
    total: number;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  };
  recentActivity: Array<{
    id: string;
    actionType: string;
    description: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return <div className="text-sm text-neutral-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Platform-wide system health, AI billing, and email delivery stats.
        </p>
      </div>

      {/* System overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={stats.users.total} />
        <StatCard label="Total events" value={stats.events.total} />
        <StatCard label="Active events" value={stats.events.active} />
        <StatCard label="Total records" value={stats.records.total} />
      </div>

      {/* AI Billing (G11, L13) */}
      <div>
        <h2 className="text-lg font-semibold mb-3">AI Billing</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total AI requests" value={stats.ai.totalRequests} />
          <StatCard label="Gemini requests" value={stats.ai.geminiRequests} />
          <StatCard label="Claude requests" value={stats.ai.claudeRequests} />
          <StatCard
            label="Estimated cost"
            value={`$${Number(stats.ai.totalCost).toFixed(4)}`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <StatCard
            label="Success rate"
            value={`${stats.ai.successRate}%`}
          />
          <StatCard
            label="Avg latency"
            value={`${stats.ai.avgLatency}ms`}
          />
        </div>
      </div>

      {/* Email delivery */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Email Delivery</h2>
        <div className="grid gap-4 sm:grid-cols-5">
          <StatCard label="Total emails" value={stats.emails.total} />
          <StatCard label="Sent" value={stats.emails.sent} />
          <StatCard label="Delivered" value={stats.emails.delivered} />
          <StatCard label="Bounced" value={stats.emails.bounced} color="red" />
          <StatCard label="Failed" value={stats.emails.failed} color="red" />
        </div>
      </div>

      {/* Record breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Records</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Scans" value={stats.records.scans} />
          <StatCard label="Digital submissions" value={stats.records.digital} />
          <StatCard label="Total" value={stats.records.total} />
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Platform Activity</h2>
        <div className="space-y-1">
          {stats.recentActivity.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-2 text-sm dark:border-neutral-800"
            >
              <div>
                <span className="text-neutral-500">{log.actionType}: </span>
                {log.description}
              </div>
              <span className="text-xs text-neutral-400">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-sm text-neutral-500">{label}</div>
      <div
        className={`text-2xl font-bold mt-1 ${
          color === "red"
            ? "text-red-600 dark:text-red-400"
            : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
