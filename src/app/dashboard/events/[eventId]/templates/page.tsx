"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TemplateVersion {
  id: string;
  language: string;
  subject: string;
  status: string;
}

interface Template {
  id: string;
  name: string;
  isDefault: boolean;
  versions: TemplateVersion[];
}

export default function TemplatesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/templates`)
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      });
  }, [eventId]);

  if (loading) {
    return <div className="text-sm text-neutral-500">Loading templates...</div>;
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
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <Link
            href={`/dashboard/events/${eventId}/templates/new`}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            New template
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            No email templates yet. Create your first template to start building email sequences.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {t.name}
                    {t.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 dark:bg-blue-900/20 dark:text-blue-400">
                        default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {t.versions.length} language version{t.versions.length !== 1 ? "s" : ""}:
                    {" "}
                    {t.versions.map((v) => v.language.toUpperCase()).join(", ")}
                  </div>
                </div>
                <div className="flex gap-1">
                  {t.versions.map((v) => (
                    <span
                      key={v.id}
                      className={`text-xs rounded px-1.5 py-0.5 ${
                        v.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : v.status === "auto_translated"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      }`}
                    >
                      {v.language.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              {t.versions[0] && (
                <div className="text-sm text-neutral-600 mt-2 dark:text-neutral-400">
                  Subject: {t.versions[0].subject}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
