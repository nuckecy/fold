import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers, fldEvtRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/events/:eventId — Get event details
export async function GET(
  _request: Request,
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [event] = await db
    .select()
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.id, eventId))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ event, role: membership.role });
}

// PATCH /api/events/:eventId — Update event or change lifecycle
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  // Verify admin membership
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
  const updates: Record<string, unknown> = {};

  // Standard field updates
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.primaryLanguage !== undefined) updates.primaryLanguage = body.primaryLanguage;
  if (body.secondaryLanguage !== undefined) updates.secondaryLanguage = body.secondaryLanguage;
  if (body.expectedAttendeesMin !== undefined) updates.expectedAttendeesMin = body.expectedAttendeesMin;
  if (body.expectedAttendeesMax !== undefined) updates.expectedAttendeesMax = body.expectedAttendeesMax;

  // Lifecycle transitions
  if (body.status) {
    const [event] = await db
      .select()
      .from(fldEvtEvents)
      .where(eq(fldEvtEvents.id, eventId))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const validTransitions: Record<string, string[]> = {
      active: ["closed"],
      closed: ["active", "archived"],
      archived: ["hibernated"],
    };

    const allowed = validTransitions[event.status ?? ""] ?? [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${event.status} to ${body.status}` },
        { status: 400 }
      );
    }

    // ADR-003: Events with 4+ records cannot be deleted
    if (body.status === "deleted") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(fldEvtRecords)
        .where(eq(fldEvtRecords.eventId, eventId));

      if (count >= 4) {
        return NextResponse.json(
          { error: "Events with 4 or more records cannot be deleted. Use hibernation instead." },
          { status: 400 }
        );
      }
    }

    updates.status = body.status;
    if (body.status === "closed") updates.closedAt = new Date();
    if (body.status === "archived") updates.archivedAt = new Date();
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(fldEvtEvents)
    .set(updates)
    .where(eq(fldEvtEvents.id, eventId))
    .returning();

  return NextResponse.json(updated);
}

// DELETE /api/events/:eventId — Delete event (only if 0-3 records)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  // Verify admin
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

  // ADR-003: Check record count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId));

  if (count >= 4) {
    return NextResponse.json(
      { error: "Events with 4 or more records cannot be deleted. Use hibernation instead." },
      { status: 400 }
    );
  }

  await db.delete(fldEvtEvents).where(eq(fldEvtEvents.id, eventId));

  return NextResponse.json({ message: "Event deleted" });
}
