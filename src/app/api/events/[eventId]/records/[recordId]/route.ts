import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
  fldEvtRecordEditLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";

// GET /api/events/:eventId/records/:recordId — Get single record with all data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; recordId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, recordId } = await params;

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

  const [record] = await db
    .select()
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.id, recordId))
    .limit(1);

  if (!record || record.eventId !== eventId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fieldValues = await db
    .select()
    .from(fldEvtFieldValues)
    .where(eq(fldEvtFieldValues.recordId, recordId));

  const fieldSchemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  const editHistory = await db
    .select()
    .from(fldEvtRecordEditLogs)
    .where(eq(fldEvtRecordEditLogs.recordId, recordId));

  const fields = fieldValues.map((fv) => {
    const schema = fieldSchemas.find((s) => s.id === fv.fieldSchemaId);
    return {
      id: fv.id,
      fieldSchemaId: fv.fieldSchemaId,
      fieldName: schema?.fieldName,
      label: (schema?.fieldLabels as Record<string, string>)?.en || schema?.fieldName,
      fieldType: schema?.fieldType,
      value: fv.extractedValue,
      confidence: fv.confidence,
      manuallyEdited: fv.manuallyEdited,
    };
  });

  return NextResponse.json({ record, fields, editHistory });
}

// PATCH /api/events/:eventId/records/:recordId — Edit record fields (H15)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string; recordId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, recordId } = await params;

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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { fields, status } = body;

  // Update field values with change logging (H15)
  if (fields && typeof fields === "object") {
    for (const [fieldValueId, newValue] of Object.entries(fields)) {
      const [existing] = await db
        .select()
        .from(fldEvtFieldValues)
        .where(eq(fldEvtFieldValues.id, fieldValueId))
        .limit(1);

      if (!existing) continue;

      const schema = await db
        .select()
        .from(fldEvtFieldSchemas)
        .where(eq(fldEvtFieldSchemas.id, existing.fieldSchemaId))
        .limit(1);

      // Log the edit
      await db.insert(fldEvtRecordEditLogs).values({
        recordId,
        fieldName: schema[0]?.fieldName || "unknown",
        oldValue: existing.extractedValue,
        newValue: newValue as string,
        editedBy: session.user.id,
      });

      // Update the value
      await db
        .update(fldEvtFieldValues)
        .set({
          extractedValue: newValue as string,
          manuallyEdited: true,
          updatedAt: new Date(),
        })
        .where(eq(fldEvtFieldValues.id, fieldValueId));
    }
  }

  // Update record status (e.g., resolve defective record — H6)
  if (status) {
    await db
      .update(fldEvtRecords)
      .set({ status, updatedAt: new Date() })
      .where(eq(fldEvtRecords.id, recordId));
  }

  await logActivity({
    eventId,
    actionType: "record_edited",
    actorUserId: session.user.id,
    description: `Edited record ${recordId.slice(0, 8)}...`,
    metadata: { recordId, fieldsEdited: fields ? Object.keys(fields).length : 0, statusChanged: !!status },
  });

  return NextResponse.json({ message: "Record updated" });
}
