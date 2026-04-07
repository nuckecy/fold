import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEvtRecords, fldEvtFieldSchemas, fldEvtFieldValues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { extractFromImage } from "@/services/ai-extraction";
import { deleteFile } from "@/lib/storage";
import { validateExtractionResults } from "@/services/image-validation";

// POST /api/events/:eventId/scans/extract — Run AI extraction on a captured record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const { recordId } = await request.json();

  if (!recordId) {
    return NextResponse.json({ error: "recordId is required" }, { status: 400 });
  }

  // Verify membership
  const [membership] = await db
    .select()
    .from(fldEvtMembers)
    .where(and(eq(fldEvtMembers.eventId, eventId), eq(fldEvtMembers.userId, session.user.id)))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get the record
  const [record] = await db
    .select()
    .from(fldEvtRecords)
    .where(and(eq(fldEvtRecords.id, recordId), eq(fldEvtRecords.eventId, eventId)))
    .limit(1);

  if (!record || !record.imageUrl) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  // Get field schemas
  const fieldSchemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  if (fieldSchemas.length === 0) {
    return NextResponse.json({ error: "No field schemas configured. Set up fields first." }, { status: 400 });
  }

  // Mark as processing
  await db.update(fldEvtRecords).set({ status: "processing" }).where(eq(fldEvtRecords.id, recordId));

  try {
    const result = await extractFromImage(recordId, eventId, record.imageUrl);

    if (!result.success) {
      await db.update(fldEvtRecords).set({
        status: "defective",
        defectiveReasons: ["extraction_failed"],
        updatedAt: new Date(),
      }).where(eq(fldEvtRecords.id, recordId));

      return NextResponse.json({ extraction: "failed", error: result.error });
    }

    // Validate extraction results
    const extractionCheck = validateExtractionResults(result.fields);
    if (!extractionCheck.valid) {
      // No useful data — clean up
      const urlParts = record.imageUrl.split("/");
      const key = urlParts.slice(3).join("/"); // Remove domain to get key
      await deleteFile(key).catch(() => {});
      await db.delete(fldEvtRecords).where(eq(fldEvtRecords.id, recordId));

      return NextResponse.json({
        extraction: "rejected",
        error: extractionCheck.reason,
        rejected: true,
      });
    }

    // Save extracted fields
    const defectiveReasons: string[] = [];
    const fieldMap = new Map(fieldSchemas.map((f) => [f.fieldName, f]));

    for (const [fieldName, data] of Object.entries(result.fields)) {
      const schema = fieldMap.get(fieldName);
      if (!schema) continue;

      await db.insert(fldEvtFieldValues).values({
        recordId,
        fieldSchemaId: schema.id,
        extractedValue: data.value || null,
        confidence: data.confidence,
      });

      if (schema.isRequired && !data.value) {
        defectiveReasons.push(`missing_${fieldName}`);
      }
    }

    if (!result.fields["email"]?.value) {
      if (!defectiveReasons.includes("missing_email")) {
        defectiveReasons.push("missing_email");
      }
    }

    const finalStatus = defectiveReasons.length > 0 ? "defective" : "processed";

    await db.update(fldEvtRecords).set({
      status: finalStatus,
      defectiveReasons,
      updatedAt: new Date(),
    }).where(eq(fldEvtRecords.id, recordId));

    return NextResponse.json({
      extraction: "success",
      status: finalStatus,
      fields: result.fields,
      provider: result.provider,
      latencyMs: result.latencyMs,
    });
  } catch (err: any) {
    console.error("[extract] Error:", err?.message);
    await db.update(fldEvtRecords).set({
      status: "captured",
      updatedAt: new Date(),
    }).where(eq(fldEvtRecords.id, recordId));

    return NextResponse.json({ extraction: "error", error: err?.message }, { status: 500 });
  }
}
