import { db } from "@/db";
import {
  fldEmlSequences,
  fldEmlCountdowns,
  fldEmlPreflightLogs,
  fldEmlSendLogs,
  fldEvtRecords,
  fldEvtEvents,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendEmail } from "./email";

/**
 * Send pre-flight test email to admin 1 hour before dispatch (J15).
 */
export async function sendPreflightTest(
  sequenceId: string,
  adminUserId: string,
  adminEmail: string
): Promise<void> {
  const [sequence] = await db
    .select()
    .from(fldEmlSequences)
    .where(eq(fldEmlSequences.id, sequenceId))
    .limit(1);

  if (!sequence) return;

  const [event] = await db
    .select()
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.id, sequence.eventId))
    .limit(1);

  // Count eligible recipients
  const [recipientCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(fldEvtRecords)
    .where(
      and(
        eq(fldEvtRecords.eventId, sequence.eventId),
        sql`${fldEvtRecords.status} IN ('reviewed', 'resolved')`,
        eq(fldEvtRecords.emailOptOut, false)
      )
    );

  await sendEmail({
    to: adminEmail,
    subject: `[Fold] Pre-flight: Email sequence step ${sequence.sequenceOrder} ready`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>Pre-flight Check</h2>
        <p>Your email sequence step ${sequence.sequenceOrder} for <strong>${event?.title}</strong> is about to send.</p>
        <p><strong>Recipients:</strong> ${recipientCount.count}</p>
        <p><strong>Status:</strong> Countdown active</p>
        <p>Log in to Fold to review or cancel before dispatch.</p>
      </div>
    `,
  });

  await db.insert(fldEmlPreflightLogs).values({
    sequenceId,
    sentToUserId: adminUserId,
    userRole: "admin",
  });
}

/**
 * Send 30-minute reminder notification (J22).
 */
export async function sendCountdownReminder(
  sequenceId: string,
  adminEmail: string,
  minutesLeft: number
): Promise<void> {
  const [sequence] = await db
    .select()
    .from(fldEmlSequences)
    .where(eq(fldEmlSequences.id, sequenceId))
    .limit(1);

  if (!sequence) return;

  await sendEmail({
    to: adminEmail,
    subject: `[Fold] ${minutesLeft} minutes until email dispatch`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>${minutesLeft} Minutes Remaining</h2>
        <p>Your email sequence step ${sequence.sequenceOrder} will send in ${minutesLeft} minutes.</p>
        <p>This is your last chance to review or cancel.</p>
      </div>
    `,
  });
}

/**
 * Check countdown reset trigger (J3).
 * If template or recipients changed during countdown, reset it.
 */
export async function checkCountdownReset(
  countdownId: string,
  reason: string
): Promise<boolean> {
  const [countdown] = await db
    .select()
    .from(fldEmlCountdowns)
    .where(eq(fldEmlCountdowns.id, countdownId))
    .limit(1);

  if (!countdown || countdown.status !== "counting") return false;

  const now = new Date();
  const newScheduledSend = new Date(now.getTime() + 60 * 60 * 1000);

  await db
    .update(fldEmlCountdowns)
    .set({
      scheduledSendAt: newScheduledSend,
      resetCount: (countdown.resetCount ?? 0) + 1,
      resetReason: reason,
    })
    .where(eq(fldEmlCountdowns.id, countdownId));

  return true;
}

/**
 * Validate 4-hour post-scan minimum (J4).
 * Returns true if the event has scans less than 4 hours old.
 */
export async function checkPostScanMinimum(eventId: string): Promise<boolean> {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  const [recentScans] = await db
    .select({ count: sql<number>`count(*)` })
    .from(fldEvtRecords)
    .where(
      and(
        eq(fldEvtRecords.eventId, eventId),
        eq(fldEvtRecords.captureMethod, "scan"),
        sql`${fldEvtRecords.createdAt} > ${fourHoursAgo}`
      )
    );

  return recentScans.count > 0; // true = too recent, should wait
}

/**
 * Log a scanner flag on a sequence (J17-J19).
 */
export async function logScannerFlag(
  sequenceId: string,
  flagMessage: string,
  adminEmail: string
): Promise<void> {
  await db.insert(fldEmlPreflightLogs).values({
    sequenceId,
    sentToUserId: "scanner", // placeholder
    userRole: "scanner",
    actionTaken: "flagged",
    actionAt: new Date(),
    flagMessage,
  });

  // Notify admin (J19)
  await sendEmail({
    to: adminEmail,
    subject: "[Fold] Scanner flagged an issue with email sequence",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>Scanner Flag</h2>
        <p>A scanner has flagged a potential issue:</p>
        <blockquote style="border-left: 3px solid #e5e5e5; padding-left: 12px; color: #666;">
          ${flagMessage}
        </blockquote>
        <p><strong>Note:</strong> This flag does not automatically pause the sequence. Review and take action if needed.</p>
      </div>
    `,
  });
}
