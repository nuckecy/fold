import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEvtRecords, fldEvtFieldSchemas, fldEvtFieldValues } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";
import { uploadFile, deleteFile, scanKey } from "@/lib/storage";
import { extractFromImage } from "@/services/ai-extraction";
import { validateFileBasics, preScreenImage, validateExtractionResults } from "@/services/image-validation";

// GET /api/events/:eventId/scans — Get scan count
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

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

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      processing: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'processing')`,
      captured: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'captured')`,
    })
    .from(fldEvtRecords)
    .where(
      and(
        eq(fldEvtRecords.eventId, eventId),
        eq(fldEvtRecords.captureMethod, "scan")
      )
    );

  return NextResponse.json(stats);
}

// POST /api/events/:eventId/scans — Upload a scan image
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  const sourceDetail = (formData.get("sourceDetail") as string) || "camera";

  if (!file) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid image type. Accepted: JPEG, PNG, WebP, HEIC" },
      { status: 400 }
    );
  }

  // ─── LAYER 1: File basics ──────────────────────────────────────────
  const basicCheck = validateFileBasics(file);
  if (!basicCheck.valid) {
    return NextResponse.json(
      { error: basicCheck.reason, rejected: true },
      { status: 400 }
    );
  }

  // Read file bytes once (reused for screening, upload, and extraction)
  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");

  // ─── LAYER 2: AI pre-screening ────────────────────────────────────
  const screenCheck = await preScreenImage(base64, file.type);
  if (!screenCheck.valid) {
    return NextResponse.json(
      { error: screenCheck.reason, rejected: true },
      { status: 422 }
    );
  }

  // ─── UPLOAD TO R2 ─────────────────────────────────────────────────
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const key = scanKey(eventId, filename);

  try {
    const imageUrl = await uploadFile(key, bytes, file.type);

    // Create record
    const [record] = await db
      .insert(fldEvtRecords)
      .values({
        eventId,
        captureMethod: "scan",
        sourceDetail,
        imageUrl,
        status: "captured",
      })
      .returning();

    await logActivity({
      eventId,
      actionType: "scan_uploaded",
      actorUserId: session.user.id,
      description: `Uploaded scan (${sourceDetail})`,
      metadata: { recordId: record.id, filename },
    });

    // ─── AI EXTRACTION ───────────────────────────────────────────────
    const fieldSchemas = await db
      .select()
      .from(fldEvtFieldSchemas)
      .where(eq(fldEvtFieldSchemas.eventId, eventId));

    if (fieldSchemas.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        await db
          .update(fldEvtRecords)
          .set({ status: "processing" })
          .where(eq(fldEvtRecords.id, record.id));

        const result = await extractFromImage(record.id, eventId, imageUrl);

        if (result.success) {
          // ─── LAYER 3: Post-extraction validation ─────────────────
          const extractionCheck = validateExtractionResults(result.fields);

          if (!extractionCheck.valid) {
            // No useful data — delete from R2 and DB to avoid bloat
            await deleteFile(key);
            await db.delete(fldEvtRecords).where(eq(fldEvtRecords.id, record.id));

            return NextResponse.json(
              { error: extractionCheck.reason, rejected: true },
              { status: 422 }
            );
          }

          // Save extracted fields
          const defectiveReasons: string[] = [];
          const fieldMap = new Map(fieldSchemas.map((f) => [f.fieldName, f]));

          for (const [fieldName, data] of Object.entries(result.fields)) {
            const schema = fieldMap.get(fieldName);
            if (!schema) continue;

            await db.insert(fldEvtFieldValues).values({
              recordId: record.id,
              fieldSchemaId: schema.id,
              extractedValue: data.value || null,
              confidence: data.confidence,
            });

            if (schema.isRequired && !data.value) {
              defectiveReasons.push(`missing_${fieldName}`);
            }
          }

          // Check email specifically
          if (!result.fields["email"]?.value) {
            if (!defectiveReasons.includes("missing_email")) {
              defectiveReasons.push("missing_email");
            }
          }

          const finalStatus = defectiveReasons.length > 0 ? "defective" : "processed";

          await db
            .update(fldEvtRecords)
            .set({ status: finalStatus, defectiveReasons, updatedAt: new Date() })
            .where(eq(fldEvtRecords.id, record.id));

          return NextResponse.json(
            { ...record, status: finalStatus, extraction: "success", fields: result.fields },
            { status: 201 }
          );
        } else {
          // Extraction failed
          await db
            .update(fldEvtRecords)
            .set({ status: "defective", defectiveReasons: ["extraction_failed"], updatedAt: new Date() })
            .where(eq(fldEvtRecords.id, record.id));

          return NextResponse.json(
            { ...record, status: "defective", extraction: "failed", error: result.error },
            { status: 201 }
          );
        }
      } catch (extractErr: any) {
        console.error("[scans] Extraction error:", extractErr?.message);
        return NextResponse.json(
          { ...record, extraction: "error", error: extractErr?.message },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    console.error("[scans] Upload error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
