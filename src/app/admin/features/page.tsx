"use client";

import { useState } from "react";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  tier: "free" | "paid";
}

const defaultFlags: FeatureFlag[] = [
  {
    key: "sms_enabled",
    label: "SMS via Twilio",
    description: "Enable SMS as paid fallback for failed email delivery (ADR-005)",
    enabled: false,
    tier: "paid",
  },
  {
    key: "whatsapp_enabled",
    label: "WhatsApp Business",
    description: "WhatsApp messaging via Twilio (scoped for v2)",
    enabled: false,
    tier: "paid",
  },
  {
    key: "cross_org_visibility",
    label: "Cross-org visibility",
    description: "Allow viewing data across organizations (parked for v2)",
    enabled: false,
    tier: "free",
  },
  {
    key: "ai_claude_fallback",
    label: "Claude API fallback",
    description: "Use Claude Sonnet as fallback when Gemini fails",
    enabled: true,
    tier: "paid",
  },
];

export default function AdminFeaturesPage() {
  const [flags, setFlags] = useState(defaultFlags);

  function toggle(key: string) {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-sm text-neutral-500 mt-1">Enable or disable platform features. Changes apply to all organizations.</p>
      </div>

      <div className="space-y-2">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{flag.label}</span>
                {flag.tier === "paid" && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-1.5 py-0.5 dark:bg-yellow-900/20 dark:text-yellow-400">
                    paid
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">{flag.description}</div>
            </div>
            <button
              onClick={() => toggle(flag.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                flag.enabled ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  flag.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Feature flags are stored in fld_sys_feature_flags. Changes here are local to this session until persisted.
      </p>
    </div>
  );
}
