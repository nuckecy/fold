"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  authMethod: string | null;
  profileComplete: boolean | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-neutral-500">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-neutral-500 mt-1">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-1">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            <div>
              <div className="text-sm font-medium">{u.name}</div>
              <div className="text-xs text-neutral-500">{u.email}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500">{u.authMethod}</div>
              <div className="text-xs text-neutral-400">{new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
