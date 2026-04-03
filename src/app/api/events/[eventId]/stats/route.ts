import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
  fldEvtFormAccessLogs,
  fldEvtFormSettings,
  fldEmlSendLogs,
  fldEmlSequences,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/events/:eventId/stats — Comprehensive event statistics
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const [membership] = await db
    .select()
    .from(fldEvtMembers)
    .where(
      and(
        eq(fldEvtMembers.eventId, eventId),
        eq(fldEvtMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Record stats (L1, L2)
  const [recordStats] = await db
    .select({
      total: sql<number>`count(*)`,
      scans: sql<number>`count(*) filter (where ${fldEvtRecords.captureMethod} = 'scan')`,
      digital: sql<number>`count(*) filter (where ${fldEvtRecords.captureMethod} = 'digital')`,
      merged: sql<number>`count(*) filter (where ${fldEvtRecords.captureMethod} = 'merged')`,
      captured: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'captured')`,
      processing: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'processing')`,
      reviewed: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'reviewed')`,
      defective: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'defective')`,
      resolved: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'resolved')`,
      optedOut: sql<number>`count(*) filter (where ${fldEvtRecords.emailOptOut} = true)`,
    })
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId));

  // Language breakdown (L4)
  const languageBreakdown = await db
    .select({
      language: fldEvtRecords.contentLanguage,
      count: sql<number>`count(*)`,
    })
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId))
    .groupBy(fldEvtRecords.contentLanguage);

  // Email stats (L3)
  const [emailStats] = await db
    .select({
      total: sql<number>`count(*)`,
      sent: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'sent')`,
      delivered: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'delivered')`,
      bounced: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'bounced')`,
      failed: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'failed')`,
      skipped: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'skipped')`,
    })
    .from(fldEmlSendLogs)
    .innerJoin(fldEmlSequences, eq(fldEmlSendLogs.sequenceId, fldEmlSequences.id))
    .where(eq(fldEmlSequences.eventId, eventId));

  // Form conversion metrics (L5)
  const [formSettings] = await db
    .select()
    .from(fldEvtFormSettings)
    .where(eq(fldEvtFormSettings.eventId, eventId))
    .limit(1);

  let formStats = { opens: 0, submissions: 0, conversionRate: 0 };
  if (formSettings) {
    const [fStats] = await db
      .select({
        opens: sql<number>`count(*)`,
        submissions: sql<number>`count(*) filter (where ${fldEvtFormAccessLogs.converted} = true)`,
      })
      .from(fldEvtFormAccessLogs)
      .where(eq(fldEvtFormAccessLogs.formSettingsId, formSettings.id));

    formStats = {
      opens: fStats.opens,
      submissions: fStats.submissions,
      conversionRate:
        fStats.opens > 0
          ? Math.round((fStats.submissions / fStats.opens) * 100)
          : 0,
    };
  }

  // Team stats
  const [teamStats] = await db
    .select({
      total: sql<number>`count(*)`,
      admins: sql<number>`count(*) filter (where ${fldEvtMembers.role} = 'admin')`,
      subAdmins: sql<number>`count(*) filter (where ${fldEvtMembers.role} = 'sub_admin')`,
      scanners: sql<number>`count(*) filter (where ${fldEvtMembers.role} = 'scanner')`,
    })
    .from(fldEvtMembers)
    .where(eq(fldEvtMembers.eventId, eventId));

  return NextResponse.json({
    records: recordStats,
    languages: languageBreakdown,
    emails: emailStats,
    form: formStats,
    team: teamStats,
  });
}
