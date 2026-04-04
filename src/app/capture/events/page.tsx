import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

export default async function CaptureEventsListPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await db
    .select({ event: fldEvtEvents, role: fldEvtMembers.role })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(eq(fldEvtMembers.userId, session.user.id));

  return (
    <div style={{ minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
        <h1 style={{ fontSize: "var(--font-title)", fontWeight: 700, color: "var(--text-primary)" }}>All Events</h1>
        <Link href="/capture/events/new" style={{ width: 32, height: 32, borderRadius: 9999, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          <Plus size={16} color="var(--foreground-inverse)" />
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
        {memberships.map(({ event }) => (
          <Link key={event.id} href={`/capture/events/${event.id}`} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}>
            <div>
              <div style={{ fontSize: "var(--font-body)", fontWeight: 600, color: "var(--text-primary)" }}>{event.title}</div>
              <div style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)", marginTop: 2 }}>{event.date} &middot; {event.status}</div>
            </div>
            <ChevronRight size={16} color="var(--text-secondary)" />
          </Link>
        ))}
      </div>
    </div>
  );
}
