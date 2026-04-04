"use client";

import { useEffect, useState } from "react";
import { CaptureNav } from "./capture-nav";

export function CaptureShell({
  initials,
  children,
}: {
  initials: string;
  children: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);

    // Set CSS custom property for actual viewport height (handles all devices)
    const setVh = () => {
      document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("resize", setVh);
    };
  }, []);

  const header = (
    <div
      className="glass"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--fold-space-3) var(--fold-space-5)",
        borderBottom: "0.5px solid var(--fold-divider)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "var(--fold-type-title2)", fontWeight: 700, color: "var(--fold-accent)", letterSpacing: "-0.03em" }}>
        Fold
      </span>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "var(--fold-radius-full)",
          background: "var(--fold-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fold-text-inverse)",
          fontSize: "var(--fold-type-footnote)",
          fontWeight: 600,
        }}
      >
        {initials}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E8ECF0 0%, #D5DAE0 100%)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 393,
            height: 852,
            background: "#1A1A1A",
            borderRadius: 54,
            padding: 11,
            boxShadow: "0 50px 100px rgba(0,0,0,0.3), 0 15px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 126, height: 36, background: "#000", borderRadius: 20, zIndex: 50 }} />

          <div style={{ position: "relative", width: "100%", height: "100%", background: "var(--fold-bg-grouped)", borderRadius: 44, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 54, flexShrink: 0 }} />
            {header}
            <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", minHeight: 0, paddingBottom: 20 }}>
              {children}
            </main>
            <div style={{ flexShrink: 0 }}><CaptureNav /></div>
            <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8, paddingTop: 4, flexShrink: 0 }}>
              <div style={{ width: 134, height: 5, background: "rgba(0,0,0,0.18)", borderRadius: "var(--fold-radius-full)" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile — uses var(--app-height) for true device height
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "var(--app-height, 100dvh)",
        overflow: "hidden",
        background: "var(--fold-bg-grouped)",
      }}
    >
      <div style={{ flexShrink: 0, zIndex: 40 }}>{header}</div>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          minHeight: 0,
          paddingBottom: 76, /* nav (52) + 20px bottom + 4px buffer */
        }}
      >
        {children}
      </main>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40 }}>
        <CaptureNav />
        {/* 20px safe area at the very bottom */}
        <div style={{ height: 20, background: "var(--fold-bg)" }} />
      </div>
    </div>
  );
}
