import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers, fldEvtRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Share2, AlertTriangle, Monitor, ChevronRight } from "lucide-react";

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

  const actions = [
    { icon: Camera, label: "Continue scanning", href: `/capture/events/${eventId}/scan` },
    { icon: Share2, label: "Share online form", href: `/capture/events/${eventId}/form` },
    { icon: AlertTriangle, label: "View flagged records", href: `/capture/events/${eventId}/records?status=defective`, badge: stats.defective > 0 ? stats.defective : undefined },
    { icon: Monitor, label: "Open in dashboard", href: `/dashboard/events/${eventId}` },
  ];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%" }}>
      {/* Page header */}
      <div className="page-header">
        <Link href="/capture" style={{ textDecoration: "none" }}>
          <span className="back"><ArrowLeft size={20} color="var(--text-primary)" /></span>
        </Link>
        <span className="title" style={{ flex: 1 }}>{event.title}</span>
        {stats.defective > 0 && <span className="badge">{stats.defective}</span>}
      </div>

      {/* Date */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <span style={{ fontSize: "var(--font-body)", color: "var(--text-secondary)" }}>
          {event.date}
        </span>
      </div>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 12, padding: "0 20px", marginBottom: 24 }}>
        <div className="metric-card" style={{ flex: 1 }}>
          <span className="value">{stats.total}</span>
          <span className="label">records</span>
        </div>
        <div className="metric-card" style={{ flex: 1 }}>
          <span className="value">{stats.scans}/{stats.digital}</span>
          <span className="label">scan/digital</span>
        </div>
        <div className="metric-card" style={{ flex: 1 }}>
          <span className="value" style={{ color: stats.defective > 0 ? "var(--error)" : undefined }}>{stats.defective}</span>
          <span className="label">flagged</span>
        </div>
      </div>

      {/* Action rows */}
      <div style={{ padding: "0 20px" }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className="action-row" style={{ textDecoration: "none" }}>
              <Icon size={20} className="icon" />
              <span className="text">{action.label}</span>
              {action.badge && <span className="badge" style={{ background: "var(--error)", color: "var(--foreground-inverse)", fontSize: "var(--font-caption)", fontWeight: 600, padding: "2px 8px", borderRadius: 9999 }}>{action.badge}</span>}
              <ChevronRight size={16} className="chevron" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
