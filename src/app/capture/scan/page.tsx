import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

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
      <div style={{ padding: "var(--fold-space-4) var(--fold-space-5)" }}>
        <h1 style={{ fontSize: "var(--fold-type-title3)", fontWeight: 700, color: "var(--fold-text-primary)", letterSpacing: "-0.02em" }}>Scan</h1>
        <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", marginTop: "var(--fold-space-1)" }}>Select an event to start scanning cards.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-2)", padding: "0 var(--fold-space-5)" }}>
        {activeEvents.length === 0 ? (
          <EmptyState icon={Camera} title="No active events" description="Create an event to start scanning." action={{ label: "Create event", href: "/capture/events/new" }} />
        ) : (
          activeEvents.map(({ event }) => (
            <Link key={event.id} href={`/capture/events/${event.id}/scan`} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-3)", textDecoration: "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--fold-radius-sm)", background: "var(--fold-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Camera size={20} color="var(--fold-accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--fold-type-headline)", fontWeight: 600, color: "var(--fold-text-primary)" }}>{event.title}</div>
                <div style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)" }}>{event.date}</div>
              </div>
              <ChevronRight size={14} color="var(--fold-text-tertiary)" />
            </Link>
          ))
        )}
      </div>

      <div style={{ padding: "var(--fold-space-6) var(--fold-space-5)", textAlign: "center" }}>
        <Link href="/scan" style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-accent)", textDecoration: "underline", fontWeight: 500 }}>
          Join someone else's session
        </Link>
      </div>
    </div>
  );
}
