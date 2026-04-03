import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldIamDelegations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";
import { sendEmail } from "@/services/email";

const MAX_DELEGATION_DAYS = 30; // M9

// GET /api/events/:eventId/delegations — List delegations
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const delegations = await db
    .select()
    .from(fldIamDelegations)
    .where(eq(fldIamDelegations.eventId, eventId));

  return NextResponse.json(delegations);
}

// POST /api/events/:eventId/delegations — Create or manage delegation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  // Only admin can delegate
  const [adminMembership] = await db
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

  if (!adminMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Create delegation
  if (body.action === "create") {
    const { memberId, startsAt, expiresAt } = body;

    if (!memberId || !startsAt || !expiresAt) {
      return NextResponse.json(
        { error: "memberId, startsAt, and expiresAt are required" },
        { status: 400 }
      );
    }

    // Validate max 30 days (M9)
    const start = new Date(startsAt);
    const end = new Date(expiresAt);
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (durationDays > MAX_DELEGATION_DAYS) {
      return NextResponse.json(
        { error: `Delegation cannot exceed ${MAX_DELEGATION_DAYS} days` },
        { status: 400 }
      );
    }

    // Check for existing active delegation (M11: one at a time)
    const existing = await db
      .select()
      .from(fldIamDelegations)
      .where(
        and(
          eq(fldIamDelegations.eventId, eventId),
          eq(fldIamDelegations.status, "active")
        )
      );

    if (existing.length > 0) {
      // Revoke existing delegation
      for (const d of existing) {
        await db
          .update(fldIamDelegations)
          .set({ status: "revoked", revokedAt: new Date() })
          .where(eq(fldIamDelegations.id, d.id));
      }
    }

    // Verify member is sub_admin
    const [member] = await db
      .select()
      .from(fldEvtMembers)
      .where(eq(fldEvtMembers.id, memberId))
      .limit(1);

    if (!member || member.role !== "sub_admin") {
      return NextResponse.json(
        { error: "Can only delegate to Sub-Admins" },
        { status: 400 }
      );
    }

    const [delegation] = await db
      .insert(fldIamDelegations)
      .values({
        eventId,
        delegatedTo: memberId,
        delegatedBy: session.user.id,
        startsAt: start,
        expiresAt: end,
        status: start <= new Date() ? "active" : "pending",
      })
      .returning();

    // M12: Send notification email to delegate
    if (member.scannerEmail || member.userId) {
      const email = member.scannerEmail || "delegate";
      await sendEmail({
        to: email,
        subject: "You have been delegated admin access",
        html: `<p>You have been granted temporary admin access until ${end.toLocaleDateString()}.</p>`,
      });
    }

    await logActivity({
      eventId,
      actionType: "delegation_created",
      actorUserId: session.user.id,
      description: `Delegated admin access until ${end.toLocaleDateString()}`,
      metadata: { delegationId: delegation.id, memberId, expiresAt },
    });

    return NextResponse.json(delegation, { status: 201 });
  }

  // Revoke delegation
  if (body.action === "revoke") {
    await db
      .update(fldIamDelegations)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(fldIamDelegations.id, body.delegationId));

    await logActivity({
      eventId,
      actionType: "delegation_revoked",
      actorUserId: session.user.id,
      description: `Revoked admin delegation`,
      metadata: { delegationId: body.delegationId },
    });

    return NextResponse.json({ message: "Delegation revoked" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
