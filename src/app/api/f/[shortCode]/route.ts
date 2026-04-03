import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  fldEvtFormSettings,
  fldEvtFieldSchemas,
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFormAccessLogs,
  fldEvtSubmissionThrottles,
  fldEvtEvents,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { logActivity } from "@/services/activity-log";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 64);
}

// GET /api/f/:shortCode — Get form data (public, no auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  const [formSettings] = await db
    .select()
    .from(fldEvtFormSettings)
    .where(eq(fldEvtFormSettings.shortCode, shortCode))
    .limit(1);

  if (!formSettings) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (!formSettings.isEnabled || formSettings.isManuallyClosed) {
    return NextResponse.json({
      closed: true,
      message: "This form is no longer accepting submissions.",
    });
  }

  // Get event info
  const [event] = await db
    .select({
      title: fldEvtEvents.title,
      primaryLanguage: fldEvtEvents.primaryLanguage,
      secondaryLanguage: fldEvtEvents.secondaryLanguage,
    })
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.id, formSettings.eventId))
    .limit(1);

  // Get field schemas
  const fields = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, formSettings.eventId))
    .orderBy(fldEvtFieldSchemas.sortOrder);

  return NextResponse.json({
    eventTitle: event?.title,
    formLanguage: formSettings.formLanguage,
    welcomeMessage: formSettings.welcomeMessage,
    confirmationMessage: formSettings.confirmationMessage,
    dataProtectionText: formSettings.dataProtectionText,
    showDataProtection: formSettings.showDataProtection,
    supportedLanguages: formSettings.supportedLanguages,
    fields: fields.map((f) => ({
      id: f.id,
      fieldName: f.fieldName,
      fieldType: f.fieldType,
      fieldLabels: f.fieldLabels,
      isRequired: f.isRequired,
    })),
  });
}

// POST /api/f/:shortCode — Submit form (public, no auth)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  const [formSettings] = await db
    .select()
    .from(fldEvtFormSettings)
    .where(eq(fldEvtFormSettings.shortCode, shortCode))
    .limit(1);

  if (!formSettings) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (!formSettings.isEnabled || formSettings.isManuallyClosed) {
    return NextResponse.json(
      { error: "This form is no longer accepting submissions." },
      { status: 410 }
    );
  }

  const body = await request.json();
  const { values, consent, honeypot, language } = body;

  // Honeypot check (F16)
  if (honeypot) {
    // Bot detected — return success to not reveal the check
    return NextResponse.json({ success: true });
  }

  // Consent check (F12)
  if (!consent) {
    return NextResponse.json(
      { error: "Data protection consent is required" },
      { status: 400 }
    );
  }

  // Rate limiting (F17)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ipHash = hashIp(ip);

  const [throttle] = await db
    .select()
    .from(fldEvtSubmissionThrottles)
    .where(
      and(
        eq(fldEvtSubmissionThrottles.eventId, formSettings.eventId),
        eq(fldEvtSubmissionThrottles.ipHash, ipHash)
      )
    )
    .limit(1);

  if (throttle?.isBlocked) {
    return NextResponse.json(
      { error: "Too many submissions from this address" },
      { status: 429 }
    );
  }

  // Update throttle
  if (throttle) {
    await db
      .update(fldEvtSubmissionThrottles)
      .set({
        submissionCount: (throttle.submissionCount ?? 0) + 1,
        lastSubmissionAt: new Date(),
      })
      .where(eq(fldEvtSubmissionThrottles.id, throttle.id));
  } else {
    await db.insert(fldEvtSubmissionThrottles).values({
      eventId: formSettings.eventId,
      ipHash,
      submissionCount: 1,
      lastSubmissionAt: new Date(),
    });
  }

  // Get field schemas for validation
  const fieldSchemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, formSettings.eventId));

  // Validate required fields
  const errors: string[] = [];
  for (const schema of fieldSchemas) {
    if (schema.isRequired && !values?.[schema.id]) {
      const label =
        (schema.fieldLabels as Record<string, string>)?.en || schema.fieldName;
      errors.push(`${label} is required`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Create record
  const [record] = await db
    .insert(fldEvtRecords)
    .values({
      eventId: formSettings.eventId,
      captureMethod: "digital",
      sourceDetail: "form",
      status: "reviewed", // Digital submissions do not need AI extraction
      formLanguage: language || "en",
      ipHash,
      submittedAt: new Date(),
    })
    .returning();

  // Save field values
  for (const schema of fieldSchemas) {
    const value = values?.[schema.id];
    if (value !== undefined && value !== "") {
      await db.insert(fldEvtFieldValues).values({
        recordId: record.id,
        fieldSchemaId: schema.id,
        extractedValue: value,
        confidence: null, // digital = no confidence needed
      });
    }
  }

  // Log form access
  await db.insert(fldEvtFormAccessLogs).values({
    formSettingsId: formSettings.id,
    converted: true,
    source: "form",
    deviceType: request.headers.get("user-agent")?.includes("Mobile")
      ? "mobile"
      : "desktop",
  });

  await logActivity({
    eventId: formSettings.eventId,
    actionType: "form_submitted",
    description: `Digital form submission received`,
    metadata: { recordId: record.id, language, source: "form" },
  });

  return NextResponse.json({ success: true, recordId: record.id }, { status: 201 });
}
