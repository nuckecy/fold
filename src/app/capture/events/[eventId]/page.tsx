import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers, fldEvtRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Camera, Share2, AlertTriangle, Monitor } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListGroup, ListRow } from "@/components/ui/list-group";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default async function CaptureEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { eventId } = await params;

  const [membership] = await db
    .select({ event: fldEvtEvents, role: fldEvtMembers.role })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(and(eq(fldEvtMembers.eventId, eventId), eq(fldEvtMembers.userId, session.user.id)))
    .limit(1);

  if (!membership) notFound();
  const { event } = membership;

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      scans: sql<number>`count(*) filter (where ${fldEvtRecords.captureMethod} = 'scan')`,
      digital: sql<number>`count(*) filter (where ${fldEvtRecords.captureMethod} = 'digital')`,
      defective: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'defective')`,
    })
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId));

  return (
    <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
      <PageHeader title={event.title} back="/capture" badge={stats.defective > 0 ? stats.defective : undefined} />

      {/* Date + status */}
      <div style={{ padding: "0 var(--fold-space-5)", marginBottom: "var(--fold-space-4)", display: "flex", alignItems: "center", gap: "var(--fold-space-2)" }}>
        <span style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
          {formatDate(event.date)}
        </span>
        <Badge variant={event.status === "active" ? "success" : "muted"}>
          {event.status}
        </Badge>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: "var(--fold-space-3)", padding: "0 var(--fold-space-5)", marginBottom: "var(--fold-space-6)" }}>
        <MetricCard value={stats.total} label="records" />
        <MetricCard value={`${stats.scans}/${stats.digital}`} label="scan/digital" />
        <MetricCard value={stats.defective} label="flagged" valueColor={stats.defective > 0 ? "var(--fold-error)" : undefined} />
      </div>

      {/* Actions */}
      <div style={{ padding: "0 var(--fold-space-5)" }}>
        <ListGroup>
          <ListRow icon={<Camera size={20} />} label="Continue scanning" href={`/capture/events/${eventId}/scan`} />
          <ListRow icon={<Share2 size={20} />} label="Share online form" href={`/capture/events/${eventId}/form`} />
          <ListRow icon={<AlertTriangle size={20} />} label="View flagged records" href={`/capture/events/${eventId}/records?status=defective`} />
          <ListRow icon={<Monitor size={20} />} label="Open in dashboard" href={`/dashboard/events/${eventId}`} />
        </ListGroup>
      </div>
    </div>
  );
}
