import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldIamUsers, fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/seed/fix-membership — Re-add user as admin to all their events
export async function POST() {
  const [user] = await db
    .select({ id: fldIamUsers.id })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.email, "nuckecy@gmail.com"))
    .limit(1);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const events = await db
    .select({ id: fldEvtEvents.id, title: fldEvtEvents.title })
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.createdBy, user.id));

  let fixed = 0;
  for (const event of events) {
    const [existing] = await db
      .select()
      .from(fldEvtMembers)
      .where(and(eq(fldEvtMembers.eventId, event.id), eq(fldEvtMembers.userId, user.id)))
      .limit(1);

    if (!existing) {
      await db.insert(fldEvtMembers).values({
        eventId: event.id,
        userId: user.id,
        role: "admin",
        status: "active",
        joinedAt: new Date(),
      });
      fixed++;
    }
  }

  return NextResponse.json({
    message: `Fixed membership for ${fixed} events`,
    events: events.map(e => e.title),
  });
}
