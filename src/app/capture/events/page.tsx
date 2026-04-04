import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--fold-space-4) var(--fold-space-5)" }}>
        <h1 style={{ fontSize: "var(--fold-type-title3)", fontWeight: 700, color: "var(--fold-text-primary)", letterSpacing: "-0.02em" }}>All events</h1>
        <Link href="/capture/events/new" style={{ width: 34, height: 34, borderRadius: "var(--fold-radius-full)", background: "var(--fold-accent)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          <Plus size={16} color="var(--fold-text-inverse)" />
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-2)", padding: "0 var(--fold-space-5)" }}>
        {memberships.map(({ event }) => (
          <Card key={event.id} href={`/capture/events/${event.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "var(--fold-type-body)", fontWeight: 600, color: "var(--fold-text-primary)" }}>{event.title}</div>
              <div style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)", marginTop: 2, display: "flex", alignItems: "center", gap: "var(--fold-space-2)" }}>
                {formatDate(event.date)}
                <Badge variant={event.status === "active" ? "success" : "muted"} className="">{event.status}</Badge>
              </div>
            </div>
            <ChevronRight size={14} color="var(--fold-text-tertiary)" />
          </Card>
        ))}
      </div>
    </div>
  );
}
