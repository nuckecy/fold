"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Home, User, Plus, CalendarPlus, QrCode } from "lucide-react";

export function CaptureNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  const homeActive = pathname === "/capture";
  const profileActive = pathname.startsWith("/capture/profile");

  return (
    <nav
      className="glass"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        height: 56,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        borderTop: "0.5px solid var(--separator)",
        position: "relative",
      }}
    >
      {/* Home */}
      <Link
        href="/capture"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          textDecoration: "none",
          color: homeActive ? "var(--fold-accent)" : "var(--fold-text-primary)",
          padding: "6px 0",
          WebkitTapHighlightColor: "transparent",
          flex: 1,
        }}
      >
        <Home size={22} strokeWidth={homeActive ? 2.2 : 1.5} />
        <span style={{ fontSize: 10, fontWeight: homeActive ? 600 : 500, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
          Home
        </span>
      </Link>

      {/* Center + button */}
      <div ref={menuRef} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative" }}>
        {/* Popover menu */}
        {open && (
          <div
            style={{
              position: "absolute",
              bottom: 52,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--fold-bg)",
              borderRadius: "var(--fold-radius-md)",
              border: "1px solid var(--fold-border)",
              boxShadow: "var(--fold-shadow-float)",
              overflow: "hidden",
              minWidth: 200,
              animation: "fadeIn 150ms ease-out",
              zIndex: 50,
            }}
          >
            <Link
              href="/capture/events/new"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--fold-space-3)",
                padding: "var(--fold-space-3) var(--fold-space-4)",
                fontSize: "var(--fold-type-subhead)",
                fontWeight: 500,
                color: "var(--fold-text-primary)",
                textDecoration: "none",
                borderBottom: "1px solid var(--fold-divider)",
              }}
            >
              <CalendarPlus size={18} color="var(--fold-accent)" />
              Create event
            </Link>
            <Link
              href="/capture/join"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--fold-space-3)",
                padding: "var(--fold-space-3) var(--fold-space-4)",
                fontSize: "var(--fold-type-subhead)",
                fontWeight: 500,
                color: "var(--fold-text-primary)",
                textDecoration: "none",
              }}
            >
              <QrCode size={18} color="var(--fold-accent)" />
              Join a session
            </Link>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--fold-radius-full)",
            background: "var(--fold-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            transition: "transform 200ms ease",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            marginTop: -22,
          }}
        >
          <Plus size={20} color="var(--fold-text-inverse)" strokeWidth={2.5} />
        </button>
      </div>

      {/* Profile */}
      <Link
        href="/capture/profile"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          textDecoration: "none",
          color: profileActive ? "var(--fold-accent)" : "var(--fold-text-primary)",
          padding: "6px 0",
          WebkitTapHighlightColor: "transparent",
          flex: 1,
        }}
      >
        <User size={22} strokeWidth={profileActive ? 2.2 : 1.5} />
        <span style={{ fontSize: 10, fontWeight: profileActive ? 600 : 500, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
          Profile
        </span>
      </Link>
    </nav>
  );
}
