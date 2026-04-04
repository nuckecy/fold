"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FormSettings {
  exists: boolean;
  shortCode?: string;
  formUrl?: string;
}

export default function CaptureFormPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/form`)
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false); });
  }, [eventId]);

  async function createForm() {
    setCreating(true);
    const res = await fetch(`/api/events/${eventId}/form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setSettings({ exists: true, ...data });
    setCreating(false);
  }

  function copyUrl() {
    navigator.clipboard.writeText(settings?.formUrl || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="text-sm text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/capture/events/${eventId}`} className="text-sm text-neutral-500">&larr; Back</Link>
        <h1 className="text-xl font-bold mt-1">Digital Form</h1>
      </div>

      {!settings?.exists ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-neutral-500">Create a digital form so attendees can submit online.</p>
          <button onClick={createForm} disabled={creating} className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900">
            {creating ? "Creating..." : "Create form"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="text-xs text-neutral-500 mb-1">Form URL</div>
            <div className="text-sm font-mono break-all">{settings.formUrl}</div>
            <div className="flex gap-2 mt-3">
              <button onClick={copyUrl} className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-700">
                {copied ? "Copied!" : "Copy link"}
              </button>
              <a href={`/api/events/${eventId}/form/qr?format=png`} download className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-center dark:border-neutral-700">
                QR Code
              </a>
            </div>
          </div>

          <a href={settings.formUrl} target="_blank" rel="noopener noreferrer" className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-center text-sm font-medium dark:border-neutral-700">
            Preview form
          </a>
        </div>
      )}
    </div>
  );
}
