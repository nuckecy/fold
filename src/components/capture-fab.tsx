"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, CalendarPlus, QrCode, X } from "lucide-react";

export function CaptureFab() {
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

  return (
    <div ref={menuRef} style={{ position: "absolute", bottom: 72, right: "var(--fold-space-5)" }}>
      {/* Menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 68,
            right: 0,
            background: "var(--fold-bg)",
            borderRadius: "var(--fold-radius-md)",
            border: "1px solid var(--fold-border)",
            boxShadow: "var(--fold-shadow-float)",
            overflow: "hidden",
            minWidth: 200,
            animation: "fadeIn 150ms ease-out",
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

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 52,
          height: 52,
          borderRadius: "var(--fold-radius-full)",
          background: "var(--fold-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--fold-shadow-float)",
          border: "none",
          cursor: "pointer",
          transition: "transform 200ms ease",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        <Plus size={22} color="var(--fold-text-inverse)" strokeWidth={2.5} />
      </button>
    </div>
  );
}
