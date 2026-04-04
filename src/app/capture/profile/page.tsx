"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, Monitor, Shield } from "lucide-react";
import { ListGroup, ListRow } from "@/components/ui/list-group";

export default function CaptureProfilePage() {
  const { data: session } = useSession();

  const initials = (session?.user?.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100%" }}>
      {/* Avatar + info */}
      <div style={{ padding: "var(--fold-space-6) var(--fold-space-5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-3)" }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "var(--fold-radius-full)",
          background: "var(--fold-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fold-text-inverse)",
          fontSize: "var(--fold-type-title1)",
          fontWeight: 600,
        }}>
          {initials}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "var(--fold-type-title3)", fontWeight: 600, color: "var(--fold-text-primary)", letterSpacing: "-0.02em" }}>
            {session?.user?.name}
          </div>
          <div style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", marginTop: "var(--fold-space-1)" }}>
            {session?.user?.email}
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ padding: "0 var(--fold-space-5)" }}>
        <ListGroup>
          <ListRow icon={<Monitor size={20} />} label="Open dashboard" href="/dashboard" />
          <ListRow icon={<Shield size={20} />} label="Admin panel" href="/admin" />
          <ListRow icon={<Settings size={20} />} label="Settings" href="/dashboard/settings" />
          <ListRow icon={<LogOut size={20} />} label="Sign out" onClick={() => signOut({ callbackUrl: "/auth/signin" })} destructive />
        </ListGroup>
      </div>
    </div>
  );
}
