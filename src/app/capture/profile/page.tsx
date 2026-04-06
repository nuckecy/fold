"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, Monitor, Shield } from "lucide-react";
import { ListGroup, ListRow } from "@/components/ui/list-group";

export default function CaptureProfilePage() {
  const { data: session } = useSession();

  const initials = (session?.user?.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100%" }}>
      {/* App name */}
      <div style={{ padding: "var(--fold-space-4) var(--fold-space-5) 0" }}>
        <span style={{ fontSize: "var(--fold-type-title2)", fontWeight: 700, color: "var(--fold-text-primary)", letterSpacing: "-0.03em" }}>
          Fold
        </span>
      </div>

      {/* Avatar + info */}
      <div style={{ padding: "var(--fold-space-5) var(--fold-space-5)", display: "flex", alignItems: "center", gap: "var(--fold-space-4)" }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "var(--fold-radius-full)",
          background: "var(--fold-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fold-text-inverse)",
          fontSize: "var(--fold-type-headline)",
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: "var(--fold-type-headline)", fontWeight: 600, color: "var(--fold-text-primary)", letterSpacing: "-0.02em" }}>
            {session?.user?.name}
          </div>
          <div style={{ fontSize: "var(--fold-type-caption)", color: "var(--fold-text-tertiary)", marginTop: 2 }}>
            {session?.user?.email}
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ padding: "0 var(--fold-space-5)", display: "flex", flexDirection: "column", gap: "var(--fold-space-4)" }}>
        <ListGroup>
          <ListRow icon={<Monitor size={20} />} label="Open dashboard" href="/dashboard" />
          <ListRow icon={<Shield size={20} />} label="Admin panel" href="/admin" />
          <ListRow icon={<Settings size={20} />} label="Settings" href="/dashboard/settings" />
        </ListGroup>

        <ListGroup>
          <ListRow icon={<LogOut size={20} />} label="Sign out" onClick={() => signOut({ callbackUrl: "/auth/signin" })} destructive />
        </ListGroup>
      </div>
    </div>
  );
}
