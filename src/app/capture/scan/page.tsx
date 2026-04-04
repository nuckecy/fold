import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";

export default async function CaptureScanListPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await db
    .select({ event: fldEvtEvents, role: fldEvtMembers.role })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(eq(fldEvtMembers.userId, session.user.id));

  const activeEvents = memberships.filter((m) => m.event.status === "active");

  return (
    <div style={{ minHeight: "100%" }}>
      <div style={{ padding: "16px 20px" }}>
        <h1 style={{ fontSize: "var(--font-title)", fontWeight: 700, color: "var(--text-primary)" }}>
          Scan
        </h1>
        <p style={{ fontSize: "var(--font-body-sm)", color: "var(--text-secondary)", marginTop: 4 }}>
          Select an event to start scanning cards.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
        {activeEvents.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 20px", textAlign: "center" }}>
            <Camera size={40} color="var(--text-secondary)" />
            <p style={{ fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>
              No active events to scan.
            </p>
            <Link href="/capture/events/new" className="btn-primary" style={{ width: "auto", padding: "0 24px" }}>
              Create an event
            </Link>
          </div>
        ) : (
          activeEvents.map(({ event }) => (
            <Link
              key={event.id}
              href={`/capture/events/${event.id}/scan`}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 4, background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Camera size={20} color="var(--brand)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--font-body-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
                  {event.title}
                </div>
                <div style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)" }}>
                  {event.date}
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Link>
          ))
        )}
      </div>

      {/* Join session link */}
      <div style={{ padding: "24px 20px", textAlign: "center" }}>
        <Link href="/scan" style={{ fontSize: "var(--font-body-sm)", color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
          Join someone else's scanning session
        </Link>
      </div>
    </div>
  );
}
