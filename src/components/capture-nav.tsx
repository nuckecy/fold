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
    <nav
      className="glass"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        height: 52,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        borderTop: "0.5px solid var(--separator)",
      }}
    >
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
              gap: 1,
              textDecoration: "none",
              color: isActive ? "var(--info)" : "var(--text-tertiary)",
              padding: "6px 0",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.5} />
            <span style={{
              fontSize: "var(--font-caption2)",
              fontWeight: isActive ? 600 : 400,
              letterSpacing: "0.01em",
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
