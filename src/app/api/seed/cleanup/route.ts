import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldEvtEvents, fldEvtRecords, fldEvtFieldValues, fldEvtFieldSchemas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFile } from "@/lib/storage";

// POST /api/seed/cleanup — Clear all records for a specific event
export async function POST(request: Request) {
  const { eventId, title } = await request.json();

  if (!eventId && !title) {
    return NextResponse.json({ error: "eventId or title required" }, { status: 400 });
  }

  // Find the event
  let event;
  if (eventId) {
    const [e] = await db.select().from(fldEvtEvents).where(eq(fldEvtEvents.id, eventId)).limit(1);
    event = e;
  } else {
    const [e] = await db.select().from(fldEvtEvents).where(eq(fldEvtEvents.title, title)).limit(1);
    event = e;
  }

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get all records for this event
  const records = await db.select().from(fldEvtRecords).where(eq(fldEvtRecords.eventId, event.id));

  // Delete R2 images
  let deletedImages = 0;
  for (const record of records) {
    if (record.imageUrl && record.imageUrl.includes("r2.dev/")) {
      const key = record.imageUrl.split("r2.dev/")[1];
      if (key) {
        try {
          await deleteFile(key);
          deletedImages++;
        } catch {}
      }
    }
  }

  // Delete field values for all records
  for (const record of records) {
    await db.delete(fldEvtFieldValues).where(eq(fldEvtFieldValues.recordId, record.id));
  }

  // Delete records
  await db.delete(fldEvtRecords).where(eq(fldEvtRecords.eventId, event.id));

  // Delete field schemas
  await db.delete(fldEvtFieldSchemas).where(eq(fldEvtFieldSchemas.eventId, event.id));

  return NextResponse.json({
    message: `Cleared event "${event.title}"`,
    recordsDeleted: records.length,
    imagesDeleted: deletedImages,
  });
}
