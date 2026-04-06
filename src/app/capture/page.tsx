import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
    <div style={{ paddingBottom: "var(--fold-space-4)" }}>
      {/* Greeting */}
      <div style={{ padding: "var(--fold-space-3) var(--fold-space-5) var(--fold-space-1)" }}>
        <p style={{ fontSize: "var(--fold-type-callout)", color: "var(--fold-text-secondary)" }}>
          {greeting}, {firstName}
        </p>
      </div>

      {/* Event cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-3)", padding: "var(--fold-space-3) var(--fold-space-5)" }}>
        {memberships.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No events yet"
            description="Create your first event to start capturing attendee data."
            action={{ label: "Create event", href: "/capture/events/new" }}
          />
        ) : (
          memberships.map(({ event }) => (
            <Card key={event.id} href={`/capture/events/${event.id}`} style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-2)" }}>
              {/* Title + status + chevron */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-2)" }}>
                <span style={{ fontSize: "var(--fold-type-headline)", fontWeight: 600, color: "var(--fold-text-primary)", letterSpacing: "-0.02em", flex: 1 }}>
                  {event.title}
                </span>
                {event.status === "active" && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--fold-accent)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
                    Active
                  </span>
                )}
                <ChevronRight size={16} color="var(--fold-text-tertiary)" strokeWidth={2} style={{ flexShrink: 0 }} />
              </div>

              {/* Date + language */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-2)" }}>
                <span style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)" }}>
                  {formatDate(event.date)}
                </span>
                <span style={{ fontSize: "var(--fold-type-caption)", color: "var(--fold-text-tertiary)", fontWeight: 500 }}>
                  {event.primaryLanguage?.toUpperCase()}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
