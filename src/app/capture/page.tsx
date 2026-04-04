import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

export default async function CaptureHomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const firstName = session.user.name?.split(" ")[0] || "there";

  const memberships = await db
    .select({ event: fldEvtEvents, role: fldEvtMembers.role })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(eq(fldEvtMembers.userId, session.user.id));

  return (
    <div>
      {/* Greeting */}
      <div style={{ padding: "0 16px", marginTop: 8 }}>
        <p style={{ fontSize: "var(--font-body-lg)", fontWeight: 500, color: "var(--text-primary)" }}>
          Good morning, {firstName}
        </p>
      </div>

      {/* Event cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 20px" }}>
        {memberships.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 40px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, color: "var(--text-secondary)" }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM12 8v8m-4-4h8" /></svg>
            </div>
            <p style={{ fontSize: "var(--font-body-lg)", fontWeight: 500, color: "var(--text-primary)" }}>No events yet</p>
            <p style={{ fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>Create your first event to start capturing attendee data.</p>
            <Link href="/capture/events/new" className="btn-primary" style={{ width: "auto", padding: "0 32px" }}>
              Create your first event
            </Link>
          </div>
        ) : (
          memberships.map(({ event }) => (
            <Link
              key={event.id}
              href={`/capture/events/${event.id}`}
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: 8, textDecoration: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--font-body-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
                  {event.title}
                </span>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="status-pill brand">
                  {event.status === "active" ? "Active" : event.status}
                </span>
                <span className="status-pill brand">
                  {event.primaryLanguage === "en" ? "English" : event.primaryLanguage === "de" ? "German" : event.primaryLanguage?.toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)" }}>
                {event.date}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Join a session FAB */}
      {memberships.length > 0 && (
        <div style={{ position: "absolute", bottom: 80, right: 24 }}>
          <Link href="/scan" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(30,58,95,0.3)" }}>
              <Plus size={24} color="var(--foreground-inverse)" />
            </div>
            <span style={{ fontSize: "var(--font-caption)", color: "var(--text-primary)", fontWeight: 500 }}>Join a session</span>
          </Link>
        </div>
      )}
    </div>
  );
}
