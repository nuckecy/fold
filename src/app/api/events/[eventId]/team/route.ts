import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEvtMemberPermissions,
  fldIamUsers,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";
import { DEFAULT_SUB_ADMIN_PERMISSIONS, LOCKED_PERMISSIONS } from "@/lib/permissions";

// GET /api/events/:eventId/team — List team members with permissions
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

  const enriched = await Promise.all(
    members.map(async (member) => {
      let userName = member.scannerEmail || "Unknown";
      if (member.userId) {
        const [user] = await db
          .select({ name: fldIamUsers.name, email: fldIamUsers.email })
          .from(fldIamUsers)
          .where(eq(fldIamUsers.id, member.userId))
          .limit(1);
        if (user) userName = user.name || user.email;
      }

      const permissions = await db
        .select()
        .from(fldEvtMemberPermissions)
        .where(eq(fldEvtMemberPermissions.memberId, member.id));

      return {
        ...member,
        userName,
        permissions: permissions.map((p) => ({
          key: p.permissionKey,
          granted: p.isGranted,
        })),
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/events/:eventId/team — Manage team actions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

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

  // Action: promote scanner to sub_admin
  if (body.action === "promote") {
    const [member] = await db
      .select()
      .from(fldEvtMembers)
      .where(eq(fldEvtMembers.id, body.memberId))
      .limit(1);

    if (!member || member.role !== "scanner") {
      return NextResponse.json({ error: "Can only promote scanners" }, { status: 400 });
    }

    // M16: QR-joined scanners need registration
    if (!member.userId && member.invitationMethod === "qr") {
      return NextResponse.json(
        { error: "QR-joined scanners must complete registration before promotion" },
        { status: 400 }
      );
    }

    await db
      .update(fldEvtMembers)
      .set({
        role: "sub_admin",
        promotedAt: new Date(),
        promotedBy: session.user.id,
      })
      .where(eq(fldEvtMembers.id, body.memberId));

    // Set default permissions (M3)
    for (const perm of DEFAULT_SUB_ADMIN_PERMISSIONS) {
      await db.insert(fldEvtMemberPermissions).values({
        memberId: body.memberId,
        permissionKey: perm,
        isGranted: true,
        grantedBy: session.user.id,
      });
    }

    await logActivity({
      eventId,
      actionType: "member_promoted",
      actorUserId: session.user.id,
      description: `Promoted member to Sub-Admin`,
      metadata: { memberId: body.memberId },
    });

    return NextResponse.json({ message: "Member promoted to Sub-Admin" });
  }

  // Action: demote sub_admin to scanner (M15: resets permissions)
  if (body.action === "demote") {
    await db
      .update(fldEvtMembers)
      .set({ role: "scanner" })
      .where(eq(fldEvtMembers.id, body.memberId));

    // Delete all permissions
    await db
      .delete(fldEvtMemberPermissions)
      .where(eq(fldEvtMemberPermissions.memberId, body.memberId));

    await logActivity({
      eventId,
      actionType: "member_demoted",
      actorUserId: session.user.id,
      description: `Demoted member to Scanner (permissions reset)`,
      metadata: { memberId: body.memberId },
    });

    return NextResponse.json({ message: "Member demoted to Scanner" });
  }

  // Action: toggle permission (M5)
  if (body.action === "toggle_permission") {
    if (LOCKED_PERMISSIONS.includes(body.permissionKey)) {
      return NextResponse.json(
        { error: "This permission is locked to Admin only" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(fldEvtMemberPermissions)
      .where(
        and(
          eq(fldEvtMemberPermissions.memberId, body.memberId),
          eq(fldEvtMemberPermissions.permissionKey, body.permissionKey)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(fldEvtMemberPermissions)
        .set({
          isGranted: !existing.isGranted,
          grantedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(fldEvtMemberPermissions.id, existing.id));
    } else {
      await db.insert(fldEvtMemberPermissions).values({
        memberId: body.memberId,
        permissionKey: body.permissionKey,
        isGranted: true,
        grantedBy: session.user.id,
      });
    }

    await logActivity({
      eventId,
      actionType: "permission_changed",
      actorUserId: session.user.id,
      description: `Toggled permission "${body.permissionKey}" for member`,
      metadata: { memberId: body.memberId, permission: body.permissionKey },
    });

    return NextResponse.json({ message: "Permission updated" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
