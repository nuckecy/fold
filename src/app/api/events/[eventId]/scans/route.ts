import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEvtRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";
import { uploadFile, scanKey } from "@/lib/storage";
import { extractFromImage } from "@/services/ai-extraction";
import { fldEvtFieldSchemas, fldEvtFieldValues } from "@/db/schema";

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

  // Verify membership (admin or scanner)
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

  // UUID-based filename (N6: no original filenames preserved)
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const key = scanKey(eventId, filename);

  try {
    // Upload to R2
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageUrl = await uploadFile(key, bytes, file.type);

    // Create record — one image = one record, always (D5)
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

    // ─── Auto-trigger AI extraction ──────────────────────────────────
    // Check if event has field schemas configured
    const fieldSchemas = await db
      .select()
      .from(fldEvtFieldSchemas)
      .where(eq(fldEvtFieldSchemas.eventId, eventId));

    if (fieldSchemas.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        // Mark as processing
        await db
          .update(fldEvtRecords)
          .set({ status: "processing" })
          .where(eq(fldEvtRecords.id, record.id));

        const result = await extractFromImage(record.id, eventId, imageUrl);

        if (result.success) {
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

          // Check if email is missing (common defective reason)
          const emailField = result.fields["email"];
          if (!emailField?.value) {
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
          // Extraction failed — mark as captured for manual review
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
        // Upload succeeded but extraction failed — record stays as captured
        return NextResponse.json(
          { ...record, extraction: "error", error: extractErr?.message },
          { status: 201 }
        );
      }
    }

    // No field schemas or no API key — return as-is
    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    console.error("[scans] Upload error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
