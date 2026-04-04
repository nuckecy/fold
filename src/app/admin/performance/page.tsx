"use client";

import { useEffect, useState } from "react";

export default function AdminPerformancePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); });
  }, []);

  if (loading || !stats) return <div className="text-sm text-neutral-500">Loading performance data...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-sm text-neutral-500 mt-1">Processing times, queue depth, and system health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="AI avg latency" value={`${stats.ai.avgLatency}ms`} threshold={stats.ai.avgLatency > 5000} />
        <Card label="AI success rate" value={`${stats.ai.successRate}%`} threshold={stats.ai.successRate < 90} />
        <Card label="Total records processed" value={stats.records.total} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">System Health</h2>
        <div className="space-y-2">
          <HealthRow label="Database" status="healthy" detail="PostgreSQL 16 via Coolify" />
          <HealthRow label="Redis" status="healthy" detail="Queue and cache layer" />
          <HealthRow label="AI Primary (Gemini)" status={stats.ai.successRate > 80 ? "healthy" : "degraded"} detail={`${stats.ai.geminiRequests} requests, ${stats.ai.avgLatency}ms avg`} />
          <HealthRow label="AI Fallback (Claude)" status="standby" detail={`${stats.ai.claudeRequests} fallback triggers`} />
          <HealthRow label="Email (Resend)" status={stats.emails.failed > 0 ? "degraded" : "healthy"} detail={`${stats.emails.bounced} bounces, ${stats.emails.failed} failures`} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Platform Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card label="Users" value={stats.users.total} />
          <Card label="Events" value={stats.events.total} />
          <Card label="Active events" value={stats.events.active} />
          <Card label="Total emails" value={stats.emails.total} />
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, threshold }: { label: string; value: string | number; threshold?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${threshold ? "text-red-600 dark:text-red-400" : ""}`}>{value}</div>
    </div>
  );
}

function HealthRow({ label, status, detail }: { label: string; status: string; detail: string }) {
  const color = status === "healthy" ? "bg-green-500" : status === "degraded" ? "bg-yellow-500" : "bg-neutral-400";
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs text-neutral-500">{detail}</span>
    </div>
  );
}
