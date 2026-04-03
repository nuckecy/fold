import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers, fldEvtFieldSchemas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";

// POST /api/events/:eventId/duplicate — Duplicate event structure
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  // Verify admin membership on source event
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

  // Fetch source event
  const [source] = await db
    .select()
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.id, eventId))
    .limit(1);

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Create new event with same structure
  const [newEvent] = await db
    .insert(fldEvtEvents)
    .values({
      createdBy: session.user.id,
      title: `${source.title} (copy)`,
      date: source.date,
      description: source.description,
      primaryLanguage: source.primaryLanguage,
      secondaryLanguage: source.secondaryLanguage,
      expectedAttendeesMin: source.expectedAttendeesMin,
      expectedAttendeesMax: source.expectedAttendeesMax,
      duplicatedFrom: source.id,
    })
    .returning();

  // Creator becomes Admin
  await db.insert(fldEvtMembers).values({
    eventId: newEvent.id,
    userId: session.user.id,
    role: "admin",
    invitationMethod: "creator",
    status: "active",
    joinedAt: new Date(),
  });

  // Copy field schemas
  const sourceFields = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  if (sourceFields.length > 0) {
    await db.insert(fldEvtFieldSchemas).values(
      sourceFields.map((f) => ({
        eventId: newEvent.id,
        fieldName: f.fieldName,
        fieldLabels: f.fieldLabels,
        fieldType: f.fieldType,
        fieldOptions: f.fieldOptions,
        isRequired: f.isRequired,
        sortOrder: f.sortOrder,
      }))
    );
  }

  // Log duplication on both source and new event
  await logActivity({
    eventId: source.id,
    actionType: "event_duplicated",
    actorUserId: session.user.id,
    description: `Event duplicated to "${newEvent.title}"`,
    metadata: {
      sourceEventId: source.id,
      newEventId: newEvent.id,
      copiedFields: sourceFields.length,
    },
  });

  await logActivity({
    eventId: newEvent.id,
    actionType: "event_created",
    actorUserId: session.user.id,
    description: `Event created by duplicating "${source.title}"`,
    metadata: {
      sourceEventId: source.id,
      copiedFields: sourceFields.length,
    },
  });

  return NextResponse.json(newEvent, { status: 201 });
}
