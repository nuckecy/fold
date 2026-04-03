import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldEvtRecords, fldEmlUnsubscribeLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyUnsubscribeToken,
  generateResubscribeToken,
} from "@/lib/unsubscribe-tokens";
import { logActivity } from "@/services/activity-log";

// POST /api/unsubscribe — Process unsubscribe request
export async function POST(request: Request) {
  const { recordId, eventId, token, scope } = await request.json();

  if (!recordId || !eventId || !token) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!verifyUnsubscribeToken(token, recordId, eventId)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const isGlobal = scope === "global";
  const resubToken = generateResubscribeToken(recordId);
  const resubExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days (K4)

  // Mark record as opted out
  await db
    .update(fldEvtRecords)
    .set({
      emailOptOut: true,
      optedOutAt: new Date(),
      optOutSource: "unsubscribe_link",
    })
    .where(eq(fldEvtRecords.id, recordId));

  // Log the unsubscribe
  await db.insert(fldEmlUnsubscribeLogs).values({
    recordId,
    eventId,
    isGlobal,
    resubscribeToken: resubToken,
    resubscribeExpiresAt: resubExpiry,
  });

  await logActivity({
    eventId,
    actionType: "record_unsubscribed",
    description: `Record unsubscribed (${isGlobal ? "global" : "event only"})`,
    metadata: { recordId, scope: isGlobal ? "global" : "event" },
  });

  return NextResponse.json({
    success: true,
    resubscribeToken: resubToken,
    resubscribeExpiresAt: resubExpiry,
  });
}
