import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldIamUsers,
  fldEvtEvents,
  fldEvtRecords,
  fldAiExtractionRequests,
  fldEmlSendLogs,
  fldEmlSequences,
  fldSysActivityLogs,
} from "@/db/schema";
import { sql } from "drizzle-orm";

// GET /api/admin — Super Admin dashboard stats
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Verify user is Super Admin (stored in app config, not hardcoded)
  // For now, any authenticated user can access

  // User stats
  const [userStats] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(fldIamUsers);

  // Event stats
  const [eventStats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${fldEvtEvents.status} = 'active')`,
      closed: sql<number>`count(*) filter (where ${fldEvtEvents.status} = 'closed')`,
      archived: sql<number>`count(*) filter (where ${fldEvtEvents.status} = 'archived')`,
    })
    .from(fldEvtEvents);

  // Record stats
  const [recordStats] = await db
    .select({
      total: sql<number>`count(*)`,
      scans: sql<number>`count(*) filter (where ${fldEvtRecords.captureMethod} = 'scan')`,
      digital: sql<number>`count(*) filter (where ${fldEvtRecords.captureMethod} = 'digital')`,
    })
    .from(fldEvtRecords);

  // AI billing stats (L13, G11)
  const [aiStats] = await db
    .select({
      totalRequests: sql<number>`count(*)`,
      geminiRequests: sql<number>`count(*) filter (where ${fldAiExtractionRequests.providerUsed} like 'gemini%')`,
      claudeRequests: sql<number>`count(*) filter (where ${fldAiExtractionRequests.providerUsed} like 'claude%')`,
      totalCost: sql<string>`coalesce(sum(${fldAiExtractionRequests.costEstimate}), 0)`,
      avgLatency: sql<number>`coalesce(avg(${fldAiExtractionRequests.latencyMs}), 0)`,
      successRate: sql<number>`count(*) filter (where ${fldAiExtractionRequests.status} = 'success') * 100.0 / nullif(count(*), 0)`,
    })
    .from(fldAiExtractionRequests);

  // Email delivery stats
  const [emailStats] = await db
    .select({
      total: sql<number>`count(*)`,
      sent: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'sent')`,
      delivered: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'delivered')`,
      bounced: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'bounced')`,
      failed: sql<number>`count(*) filter (where ${fldEmlSendLogs.status} = 'failed')`,
    })
    .from(fldEmlSendLogs);

  // Recent activity
  const recentActivity = await db
    .select()
    .from(fldSysActivityLogs)
    .orderBy(sql`${fldSysActivityLogs.createdAt} desc`)
    .limit(20);

  return NextResponse.json({
    users: userStats,
    events: eventStats,
    records: recordStats,
    ai: {
      ...aiStats,
      successRate: Math.round(Number(aiStats.successRate) || 0),
      avgLatency: Math.round(Number(aiStats.avgLatency) || 0),
    },
    emails: emailStats,
    recentActivity,
  });
}
