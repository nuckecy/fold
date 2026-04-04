"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, Calendar, User } from "lucide-react";

const tabs = [
  { href: "/capture", label: "Home", icon: Home },
  { href: "/capture/scan", label: "Scan", icon: Camera },
  { href: "/capture/events", label: "Events", icon: Calendar },
  { href: "/capture/profile", label: "Profile", icon: User },
];

export function CaptureNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      height: 56,
      background: "var(--bg)",
      borderTop: "1px solid var(--border)",
    }}>
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/capture"
            ? pathname === "/capture"
            : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              color: isActive ? "var(--brand)" : "var(--text-secondary)",
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: "var(--font-caption)", fontWeight: isActive ? 500 : 400 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
