import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldEvtInvitations, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";
import { randomBytes } from "crypto";

// POST /api/scan/join — Join a scanning session with a code + email
export async function POST(request: Request) {
  const { code, email } = await request.json();

  if (!code || !email) {
    return NextResponse.json(
      { error: "Code and email are required" },
      { status: 400 }
    );
  }

  const [invitation] = await db
    .select()
    .from(fldEvtInvitations)
    .where(eq(fldEvtInvitations.accessCode, code.toUpperCase()))
    .limit(1);

  if (!invitation) {
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "This invitation has already been used" },
      { status: 410 }
    );
  }

  if (invitation.expiresAt && new Date() > invitation.expiresAt) {
    return NextResponse.json(
      { error: "This invitation has expired" },
      { status: 410 }
    );
  }

  // Generate a session token for the scanner
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4-hour inactivity timeout (E7)

  // Create scanner member
  const [member] = await db
    .insert(fldEvtMembers)
    .values({
      eventId: invitation.eventId,
      scannerEmail: email,
      role: "scanner",
      invitedBy: null,
      invitationMethod: invitation.invitationMethod,
      accessCode: invitation.accessCode,
      status: "active",
      joinedAt: new Date(),
      expiresAt,
      sessionToken,
    })
    .returning();

  // Mark invitation as used (for email invitations — QR invitations stay pending for reuse)
  if (invitation.invitationMethod === "email") {
    await db
      .update(fldEvtInvitations)
      .set({ status: "joined", joinedAt: new Date() })
      .where(eq(fldEvtInvitations.id, invitation.id));
  }

  await logActivity({
    eventId: invitation.eventId,
    actionType: "scanner_joined",
    actorLabel: email,
    description: `Scanner joined via ${invitation.invitationMethod}`,
    metadata: { email, memberId: member.id },
  });

  return NextResponse.json({
    sessionToken,
    eventId: invitation.eventId,
    memberId: member.id,
    expiresAt,
  });
}
