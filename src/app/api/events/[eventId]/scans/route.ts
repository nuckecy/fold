import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEvtRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";
import { uploadFile, scanKey } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

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
  const filename = `${uuidv4()}.${ext}`;
  const key = scanKey(eventId, filename);

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

  return NextResponse.json(record, { status: 201 });
}
