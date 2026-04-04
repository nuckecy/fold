"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Settings, Monitor, Shield } from "lucide-react";

export default function CaptureProfilePage() {
  const { data: session } = useSession();

  return (
    <div style={{ minHeight: "100%" }}>
      <div style={{ padding: "24px 20px", textAlign: "center" }}>
        {/* Avatar */}
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "var(--foreground-inverse)", fontSize: "var(--font-heading)", fontWeight: 600 }}>
          {(session?.user?.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <div style={{ fontSize: "var(--font-subtitle)", fontWeight: 600, color: "var(--text-primary)", marginTop: 12 }}>
          {session?.user?.name}
        </div>
        <div style={{ fontSize: "var(--font-body-sm)", color: "var(--text-secondary)", marginTop: 2 }}>
          {session?.user?.email}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <Link href="/dashboard" className="action-row" style={{ textDecoration: "none" }}>
          <Monitor size={20} className="icon" />
          <span className="text">Open Dashboard</span>
        </Link>
        <Link href="/admin" className="action-row" style={{ textDecoration: "none" }}>
          <Shield size={20} className="icon" />
          <span className="text">Admin Panel</span>
        </Link>
        <Link href="/dashboard/settings" className="action-row" style={{ textDecoration: "none" }}>
          <Settings size={20} className="icon" />
          <span className="text">Settings</span>
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="action-row" style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}>
          <LogOut size={20} className="icon" style={{ color: "var(--error)" }} />
          <span className="text" style={{ color: "var(--error)" }}>Sign out</span>
        </button>
      </div>
    </div>
  );
}
