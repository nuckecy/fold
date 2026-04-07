import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldEvtEvents, fldEvtRecords, fldEvtFieldSchemas, fldEvtFieldValues } from "@/db/schema";
import { eq } from "drizzle-orm";

const NAMES = [
  "Adaeze Okonkwo", "Blessing Nwankwo", "Chinwe Eze", "Daniel Obi",
  "Esther Adeyemi", "Francis Okoro", "Grace Udoh", "Henry Nwosu",
  "Ifeoma Chukwu", "Joseph Abiodun", "Kemi Oladipo", "Linus Agu",
  "Mercy Bello", "Nnamdi Igwe", "Oluwaseun Balogun", "Patricia Udo",
  "Rita Nwafor", "Samuel Bassey", "Tola Adebayo", "Victor Ekwueme",
  "Wale Ogunleye", "Yemi Akinyemi", "Zainab Ibrahim", "Chidi Anyanwu",
  "Damilola Olufemi", "Emeka Uche", "Funke Adeleke", "Godwin Edeh",
];

const EMAILS_DOMAIN = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

function randomEmail(name: string): string {
  const parts = name.toLowerCase().split(" ");
  const domain = EMAILS_DOMAIN[Math.floor(Math.random() * EMAILS_DOMAIN.length)];
  return `${parts[0]}.${parts[1]}${Math.floor(Math.random() * 99)}@${domain}`;
}

function randomPhone(): string {
  return `+234${Math.floor(700000000 + Math.random() * 299999999)}`;
}

export async function POST() {
  const events = await db.select({ id: fldEvtEvents.id }).from(fldEvtEvents);

  if (events.length === 0) {
    return NextResponse.json({ error: "No events found" }, { status: 404 });
  }

  // Clear existing records first
  for (const event of events) {
    await db.delete(fldEvtRecords).where(eq(fldEvtRecords.eventId, event.id));
    await db.delete(fldEvtFieldSchemas).where(eq(fldEvtFieldSchemas.eventId, event.id));
  }

  let totalInserted = 0;

  for (const event of events) {
    // Create field schemas for this event
    const [nameSchema] = await db.insert(fldEvtFieldSchemas).values({
      eventId: event.id, fieldName: "full_name", fieldLabels: { en: "Full Name" }, fieldType: "text", isRequired: true, sortOrder: 0,
    }).returning();

    const [emailSchema] = await db.insert(fldEvtFieldSchemas).values({
      eventId: event.id, fieldName: "email", fieldLabels: { en: "Email" }, fieldType: "email", isRequired: true, sortOrder: 1,
    }).returning();

    const [phoneSchema] = await db.insert(fldEvtFieldSchemas).values({
      eventId: event.id, fieldName: "phone", fieldLabels: { en: "Phone" }, fieldType: "phone", isRequired: false, sortOrder: 2,
    }).returning();

    const count = 15 + Math.floor(Math.random() * 30);

    for (let i = 0; i < count; i++) {
      const isScan = Math.random() > 0.4;
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const email = randomEmail(name);
      const phone = randomPhone();

      // Decide defective type
      const roll = Math.random();
      let status = "processed";
      let reasons: string[] = [];
      let actualEmail: string | null = email;

      if (roll < 0.1) {
        // Missing email
        status = "defective";
        reasons = ["missing_email"];
        actualEmail = null;
      } else if (roll < 0.18) {
        // Malformed data
        status = "defective";
        reasons = ["malformed_data"];
        actualEmail = "not-an-email";
      }

      const [record] = await db.insert(fldEvtRecords).values({
        eventId: event.id,
        captureMethod: isScan ? "scan" : "digital",
        sourceDetail: isScan ? "camera" : "form",
        status,
        defectiveReasons: JSON.stringify(reasons),
        formLanguage: Math.random() > 0.3 ? "en" : "de",
        contentLanguage: Math.random() > 0.3 ? "en" : "de",
        submittedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      }).returning();

      // Insert field values
      await db.insert(fldEvtFieldValues).values([
        { recordId: record.id, fieldSchemaId: nameSchema.id, extractedValue: name, confidence: isScan ? "high" : "exact" },
        { recordId: record.id, fieldSchemaId: emailSchema.id, extractedValue: actualEmail, confidence: actualEmail && actualEmail.includes("@") && !actualEmail.startsWith("not-") ? "exact" : "low" },
        { recordId: record.id, fieldSchemaId: phoneSchema.id, extractedValue: Math.random() > 0.3 ? phone : null, confidence: "medium" },
      ]);

      totalInserted++;
    }
  }

  return NextResponse.json({
    message: `Seeded ${totalInserted} records with field values across ${events.length} events`,
  });
}
