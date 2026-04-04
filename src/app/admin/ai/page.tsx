"use client";

import { useEffect, useState } from "react";

export default function AdminAIPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); });
  }, []);

  if (loading || !stats) return <div className="text-sm text-neutral-500">Loading AI billing...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Billing</h1>
        <p className="text-sm text-neutral-500 mt-1">Provider usage, costs, and performance metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Total requests" value={stats.ai.totalRequests} />
        <Card label="Estimated cost" value={`$${Number(stats.ai.totalCost).toFixed(4)}`} />
        <Card label="Success rate" value={`${stats.ai.successRate}%`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">By Provider</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="text-sm font-medium">Gemini 2.0 Flash</div>
            <div className="text-2xl font-bold mt-1">{stats.ai.geminiRequests}</div>
            <div className="text-xs text-neutral-500">requests (free tier)</div>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="text-sm font-medium">Claude Sonnet</div>
            <div className="text-2xl font-bold mt-1">{stats.ai.claudeRequests}</div>
            <div className="text-xs text-neutral-500">requests (paid fallback)</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Performance</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card label="Avg latency" value={`${stats.ai.avgLatency}ms`} />
          <Card label="Fallback triggers" value={stats.ai.claudeRequests} />
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
