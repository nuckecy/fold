import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEvtFieldSchemas } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";

// GET /api/events/:eventId/fields — List field schemas
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

  const fields = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId))
    .orderBy(asc(fldEvtFieldSchemas.sortOrder));

  return NextResponse.json(fields);
}

// POST /api/events/:eventId/fields — Add a field
export async function POST(
  request: Request,
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
        eq(fldEvtMembers.userId, session.user.id),
        eq(fldEvtMembers.role, "admin")
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { fieldName, fieldType, fieldLabels, fieldOptions, isRequired, sortOrder } = body;

  if (!fieldName || !fieldType) {
    return NextResponse.json(
      { error: "Field name and type are required" },
      { status: 400 }
    );
  }

  const [field] = await db
    .insert(fldEvtFieldSchemas)
    .values({
      eventId,
      fieldName,
      fieldType,
      fieldLabels: fieldLabels || {},
      fieldOptions: fieldOptions || null,
      isRequired: isRequired ?? false,
      sortOrder: sortOrder ?? 0,
    })
    .returning();

  await logActivity({
    eventId,
    actionType: "field_added",
    actorUserId: session.user.id,
    description: `Added field "${fieldName}" (${fieldType})`,
    metadata: { fieldId: field.id, fieldType, isRequired },
  });

  return NextResponse.json(field, { status: 201 });
}

// PATCH /api/events/:eventId/fields — Batch update field order
export async function PATCH(
  request: Request,
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
        eq(fldEvtMembers.userId, session.user.id),
        eq(fldEvtMembers.role, "admin")
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { fields } = await request.json();

  // fields = [{ id: "uuid", sortOrder: 0 }, { id: "uuid", sortOrder: 1 }, ...]
  if (!Array.isArray(fields)) {
    return NextResponse.json({ error: "fields array required" }, { status: 400 });
  }

  for (const { id, sortOrder } of fields) {
    await db
      .update(fldEvtFieldSchemas)
      .set({ sortOrder })
      .where(eq(fldEvtFieldSchemas.id, id));
  }

  return NextResponse.json({ message: "Field order updated" });
}
