"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organization: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to update profile");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Fold</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Complete your profile to continue
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="organization"
              className="block text-sm font-medium mb-1"
            >
              Organization
            </label>
            <input
              id="organization"
              type="text"
              required
              value={form.organization}
              onChange={(e) => update("organization", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
              placeholder="e.g. RCCG New Song Parish"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-1">
              Country
            </label>
            <select
              id="country"
              required
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
            >
              <option value="">Select country</option>
              <option value="DE">Germany</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="ZA">South Africa</option>
              <option value="KE">Kenya</option>
              <option value="CA">Canada</option>
              <option value="FR">France</option>
              <option value="NL">Netherlands</option>
              <option value="AT">Austria</option>
              <option value="CH">Switzerland</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Saving..." : "Continue to dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
