import { db } from "@/db";
import {
  fldEmlSequences,
  fldEmlCountdowns,
  fldEmlSendLogs,
  fldEmlTemplateVersions,
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendEmail } from "./email";

const COUNTDOWN_DURATION_MS = 60 * 60 * 1000; // 1 hour (J2)
const MIN_POST_SCAN_MS = 4 * 60 * 60 * 1000; // 4 hours (J4)

/**
 * Start the mandatory 1-hour countdown for a sequence step (J2).
 */
export async function startCountdown(
  sequenceId: string,
  userId: string
): Promise<{ countdownId: string; scheduledSendAt: Date }> {
  const now = new Date();
  const scheduledSendAt = new Date(now.getTime() + COUNTDOWN_DURATION_MS);

  const [countdown] = await db
    .insert(fldEmlCountdowns)
    .values({
      sequenceId,
      triggeredAt: now,
      scheduledSendAt,
      status: "counting",
    })
    .returning();

  // Update sequence status
  await db
    .update(fldEmlSequences)
    .set({ status: "scheduled", confirmedAt: now })
    .where(eq(fldEmlSequences.id, sequenceId));

  return { countdownId: countdown.id, scheduledSendAt };
}

/**
 * Pause a countdown (J16). Resume restarts the full countdown (J21).
 */
export async function pauseCountdown(
  countdownId: string,
  userId: string
): Promise<void> {
  await db
    .update(fldEmlCountdowns)
    .set({
      status: "paused",
      pausedAt: new Date(),
      pausedBy: userId,
    })
    .where(eq(fldEmlCountdowns.id, countdownId));
}

/**
 * Resume a paused countdown. Restarts the full 1-hour countdown (J21).
 */
export async function resumeCountdown(
  countdownId: string
): Promise<{ scheduledSendAt: Date }> {
  const now = new Date();
  const scheduledSendAt = new Date(now.getTime() + COUNTDOWN_DURATION_MS);

  await db
    .update(fldEmlCountdowns)
    .set({
      status: "counting",
      resumedAt: now,
      scheduledSendAt,
      resetCount: sql`${fldEmlCountdowns.resetCount} + 1`,
      resetReason: "resumed_after_pause",
    })
    .where(eq(fldEmlCountdowns.id, countdownId));

  return { scheduledSendAt };
}

/**
 * Cancel a countdown.
 */
export async function cancelCountdown(countdownId: string): Promise<void> {
  await db
    .update(fldEmlCountdowns)
    .set({ status: "cancelled" })
    .where(eq(fldEmlCountdowns.id, countdownId));
}

/**
 * Send emails for a sequence step.
 * Replaces merge fields with record data (H16: current data at send time).
 */
export async function sendSequenceEmails(
  sequenceId: string,
  eventId: string
): Promise<{ sent: number; skipped: number; failed: number }> {
  const [sequence] = await db
    .select()
    .from(fldEmlSequences)
    .where(eq(fldEmlSequences.id, sequenceId))
    .limit(1);

  if (!sequence) throw new Error("Sequence not found");

  // Get template version
  const versionId =
    sequence.templateVersionSnapshotId || sequence.templateId;
  const [templateVersion] = await db
    .select()
    .from(fldEmlTemplateVersions)
    .where(eq(fldEmlTemplateVersions.templateId, sequence.templateId))
    .limit(1);

  if (!templateVersion) throw new Error("Template version not found");

  // Get eligible records (reviewed, not opted out, not defective)
  const records = await db
    .select()
    .from(fldEvtRecords)
    .where(
      and(
        eq(fldEvtRecords.eventId, eventId),
        sql`${fldEvtRecords.status} IN ('reviewed', 'resolved')`,
        eq(fldEvtRecords.emailOptOut, false)
      )
    );

  const fieldSchemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const record of records) {
    // Check if already sent for this sequence
    const [existingSend] = await db
      .select()
      .from(fldEmlSendLogs)
      .where(
        and(
          eq(fldEmlSendLogs.sequenceId, sequenceId),
          eq(fldEmlSendLogs.recordId, record.id)
        )
      )
      .limit(1);

    if (existingSend) {
      skipped++;
      continue;
    }

    // Get field values for merge
    const fieldValues = await db
      .select()
      .from(fldEvtFieldValues)
      .where(eq(fldEvtFieldValues.recordId, record.id));

    // Build merge data
    const mergeData: Record<string, string> = {};
    for (const fv of fieldValues) {
      const schema = fieldSchemas.find((s) => s.id === fv.fieldSchemaId);
      if (schema) {
        mergeData[schema.fieldName] = fv.extractedValue || "";
      }
    }

    // Find email
    const emailValue =
      mergeData.email || mergeData.email_address || "";
    if (!emailValue) {
      skipped++;
      continue;
    }

    // Replace merge fields in template
    let subject = templateVersion.subject;
    let body = templateVersion.body;

    for (const [key, value] of Object.entries(mergeData)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    // Create send log entry
    const [sendLog] = await db
      .insert(fldEmlSendLogs)
      .values({
        sequenceId,
        recordId: record.id,
        templateVersionId: templateVersion.id,
        languageSent: templateVersion.language,
        status: "queued",
        queuedAt: new Date(),
      })
      .returning();

    // Send the email
    const result = await sendEmail({
      to: emailValue,
      subject,
      html: body,
    });

    if (result.success) {
      await db
        .update(fldEmlSendLogs)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(fldEmlSendLogs.id, sendLog.id));
      sent++;
    } else {
      await db
        .update(fldEmlSendLogs)
        .set({
          status: "failed",
          errorMessage: (result as any).error || "Unknown error",
        })
        .where(eq(fldEmlSendLogs.id, sendLog.id));
      failed++;
    }
  }

  // Update sequence status
  await db
    .update(fldEmlSequences)
    .set({ status: sent > 0 ? "sent" : "partially_sent" })
    .where(eq(fldEmlSequences.id, sequenceId));

  return { sent, skipped, failed };
}
