import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  fldIamUsers,
  fldEvtEvents,
  fldEvtMembers,
  fldEvtRecords,
  fldEvtFieldSchemas,
  fldEvtFieldValues,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const NAMES = [
  "Adaeze Okonkwo", "Blessing Nwankwo", "Chinwe Eze", "Daniel Obi",
  "Esther Adeyemi", "Francis Okoro", "Grace Udoh", "Henry Nwosu",
  "Ifeoma Chukwu", "Joseph Abiodun", "Kemi Oladipo", "Linus Agu",
  "Mercy Bello", "Nnamdi Igwe", "Oluwaseun Balogun", "Patricia Udo",
  "Rita Nwafor", "Samuel Bassey", "Tola Adebayo", "Victor Ekwueme",
  "Wale Ogunleye", "Yemi Akinyemi", "Zainab Ibrahim", "Chidi Anyanwu",
  "Damilola Olufemi", "Emeka Uche", "Funke Adeleke", "Godwin Edeh",
  "Halima Suleiman", "Ikenna Okafor", "Joy Effiong", "Kingsley Amadi",
  "Lola Fashola", "Musa Abdullahi", "Nneka Dim", "Obinna Onyekachi",
  "Patience Edem", "Rasheed Mustapha", "Sade Bakare", "Tunde Lawal",
];

const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];

function randomEmail(name: string): string {
  const [first, last] = name.toLowerCase().split(" ");
  const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${first}.${last}${num}@${domain}`;
}

function randomPhone(): string {
  return `+234${Math.floor(7000000000 + Math.random() * 2999999999)}`;
}

async function createFieldSchemas(eventId: string) {
  const [name] = await db.insert(fldEvtFieldSchemas).values({
    eventId, fieldName: "full_name", fieldLabels: { en: "Full Name" }, fieldType: "text", isRequired: true, sortOrder: 0,
  }).returning();
  const [email] = await db.insert(fldEvtFieldSchemas).values({
    eventId, fieldName: "email", fieldLabels: { en: "Email" }, fieldType: "email", isRequired: true, sortOrder: 1,
  }).returning();
  const [phone] = await db.insert(fldEvtFieldSchemas).values({
    eventId, fieldName: "phone", fieldLabels: { en: "Phone" }, fieldType: "phone", isRequired: false, sortOrder: 2,
  }).returning();
  return { name, email, phone };
}

async function insertRecords(
  eventId: string,
  schemas: { name: { id: string }; email: { id: string }; phone: { id: string } },
  count: number
) {
  // Batch insert for performance
  const batchSize = 50;
  for (let b = 0; b < count; b += batchSize) {
    const size = Math.min(batchSize, count - b);
    for (let i = 0; i < size; i++) {
      const personName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const isScan = Math.random() > 0.4;
      const roll = Math.random();

      let status = "processed";
      let reasons: string[] = [];
      let emailVal: string | null = randomEmail(personName);
      let confidence = "exact";

      if (roll < 0.10) {
        status = "defective";
        reasons = ["missing_email"];
        emailVal = null;
        confidence = "low";
      } else if (roll < 0.15) {
        status = "defective";
        reasons = ["malformed_data"];
        emailVal = "bad-email-format";
        confidence = "low";
      }

      const phoneVal = Math.random() > 0.25 ? randomPhone() : null;

      const [record] = await db.insert(fldEvtRecords).values({
        eventId,
        captureMethod: isScan ? "scan" : "digital",
        sourceDetail: isScan ? "camera" : "form",
        status,
        defectiveReasons: JSON.stringify(reasons),
        formLanguage: Math.random() > 0.3 ? "en" : "de",
        contentLanguage: Math.random() > 0.3 ? "en" : "de",
        submittedAt: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)),
      }).returning();

      await db.insert(fldEvtFieldValues).values([
        { recordId: record.id, fieldSchemaId: schemas.name.id, extractedValue: personName, confidence: isScan ? "high" : "exact" },
        { recordId: record.id, fieldSchemaId: schemas.email.id, extractedValue: emailVal, confidence },
        { recordId: record.id, fieldSchemaId: schemas.phone.id, extractedValue: phoneVal, confidence: "medium" },
      ]);
    }
  }
}

export async function POST() {
  const TARGET_EMAIL = "nuckecy@gmail.com";

  // Find user
  const [user] = await db
    .select({ id: fldIamUsers.id, organization: fldIamUsers.organization })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.email, TARGET_EMAIL))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: `User ${TARGET_EMAIL} not found` }, { status: 404 });
  }

  // Delete existing events for this user (cascades to records, fields, etc.)
  const existingEvents = await db
    .select({ id: fldEvtEvents.id })
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.createdBy, user.id));

  for (const evt of existingEvents) {
    await db.delete(fldEvtFieldValues).where(
      eq(fldEvtFieldValues.recordId,
        db.select({ id: fldEvtRecords.id }).from(fldEvtRecords).where(eq(fldEvtRecords.eventId, evt.id)).limit(1) as any
      )
    );
    await db.delete(fldEvtRecords).where(eq(fldEvtRecords.eventId, evt.id));
    await db.delete(fldEvtFieldSchemas).where(eq(fldEvtFieldSchemas.eventId, evt.id));
    await db.delete(fldEvtMembers).where(eq(fldEvtMembers.eventId, evt.id));
    await db.delete(fldEvtEvents).where(eq(fldEvtEvents.id, evt.id));
  }

  const events = [
    { title: "Easter Service", date: "2026-04-05", description: "Easter Sunday celebration service", lang: "en", records: 0 },
    { title: "Sunday Morning", date: "2026-04-06", description: "Regular Sunday morning worship", lang: "en", records: 1 },
    { title: "New Converts", date: "2026-04-03", description: "New converts welcome and registration", lang: "en", records: 20 },
    { title: "Youth Conference", date: "2026-04-10", description: "Annual youth conference registration with large attendance", lang: "both", records: 200 },
  ];

  const results = [];

  for (const evt of events) {
    const [event] = await db.insert(fldEvtEvents).values({
      createdBy: user.id,
      title: evt.title,
      date: evt.date,
      description: evt.description,
      primaryLanguage: evt.lang === "both" ? "en" : evt.lang,
      secondaryLanguage: evt.lang === "both" ? "de" : undefined,
      expectedAttendeesMin: 1,
      expectedAttendeesMax: evt.records > 0 ? evt.records * 2 : 100,
      status: "active",
    }).returning();

    // Add user as admin member
    await db.insert(fldEvtMembers).values({
      eventId: event.id,
      userId: user.id,
      role: "admin",
      status: "active",
      joinedAt: new Date(),
    });

    if (evt.records > 0) {
      const schemas = await createFieldSchemas(event.id);
      await insertRecords(event.id, schemas, evt.records);
    }

    results.push({ title: evt.title, records: evt.records });
  }

  return NextResponse.json({
    message: `Seeded for ${TARGET_EMAIL}`,
    events: results,
  });
}
