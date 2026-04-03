import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";

// GET /api/events — List events for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await db
    .select({
      event: fldEvtEvents,
      role: fldEvtMembers.role,
    })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(eq(fldEvtMembers.userId, session.user.id));

  return NextResponse.json(memberships);
}

// POST /api/events — Create a new event
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    date,
    description,
    primaryLanguage,
    secondaryLanguage,
    expectedAttendeesMin,
    expectedAttendeesMax,
  } = body;

  if (!title || !date) {
    return NextResponse.json(
      { error: "Title and date are required" },
      { status: 400 }
    );
  }

  const [event] = await db
    .insert(fldEvtEvents)
    .values({
      createdBy: session.user.id,
      title,
      date,
      description,
      primaryLanguage: primaryLanguage || "en",
      secondaryLanguage,
      expectedAttendeesMin,
      expectedAttendeesMax,
    })
    .returning();

  // Creator becomes Admin for the event
  await db.insert(fldEvtMembers).values({
    eventId: event.id,
    userId: session.user.id,
    role: "admin",
    invitationMethod: "creator",
    status: "active",
    joinedAt: new Date(),
  });

  await logActivity({
    eventId: event.id,
    actionType: "event_created",
    actorUserId: session.user.id,
    description: `Created event "${title}"`,
    metadata: { primaryLanguage, secondaryLanguage, expectedAttendeesMin, expectedAttendeesMax },
  });

  return NextResponse.json(event, { status: 201 });
}
