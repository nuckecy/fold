"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { GRANTABLE_PERMISSIONS } from "@/lib/permissions";

interface Permission {
  key: string;
  granted: boolean;
}

interface TeamMember {
  id: string;
  userId: string | null;
  userName: string;
  scannerEmail: string | null;
  role: string;
  status: string;
  joinedAt: string | null;
  invitationMethod: string | null;
  permissions: Permission[];
}

export default function TeamPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const loadTeam = useCallback(() => {
    fetch(`/api/events/${eventId}/team`)
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setLoading(false);
      });
  }, [eventId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  async function performAction(action: string, extra: Record<string, string> = {}) {
    setActing(true);
    await fetch(`/api/events/${eventId}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setActing(false);
    loadTeam();
  }

  if (loading) {
    return <div className="text-sm text-neutral-500">Loading team...</div>;
  }

  const admins = members.filter((m) => m.role === "admin");
  const subAdmins = members.filter((m) => m.role === "sub_admin");
  const scanners = members.filter((m) => m.role === "scanner");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to event
        </Link>
        <h1 className="text-2xl font-bold mt-2">Team Management</h1>
      </div>

      {/* Role groups */}
      {[
        { label: "Admins", members: admins },
        { label: "Sub-Admins", members: subAdmins },
        { label: "Scanners", members: scanners },
      ].map(({ label, members: group }) => (
        <div key={label}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">
            {label} ({group.length})
          </h3>
          {group.length === 0 ? (
            <p className="text-sm text-neutral-400">None</p>
          ) : (
            <div className="space-y-1">
              {group.map((member) => (
                <div
                  key={member.id}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800"
                >
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() =>
                      setExpandedMember(
                        expandedMember === member.id ? null : member.id
                      )
                    }
                  >
                    <div>
                      <div className="text-sm font-medium">{member.userName}</div>
                      <div className="text-xs text-neutral-500">
                        {member.role} &middot;{" "}
                        {member.joinedAt
                          ? `Joined ${new Date(member.joinedAt).toLocaleDateString()}`
                          : member.status}
                      </div>
                    </div>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        member.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  {/* Expanded: actions + permissions */}
                  {expandedMember === member.id && member.role !== "admin" && (
                    <div className="border-t border-neutral-200 p-3 space-y-3 dark:border-neutral-800">
                      {/* Role actions */}
                      <div className="flex gap-2">
                        {member.role === "scanner" && (
                          <button
                            onClick={() =>
                              performAction("promote", { memberId: member.id })
                            }
                            disabled={acting}
                            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                          >
                            Promote to Sub-Admin
                          </button>
                        )}
                        {member.role === "sub_admin" && (
                          <button
                            onClick={() =>
                              performAction("demote", { memberId: member.id })
                            }
                            disabled={acting}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800"
                          >
                            Demote to Scanner
                          </button>
                        )}
                      </div>

                      {/* Permission toggles for Sub-Admins */}
                      {member.role === "sub_admin" && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-neutral-500">
                            Permissions
                          </div>
                          {GRANTABLE_PERMISSIONS.map((perm) => {
                            const current = member.permissions.find(
                              (p) => p.key === perm.key
                            );
                            const isGranted = current?.granted ?? false;

                            return (
                              <label
                                key={perm.key}
                                className="flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-sm">{perm.label}</div>
                                  <div className="text-xs text-neutral-500">
                                    {perm.description}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    performAction("toggle_permission", {
                                      memberId: member.id,
                                      permissionKey: perm.key,
                                    })
                                  }
                                  disabled={acting}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    isGranted
                                      ? "bg-green-500"
                                      : "bg-neutral-300 dark:bg-neutral-700"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                      isGranted
                                        ? "translate-x-4.5"
                                        : "translate-x-0.5"
                                    }`}
                                  />
                                </button>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
