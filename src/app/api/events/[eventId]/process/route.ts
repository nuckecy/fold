import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
  fldJobProcessing,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { extractFromImage } from "@/services/ai-extraction";
import { logActivity } from "@/services/activity-log";

// POST /api/events/:eventId/process — Start processing captured scans
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  // Verify admin
  const [membership] = await db
    .select()
    .from(fldEvtMembers)
    .where(
      and(
        eq(fldEvtMembers.eventId, eventId),
        eq(fldEvtMembers.userId, session.user.id),
        eq(fldEvtMembers.role, "admin")
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all captured (unprocessed) scan records
  const records = await db
    .select()
    .from(fldEvtRecords)
    .where(
      and(
        eq(fldEvtRecords.eventId, eventId),
        eq(fldEvtRecords.status, "captured"),
        eq(fldEvtRecords.captureMethod, "scan")
      )
    );

  if (records.length === 0) {
    return NextResponse.json(
      { error: "No unprocessed scans found" },
      { status: 400 }
    );
  }

  // Get field schemas for mapping
  const fieldSchemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  const fieldMap = new Map(fieldSchemas.map((f) => [f.fieldName, f.id]));

  // Create job tracking record
  const [job] = await db
    .insert(fldJobProcessing)
    .values({
      eventId,
      totalRecords: records.length,
      status: "processing",
      notificationEmail: session.user.email || undefined,
    })
    .returning();

  await logActivity({
    eventId,
    actionType: "processing_started",
    actorUserId: session.user.id,
    description: `Started processing ${records.length} scan${records.length > 1 ? "s" : ""}`,
    metadata: { jobId: job.id, recordCount: records.length },
  });

  // Process records (in this simplified version, synchronously)
  // In production, this would be BullMQ background jobs
  let processed = 0;
  let flagged = 0;
  let failed = 0;

  for (const record of records) {
    if (!record.imageUrl) {
      failed++;
      continue;
    }

    // Mark as processing
    await db
      .update(fldEvtRecords)
      .set({ status: "processing" })
      .where(eq(fldEvtRecords.id, record.id));

    try {
      const result = await extractFromImage(
        record.id,
        eventId,
        record.imageUrl
      );

      if (result.success) {
        // Save extracted field values
        const defectiveReasons: string[] = [];

        for (const [fieldName, data] of Object.entries(result.fields)) {
          const schemaId = fieldMap.get(fieldName);
          if (!schemaId) continue;

          await db.insert(fldEvtFieldValues).values({
            recordId: record.id,
            fieldSchemaId: schemaId,
            extractedValue: data.value,
            confidence: data.confidence,
          });

          // Check for defective reasons
          const schema = fieldSchemas.find((s) => s.fieldName === fieldName);
          if (schema?.isRequired && !data.value) {
            defectiveReasons.push(`${fieldName}_missing`);
          }
          if (data.confidence === "low") {
            defectiveReasons.push(`${fieldName}_low_confidence`);
          }
        }

        const status =
          defectiveReasons.length > 0 ? "defective" : "reviewed";

        await db
          .update(fldEvtRecords)
          .set({
            status,
            defectiveReasons,
            updatedAt: new Date(),
          })
          .where(eq(fldEvtRecords.id, record.id));

        if (defectiveReasons.length > 0) {
          flagged++;
        }
        processed++;
      } else {
        await db
          .update(fldEvtRecords)
          .set({
            status: "defective",
            defectiveReasons: ["extraction_failed"],
            updatedAt: new Date(),
          })
          .where(eq(fldEvtRecords.id, record.id));
        failed++;
      }
    } catch (err) {
      await db
        .update(fldEvtRecords)
        .set({
          status: "defective",
          defectiveReasons: ["extraction_error"],
          updatedAt: new Date(),
        })
        .where(eq(fldEvtRecords.id, record.id));
      failed++;
    }
  }

  // Update job status
  await db
    .update(fldJobProcessing)
    .set({
      processedCount: processed,
      flaggedCount: flagged,
      failedCount: failed,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(fldJobProcessing.id, job.id));

  await logActivity({
    eventId,
    actionType: "processing_completed",
    actorUserId: session.user.id,
    description: `Processing complete: ${processed} processed, ${flagged} flagged, ${failed} failed`,
    metadata: { jobId: job.id, processed, flagged, failed },
  });

  return NextResponse.json({
    jobId: job.id,
    total: records.length,
    processed,
    flagged,
    failed,
  });
}
