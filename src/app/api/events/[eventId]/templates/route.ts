import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEmlTemplates,
  fldEmlTemplateVersions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";

// GET /api/events/:eventId/templates — List templates
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

  const templates = await db.select().from(fldEmlTemplates);

  // Get versions for each template
  const enriched = await Promise.all(
    templates.map(async (t) => {
      const versions = await db
        .select()
        .from(fldEmlTemplateVersions)
        .where(eq(fldEmlTemplateVersions.templateId, t.id));
      return { ...t, versions };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/events/:eventId/templates — Create a template
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
  const { name, subject, body: emailBody, language } = body;

  if (!name || !subject || !emailBody) {
    return NextResponse.json(
      { error: "Name, subject, and body are required" },
      { status: 400 }
    );
  }

  const [template] = await db
    .insert(fldEmlTemplates)
    .values({
      name,
      createdBy: session.user.id,
    })
    .returning();

  const [version] = await db
    .insert(fldEmlTemplateVersions)
    .values({
      templateId: template.id,
      language: language || "en",
      subject,
      body: emailBody,
      status: "active",
      translationSource: "manual",
    })
    .returning();

  await logActivity({
    eventId,
    actionType: "template_created",
    actorUserId: session.user.id,
    description: `Created email template "${name}"`,
    metadata: { templateId: template.id, language: language || "en" },
  });

  return NextResponse.json({ ...template, versions: [version] }, { status: 201 });
}
