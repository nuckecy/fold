import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEmlTemplateVersions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { translateTemplateContent } from "@/services/translation";
import { logActivity } from "@/services/activity-log";

// POST /api/events/:eventId/templates/translate — Auto-translate a template version
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

  const { versionId, targetLanguage } = await request.json();

  if (!versionId || !targetLanguage) {
    return NextResponse.json(
      { error: "versionId and targetLanguage are required" },
      { status: 400 }
    );
  }

  // Get source version
  const [source] = await db
    .select()
    .from(fldEmlTemplateVersions)
    .where(eq(fldEmlTemplateVersions.id, versionId))
    .limit(1);

  if (!source) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Translate
  const translated = await translateTemplateContent(
    source.subject,
    source.body,
    targetLanguage,
    source.language
  );

  // Create new version (I5, I6)
  const [newVersion] = await db
    .insert(fldEmlTemplateVersions)
    .values({
      templateId: source.templateId,
      language: targetLanguage,
      subject: translated.subject,
      body: translated.body,
      status: "auto_translated", // I6: flagged for review
      translationSource: "auto_deepl",
      translatedFromVersionId: source.id,
    })
    .returning();

  await logActivity({
    eventId,
    actionType: "template_translated",
    actorUserId: session.user.id,
    description: `Auto-translated template to ${targetLanguage.toUpperCase()}`,
    metadata: { sourceVersionId: versionId, newVersionId: newVersion.id, targetLanguage },
  });

  return NextResponse.json(newVersion, { status: 201 });
}
