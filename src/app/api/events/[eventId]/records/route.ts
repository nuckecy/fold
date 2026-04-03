import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/events/:eventId/records — List records with field values
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  // Verify membership
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

  // Fetch records
  let query = db
    .select()
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId))
    .$dynamic();

  if (status) {
    query = query.where(
      and(
        eq(fldEvtRecords.eventId, eventId),
        eq(fldEvtRecords.status, status)
      )
    );
  }

  const records = await query.limit(100);

  // Fetch field values and schemas for all records
  const recordIds = records.map((r) => r.id);

  const fieldSchemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  const allFieldValues =
    recordIds.length > 0
      ? await db
          .select()
          .from(fldEvtFieldValues)
          .where(eq(fldEvtFieldValues.recordId, records[0]?.id ?? ""))
      : [];

  // For simplicity, fetch field values per record
  const enriched = await Promise.all(
    records.map(async (record) => {
      const fieldValues = await db
        .select()
        .from(fldEvtFieldValues)
        .where(eq(fldEvtFieldValues.recordId, record.id));

      const fields = fieldValues.map((fv) => {
        const schema = fieldSchemas.find((s) => s.id === fv.fieldSchemaId);
        return {
          fieldName: schema?.fieldName,
          label: (schema?.fieldLabels as Record<string, string>)?.en || schema?.fieldName,
          value: fv.extractedValue,
          confidence: fv.confidence,
          manuallyEdited: fv.manuallyEdited,
        };
      });

      return { ...record, fields };
    })
  );

  return NextResponse.json(enriched);
}
