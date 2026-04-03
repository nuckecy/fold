import { db } from "@/db";
import {
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
  fldEvtHouseholdGroups,
  fldEvtHouseholdMembers,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logActivity } from "./activity-log";

interface MergeResult {
  merged: number;
  households: number;
}

/**
 * Detect and merge duplicate records within an event.
 * - Exact email match + same name = auto-merge (H7)
 * - Same email, different names = household group (H9)
 * - Digital preferred over scan (H11)
 */
export async function detectAndMergeDuplicates(
  eventId: string,
  actorUserId?: string
): Promise<MergeResult> {
  // Get all reviewed/resolved records with their email field values
  const records = await db
    .select()
    .from(fldEvtRecords)
    .where(
      and(
        eq(fldEvtRecords.eventId, eventId),
        sql`${fldEvtRecords.status} IN ('reviewed', 'resolved')`
      )
    );

  // Get field schemas to find email and name fields
  const schemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  const emailSchema = schemas.find(
    (s) => s.fieldType === "email" || s.fieldName === "email"
  );
  const nameSchema = schemas.find(
    (s) =>
      s.fieldName === "full_name" ||
      s.fieldName === "first_name" ||
      s.fieldName === "name"
  );

  if (!emailSchema) return { merged: 0, households: 0 };

  // Build a map of email -> records
  const emailMap = new Map<
    string,
    { record: typeof records[0]; email: string; name: string }[]
  >();

  for (const record of records) {
    const fieldValues = await db
      .select()
      .from(fldEvtFieldValues)
      .where(eq(fldEvtFieldValues.recordId, record.id));

    const emailValue = fieldValues
      .find((fv) => fv.fieldSchemaId === emailSchema.id)
      ?.extractedValue?.toLowerCase()
      .trim();

    if (!emailValue) continue;

    const nameValue =
      nameSchema
        ? fieldValues
            .find((fv) => fv.fieldSchemaId === nameSchema.id)
            ?.extractedValue?.toLowerCase()
            .trim() || ""
        : "";

    const existing = emailMap.get(emailValue) || [];
    existing.push({ record, email: emailValue, name: nameValue });
    emailMap.set(emailValue, existing);
  }

  let merged = 0;
  let households = 0;

  for (const [email, group] of emailMap) {
    if (group.length < 2) continue;

    // Group by name similarity
    const sameNameGroups = new Map<string, typeof group>();
    for (const entry of group) {
      const key = entry.name || "__no_name__";
      const existing = sameNameGroups.get(key) || [];
      existing.push(entry);
      sameNameGroups.set(key, existing);
    }

    // Merge exact duplicates (same email + same name)
    for (const [name, dupes] of sameNameGroups) {
      if (dupes.length < 2) continue;

      // Prefer digital over scan (H11)
      const sorted = dupes.sort((a, b) => {
        if (a.record.captureMethod === "digital" && b.record.captureMethod !== "digital")
          return -1;
        if (b.record.captureMethod === "digital" && a.record.captureMethod !== "digital")
          return 1;
        return 0;
      });

      const winner = sorted[0];
      const losers = sorted.slice(1);

      for (const loser of losers) {
        // Merge field values — keep winner's values, fill gaps from loser
        const winnerValues = await db
          .select()
          .from(fldEvtFieldValues)
          .where(eq(fldEvtFieldValues.recordId, winner.record.id));

        const loserValues = await db
          .select()
          .from(fldEvtFieldValues)
          .where(eq(fldEvtFieldValues.recordId, loser.record.id));

        const winnerFieldIds = new Set(winnerValues.map((v) => v.fieldSchemaId));

        for (const lv of loserValues) {
          if (!winnerFieldIds.has(lv.fieldSchemaId) && lv.extractedValue) {
            await db.insert(fldEvtFieldValues).values({
              recordId: winner.record.id,
              fieldSchemaId: lv.fieldSchemaId,
              extractedValue: lv.extractedValue,
              confidence: lv.confidence,
            });
          }
        }

        // Update winner with merge log
        await db
          .update(fldEvtRecords)
          .set({
            captureMethod: "merged",
            sourceDetail: `${winner.record.captureMethod}+${loser.record.captureMethod}`,
            mergeLog: {
              winnerId: winner.record.id,
              loserId: loser.record.id,
              winnerMethod: winner.record.captureMethod,
              loserMethod: loser.record.captureMethod,
            },
            updatedAt: new Date(),
          })
          .where(eq(fldEvtRecords.id, winner.record.id));

        // Delete the loser record
        await db
          .delete(fldEvtFieldValues)
          .where(eq(fldEvtFieldValues.recordId, loser.record.id));
        await db
          .delete(fldEvtRecords)
          .where(eq(fldEvtRecords.id, loser.record.id));

        merged++;
      }
    }

    // Create household groups for different names sharing the same email (H9)
    const uniqueNames = [...sameNameGroups.keys()].filter(
      (n) => n !== "__no_name__"
    );
    if (uniqueNames.length >= 2) {
      const remainingRecords = group.filter((g) =>
        records.some((r) => r.id === g.record.id)
      );

      if (remainingRecords.length >= 2) {
        const [householdGroup] = await db
          .insert(fldEvtHouseholdGroups)
          .values({
            eventId,
            sharedEmail: email,
            primaryRecordId: remainingRecords[0].record.id,
          })
          .returning();

        for (const entry of remainingRecords) {
          await db.insert(fldEvtHouseholdMembers).values({
            groupId: householdGroup.id,
            recordId: entry.record.id,
          });
        }

        households++;
      }
    }
  }

  if (merged > 0 || households > 0) {
    await logActivity({
      eventId,
      actionType: "records_merged",
      actorUserId,
      description: `Merged ${merged} duplicate${merged !== 1 ? "s" : ""}, created ${households} household group${households !== 1 ? "s" : ""}`,
      metadata: { merged, households },
    });
  }

  return { merged, households };
}
