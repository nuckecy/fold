"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FormSettings {
  exists: boolean;
  id?: string;
  shortCode?: string;
  formUrl?: string;
  isEnabled?: boolean;
  isManuallyClosed?: boolean;
  formLanguage?: string;
  welcomeMessage?: string;
  confirmationMessage?: string;
  dataProtectionText?: string;
  allowMultipleSubmissions?: boolean;
}

export default function FormManagementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/form`)
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, [eventId]);

  async function createForm() {
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}/form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setSettings({ exists: true, ...data });
    setSaving(false);
  }

  async function toggleForm(field: string, value: boolean) {
    setSaving(true);
    await fetch(`/api/events/${eventId}/form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSettings((s) => (s ? { ...s, [field]: value } : s));
    setSaving(false);
  }

  if (loading) {
    return <div className="text-sm text-neutral-500">Loading form settings...</div>;
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
        <h1 className="text-2xl font-bold mt-2">Digital Form</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Configure and share the digital form for this event.
        </p>
      </div>

      {!settings?.exists ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <h3 className="text-lg font-medium">No form configured</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Create a digital form so attendees can submit their information online.
          </p>
          <button
            onClick={createForm}
            disabled={saving}
            className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {saving ? "Creating..." : "Create form"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Share links */}
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 space-y-3">
            <h3 className="text-sm font-medium">Share this form</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={settings.formUrl || ""}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
              />
              <button
                onClick={() =>
                  navigator.clipboard.writeText(settings.formUrl || "")
                }
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Copy
              </button>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/events/${eventId}/form/qr?format=png`}
                download
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Download QR (PNG)
              </a>
              <a
                href={`/api/events/${eventId}/form/qr?format=svg`}
                download
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Download QR (SVG)
              </a>
              <a
                href={settings.formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Preview form
              </a>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-medium">Form controls</h3>

            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Form enabled</div>
                <div className="text-xs text-neutral-500">
                  Accept new submissions
                </div>
              </div>
              <button
                onClick={() =>
                  toggleForm("isEnabled", !settings.isEnabled)
                }
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.isEnabled
                    ? "bg-green-500"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.isEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Allow multiple submissions</div>
                <div className="text-xs text-neutral-500">
                  Same email can submit more than once
                </div>
              </div>
              <button
                onClick={() =>
                  toggleForm(
                    "allowMultipleSubmissions",
                    !settings.allowMultipleSubmissions
                  )
                }
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowMultipleSubmissions
                    ? "bg-green-500"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowMultipleSubmissions
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Manually closed</div>
                <div className="text-xs text-neutral-500">
                  Show "form closed" message
                </div>
              </div>
              <button
                onClick={() =>
                  toggleForm("isManuallyClosed", !settings.isManuallyClosed)
                }
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.isManuallyClosed
                    ? "bg-red-500"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.isManuallyClosed
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
