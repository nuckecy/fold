import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { detectAndMergeDuplicates } from "@/services/record-merge";

// POST /api/events/:eventId/records/merge — Detect and merge duplicates
export async function POST(
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
        eq(fldEvtMembers.userId, session.user.id),
        eq(fldEvtMembers.role, "admin")
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await detectAndMergeDuplicates(eventId, session.user.id);

  return NextResponse.json(result);
}
