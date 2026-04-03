import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
  fldEvtEvents,
  fldEmlSendLogs,
  fldEmlUnsubscribeLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";

// GET /api/gdpr?email=xxx — Search for person data across all events (L14)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const name = searchParams.get("name");

  if (!email && !name) {
    return NextResponse.json(
      { error: "Email or name is required" },
      { status: 400 }
    );
  }

  // Search across all records for matching field values
  // This is an application-level search since PII is encrypted in production
  const allRecords = await db.select().from(fldEvtRecords);
  const results: Array<{
    recordId: string;
    eventId: string;
    eventTitle: string;
    captureMethod: string;
    status: string;
    fields: Record<string, string>;
    createdAt: Date | null;
  }> = [];

  for (const record of allRecords) {
    const fieldValues = await db
      .select()
      .from(fldEvtFieldValues)
      .where(eq(fldEvtFieldValues.recordId, record.id));

    const schemas = await db
      .select()
      .from(fldEvtFieldSchemas)
      .where(eq(fldEvtFieldSchemas.eventId, record.eventId));

    const fields: Record<string, string> = {};
    let matchFound = false;

    for (const fv of fieldValues) {
      const schema = schemas.find((s) => s.id === fv.fieldSchemaId);
      if (!schema) continue;

      fields[schema.fieldName] = fv.extractedValue || "";

      if (
        email &&
        schema.fieldType === "email" &&
        fv.extractedValue?.toLowerCase() === email.toLowerCase()
      ) {
        matchFound = true;
      }
      if (
        name &&
        (schema.fieldName.includes("name") || schema.fieldName === "full_name") &&
        fv.extractedValue?.toLowerCase().includes(name.toLowerCase())
      ) {
        matchFound = true;
      }
    }

    if (matchFound) {
      const [event] = await db
        .select({ title: fldEvtEvents.title })
        .from(fldEvtEvents)
        .where(eq(fldEvtEvents.id, record.eventId))
        .limit(1);

      results.push({
        recordId: record.id,
        eventId: record.eventId,
        eventTitle: event?.title || "Unknown",
        captureMethod: record.captureMethod,
        status: record.status ?? "unknown",
        fields,
        createdAt: record.createdAt,
      });
    }
  }

  return NextResponse.json({ results, count: results.length });
}

// POST /api/gdpr — GDPR actions: export or erase (L15, L16)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Find all records for this email
  const allRecords = await db.select().from(fldEvtRecords);
  const matchingRecordIds: string[] = [];

  for (const record of allRecords) {
    const fieldValues = await db
      .select()
      .from(fldEvtFieldValues)
      .where(eq(fldEvtFieldValues.recordId, record.id));

    const schemas = await db
      .select()
      .from(fldEvtFieldSchemas)
      .where(eq(fldEvtFieldSchemas.eventId, record.eventId));

    for (const fv of fieldValues) {
      const schema = schemas.find((s) => s.id === fv.fieldSchemaId);
      if (
        schema?.fieldType === "email" &&
        fv.extractedValue?.toLowerCase() === email.toLowerCase()
      ) {
        matchingRecordIds.push(record.id);
        break;
      }
    }
  }

  if (action === "export") {
    // L15: Export all data for this person
    const exportData = await Promise.all(
      matchingRecordIds.map(async (recordId) => {
        const [record] = await db
          .select()
          .from(fldEvtRecords)
          .where(eq(fldEvtRecords.id, recordId))
          .limit(1);

        const fieldValues = await db
          .select()
          .from(fldEvtFieldValues)
          .where(eq(fldEvtFieldValues.recordId, recordId));

        const schemas = await db
          .select()
          .from(fldEvtFieldSchemas)
          .where(eq(fldEvtFieldSchemas.eventId, record.eventId));

        const [event] = await db
          .select({ title: fldEvtEvents.title })
          .from(fldEvtEvents)
          .where(eq(fldEvtEvents.id, record.eventId))
          .limit(1);

        const emailLogs = await db
          .select()
          .from(fldEmlSendLogs)
          .where(eq(fldEmlSendLogs.recordId, recordId));

        const unsubLogs = await db
          .select()
          .from(fldEmlUnsubscribeLogs)
          .where(eq(fldEmlUnsubscribeLogs.recordId, recordId));

        return {
          event: event?.title,
          record: {
            id: record.id,
            captureMethod: record.captureMethod,
            status: record.status,
            createdAt: record.createdAt,
          },
          fields: fieldValues.map((fv) => {
            const schema = schemas.find((s) => s.id === fv.fieldSchemaId);
            return {
              field: schema?.fieldName,
              value: fv.extractedValue,
            };
          }),
          emails: emailLogs.map((e) => ({
            status: e.status,
            sentAt: e.sentAt,
          })),
          unsubscribes: unsubLogs,
        };
      })
    );

    await logActivity({
      actionType: "gdpr_data_export",
      actorUserId: session.user.id,
      description: `GDPR data export for ${email} (${matchingRecordIds.length} records)`,
      metadata: { email, recordCount: matchingRecordIds.length },
    });

    return NextResponse.json({ email, data: exportData });
  }

  if (action === "erase") {
    // L16: Erase all PII for this person
    for (const recordId of matchingRecordIds) {
      // Anonymize field values
      await db
        .update(fldEvtFieldValues)
        .set({
          extractedValue: "[ERASED]",
          translatedValue: null,
          updatedAt: new Date(),
        })
        .where(eq(fldEvtFieldValues.recordId, recordId));

      // Mark record as erased
      await db
        .update(fldEvtRecords)
        .set({
          status: "resolved",
          emailOptOut: true,
          optOutSource: "gdpr_erasure",
          optedOutAt: new Date(),
          imageUrl: null,
          deviceFingerprint: null,
          ipHash: null,
          updatedAt: new Date(),
        })
        .where(eq(fldEvtRecords.id, recordId));
    }

    await logActivity({
      actionType: "gdpr_data_erasure",
      actorUserId: session.user.id,
      description: `GDPR data erasure for ${email} (${matchingRecordIds.length} records erased)`,
      metadata: { email, recordCount: matchingRecordIds.length },
    });

    return NextResponse.json({
      message: `Erased data for ${email} across ${matchingRecordIds.length} records`,
      recordsErased: matchingRecordIds.length,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
