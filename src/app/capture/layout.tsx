import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CaptureNav } from "@/components/capture-nav";

export const metadata = {
  title: "Fold Capture",
  description: "Capture attendee data from events",
};

export default async function CaptureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin?callbackUrl=/capture");

  const initials = (session.user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Desktop: iPhone device frame */}
      <div className="hidden md:flex" style={{ position: "fixed", inset: 0, alignItems: "center", justifyContent: "center", background: "#E5E5EA" }}>
        <div style={{ position: "relative", width: 393, height: 852, background: "#000", borderRadius: "3rem", padding: 12, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          {/* Dynamic Island */}
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 126, height: 37, background: "#000", borderRadius: 9999, zIndex: 50 }} />

          {/* Screen */}
          <div style={{ position: "relative", width: "100%", height: "100%", background: "var(--app-bg)", borderRadius: "2.4rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 54, flexShrink: 0 }} />

            {/* TopBar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--bg)", flexShrink: 0 }}>
              <span style={{ fontSize: "var(--font-heading)", fontWeight: 600, color: "var(--brand)" }}>Fold</span>
              <div style={{ width: 32, height: 32, borderRadius: 9999, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--foreground-inverse)", fontSize: "var(--font-caption)", fontWeight: 600 }}>
                {initials}
              </div>
            </div>

            <main style={{ flex: 1, overflowY: "auto", paddingBottom: 0 }}>
              {children}
            </main>

            <div style={{ flexShrink: 0 }}>
              <CaptureNav />
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0", background: "var(--bg)", flexShrink: 0 }}>
              <div style={{ width: 134, height: 5, background: "#D1D5DB", borderRadius: 9999 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: full-screen */}
      <div className="md:hidden" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--app-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--bg)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--font-heading)", fontWeight: 600, color: "var(--brand)" }}>Fold</span>
          <div style={{ width: 32, height: 32, borderRadius: 9999, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--foreground-inverse)", fontSize: "var(--font-caption)", fontWeight: 600 }}>
            {initials}
          </div>
        </div>

        <main style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
          {children}
        </main>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
          <CaptureNav />
        </div>
      </div>
    </>
  );
}
