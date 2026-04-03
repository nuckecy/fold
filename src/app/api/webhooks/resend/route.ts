import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldEmlSendLogs, fldEvtRecords } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/webhooks/resend — Handle Resend delivery events (K8)
export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  // Resend sends events like: email.sent, email.delivered, email.bounced, email.complained
  if (!type || !data?.email_id) {
    return NextResponse.json({ received: true });
  }

  // Find send log by provider message ID
  const [sendLog] = await db
    .select()
    .from(fldEmlSendLogs)
    .where(eq(fldEmlSendLogs.providerMessageId, data.email_id))
    .limit(1);

  if (!sendLog) {
    return NextResponse.json({ received: true, matched: false });
  }

  switch (type) {
    case "email.delivered":
      await db
        .update(fldEmlSendLogs)
        .set({ status: "delivered", deliveredAt: new Date() })
        .where(eq(fldEmlSendLogs.id, sendLog.id));
      break;

    case "email.opened":
      await db
        .update(fldEmlSendLogs)
        .set({ openedAt: new Date() })
        .where(eq(fldEmlSendLogs.id, sendLog.id));
      break;

    case "email.bounced":
      await db
        .update(fldEmlSendLogs)
        .set({
          status: "bounced",
          bouncedAt: new Date(),
          errorMessage: data.bounce?.type || "bounce",
        })
        .where(eq(fldEmlSendLogs.id, sendLog.id));

      // Hard bounce: auto-suppress future sends
      if (data.bounce?.type === "hard") {
        await db
          .update(fldEvtRecords)
          .set({
            emailOptOut: true,
            optOutSource: "hard_bounce",
            optedOutAt: new Date(),
          })
          .where(eq(fldEvtRecords.id, sendLog.recordId));
      }
      break;

    case "email.complained":
      await db
        .update(fldEmlSendLogs)
        .set({ status: "bounced", errorMessage: "complaint" })
        .where(eq(fldEmlSendLogs.id, sendLog.id));

      // Complaint = auto-unsubscribe
      await db
        .update(fldEvtRecords)
        .set({
          emailOptOut: true,
          optOutSource: "complaint",
          optedOutAt: new Date(),
        })
        .where(eq(fldEvtRecords.id, sendLog.recordId));
      break;
  }

  return NextResponse.json({ received: true, matched: true, type });
}
