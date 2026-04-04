import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Plus, Inbox } from "lucide-react";

export default async function CaptureHomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const firstName = session.user.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const memberships = await db
    .select({ event: fldEvtEvents, role: fldEvtMembers.role })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(eq(fldEvtMembers.userId, session.user.id));

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Greeting */}
      <div style={{ padding: "12px 20px 4px" }}>
        <p style={{ fontSize: "var(--font-callout)", color: "var(--text-secondary)" }}>
          {greeting}, {firstName}
        </p>
      </div>

      {/* Event cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 20px" }}>
        {memberships.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "var(--radius-full)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-card)" }}>
              <Inbox size={24} color="var(--text-tertiary)" />
            </div>
            <div>
              <p style={{ fontSize: "var(--font-headline)", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>No events yet</p>
              <p style={{ fontSize: "var(--font-subhead)", color: "var(--text-secondary)", marginTop: 4 }}>Create your first event to start capturing attendee data.</p>
            </div>
            <Link href="/capture/events/new" className="btn-primary" style={{ width: "auto", padding: "0 28px", marginTop: 4 }}>
              Create event
            </Link>
          </div>
        ) : (
          memberships.map(({ event }) => (
            <Link
              key={event.id}
              href={`/capture/events/${event.id}`}
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: 10, textDecoration: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--font-headline)", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {event.title}
                </span>
                <ChevronRight size={18} color="var(--text-tertiary)" strokeWidth={2} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className={`status-pill ${event.status === "active" ? "brand" : "muted"}`}>
                  {event.status === "active" ? "Active" : event.status}
                </span>
                <span className="status-pill brand">
                  {event.primaryLanguage === "en" ? "English" : event.primaryLanguage === "de" ? "German" : event.primaryLanguage?.toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: "var(--font-footnote)", color: "var(--text-secondary)" }}>
                {event.date}
              </span>
            </Link>
          ))
        )}
      </div>

      {memberships.length > 0 && (
        <div style={{ position: "absolute", bottom: 72, right: 20 }}>
          <Link href="/scan" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>
            <div style={{ width: 52, height: 52, borderRadius: "var(--radius-full)", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-float)" }}>
              <Plus size={22} color="var(--foreground-inverse)" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "var(--font-caption2)", color: "var(--text-secondary)", fontWeight: 500 }}>Join a session</span>
          </Link>
        </div>
      )}
    </div>
  );
}
