import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEvtInvitations,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logActivity } from "@/services/activity-log";
import { sendEmail } from "@/services/email";

// GET /api/events/:eventId/scanners — List scanners and invitations
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

  const members = await db
    .select()
    .from(fldEvtMembers)
    .where(eq(fldEvtMembers.eventId, eventId));

  const invitations = await db
    .select()
    .from(fldEvtInvitations)
    .where(eq(fldEvtInvitations.eventId, eventId));

  // Generate QR join URL
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // Find or create a QR invitation
  let qrInvitation = invitations.find((i) => i.invitationMethod === "qr" && i.status === "pending");
  if (!qrInvitation && membership.role === "admin") {
    const code = nanoid(6).toUpperCase();
    const [created] = await db
      .insert(fldEvtInvitations)
      .values({
        eventId,
        accessCode: code,
        invitationMethod: "qr",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      })
      .returning();
    qrInvitation = created;
  }

  return NextResponse.json({
    members,
    invitations,
    joinUrl: qrInvitation ? `${appUrl}/scan/${qrInvitation.accessCode}` : null,
    joinCode: qrInvitation?.accessCode,
  });
}

// POST /api/events/:eventId/scanners — Invite a scanner by email
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

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const code = nanoid(6).toUpperCase();
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const [invitation] = await db
    .insert(fldEvtInvitations)
    .values({
      eventId,
      invitedEmail: email,
      accessCode: code,
      invitationMethod: "email",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning();

  await sendEmail({
    to: email,
    subject: "You have been invited to scan",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: bold;">Scanner Invitation</h2>
        <p style="color: #666; font-size: 14px;">You have been invited to help scan registration cards.</p>
        <p style="font-size: 14px;">Your join code: <strong>${code}</strong></p>
        <a href="${appUrl}/scan/${code}" style="display: inline-block; background: #171717; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
          Join scanning session
        </a>
      </div>
    `,
  });

  await logActivity({
    eventId,
    actionType: "scanner_invited",
    actorUserId: session.user.id,
    description: `Invited scanner ${email}`,
    metadata: { email, code, method: "email" },
  });

  return NextResponse.json(invitation, { status: 201 });
}
