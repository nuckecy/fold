import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEvtFormSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logActivity } from "@/services/activity-log";

// GET /api/events/:eventId/form — Get form settings
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

  const [formSettings] = await db
    .select()
    .from(fldEvtFormSettings)
    .where(eq(fldEvtFormSettings.eventId, eventId))
    .limit(1);

  if (!formSettings) {
    return NextResponse.json({ exists: false });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return NextResponse.json({
    exists: true,
    ...formSettings,
    formUrl: `${appUrl}/f/${formSettings.shortCode}`,
  });
}

// POST /api/events/:eventId/form — Create or update form settings
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

  // Check if form settings already exist
  const [existing] = await db
    .select()
    .from(fldEvtFormSettings)
    .where(eq(fldEvtFormSettings.eventId, eventId))
    .limit(1);

  if (existing) {
    // Update existing
    const [updated] = await db
      .update(fldEvtFormSettings)
      .set({
        formLanguage: body.formLanguage ?? existing.formLanguage,
        welcomeMessage: body.welcomeMessage ?? existing.welcomeMessage,
        confirmationMessage: body.confirmationMessage ?? existing.confirmationMessage,
        dataProtectionText: body.dataProtectionText ?? existing.dataProtectionText,
        allowMultipleSubmissions: body.allowMultipleSubmissions ?? existing.allowMultipleSubmissions,
        isManuallyClosed: body.isManuallyClosed ?? existing.isManuallyClosed,
        isEnabled: body.isEnabled ?? existing.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(fldEvtFormSettings.id, existing.id))
      .returning();

    return NextResponse.json(updated);
  }

  // Create new form settings with a unique short code
  const shortCode = nanoid(8);

  const [formSettings] = await db
    .insert(fldEvtFormSettings)
    .values({
      eventId,
      shortCode,
      formLanguage: body.formLanguage || "auto",
      welcomeMessage: body.welcomeMessage || null,
      confirmationMessage: body.confirmationMessage || null,
      dataProtectionText:
        body.dataProtectionText ||
        "By submitting this form, you consent to the processing of your personal data in accordance with data protection regulations.",
      allowMultipleSubmissions: body.allowMultipleSubmissions ?? false,
    })
    .returning();

  await logActivity({
    eventId,
    actionType: "form_created",
    actorUserId: session.user.id,
    description: `Created digital form (code: ${shortCode})`,
    metadata: { shortCode, formSettingsId: formSettings.id },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return NextResponse.json(
    { ...formSettings, formUrl: `${appUrl}/f/${shortCode}` },
    { status: 201 }
  );
}
