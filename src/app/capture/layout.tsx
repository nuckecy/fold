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

  const header = (
    <div className="glass" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "0.5px solid var(--separator)", flexShrink: 0 }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.03em" }}>Fold</span>
      <div style={{ width: 34, height: 34, borderRadius: 9999, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600 }}>{initials}</div>
    </div>
  );

  return (
    <>
      <style>{`
        .capture-desktop { display: none; }
        .capture-mobile { display: flex; }
        @media (min-width: 768px) {
          .capture-desktop { display: flex !important; }
          .capture-mobile { display: none !important; }
        }
      `}</style>

      {/* Desktop: iPhone device frame */}
      <div className="capture-desktop" style={{ position: "fixed", inset: 0, alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #E8ECF0 0%, #D5DAE0 100%)" }}>
        <div style={{ position: "relative", width: 393, height: 852, background: "#1A1A1A", borderRadius: 54, padding: 11, boxShadow: "0 50px 100px rgba(0,0,0,0.3), 0 15px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 126, height: 36, background: "#000", borderRadius: 20, zIndex: 50 }} />
          <div style={{ position: "relative", width: "100%", height: "100%", background: "#F2F2F7", borderRadius: 44, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 54, flexShrink: 0 }} />
            {header}
            <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
            <div style={{ flexShrink: 0 }}><CaptureNav /></div>
            <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8, paddingTop: 4, flexShrink: 0 }}>
              <div style={{ width: 134, height: 5, background: "rgba(0,0,0,0.18)", borderRadius: 9999 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: full-screen */}
      <div className="capture-mobile" style={{ flexDirection: "column", minHeight: "100vh", background: "#F2F2F7" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 40 }}>{header}</div>
        <main style={{ flex: 1, paddingBottom: 60 }}>{children}</main>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40 }}><CaptureNav /></div>
      </div>
    </>
  );
}
