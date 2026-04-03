"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Settings {
  appLanguage: string;
  notificationPreferences: {
    emailDigest?: boolean;
    scanComplete?: boolean;
    unsubscribeAlerts?: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          appLanguage: data.appLanguage || "en",
          notificationPreferences: data.notificationPreferences || {},
        });
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);

    await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function togglePref(key: keyof Settings["notificationPreferences"]) {
    if (!settings) return;
    setSettings({
      ...settings,
      notificationPreferences: {
        ...settings.notificationPreferences,
        [key]: !settings.notificationPreferences[key],
      },
    });
  }

  if (loading || !settings) {
    return (
      <div className="text-sm text-neutral-500">Loading settings...</div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your language and notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium mb-1"
          >
            App language
          </label>
          <select
            id="language"
            value={settings.appLanguage}
            onChange={(e) =>
              setSettings({ ...settings, appLanguage: e.target.value })
            }
            className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
          >
            <option value="en">English</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Notifications</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationPreferences.emailDigest ?? true}
              onChange={() => togglePref("emailDigest")}
              className="rounded border-neutral-300 dark:border-neutral-700"
            />
            <div>
              <div className="text-sm font-medium">Email digest</div>
              <div className="text-xs text-neutral-500">
                Receive a daily summary of event activity
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationPreferences.scanComplete ?? true}
              onChange={() => togglePref("scanComplete")}
              className="rounded border-neutral-300 dark:border-neutral-700"
            />
            <div>
              <div className="text-sm font-medium">Scan completion</div>
              <div className="text-xs text-neutral-500">
                Get notified when AI processing finishes
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={
                settings.notificationPreferences.unsubscribeAlerts ?? true
              }
              onChange={() => togglePref("unsubscribeAlerts")}
              className="rounded border-neutral-300 dark:border-neutral-700"
            />
            <div>
              <div className="text-sm font-medium">Unsubscribe alerts</div>
              <div className="text-xs text-neutral-500">
                Get notified when someone unsubscribes from emails
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Settings saved
          </span>
        )}
      </div>
    </div>
  );
}
