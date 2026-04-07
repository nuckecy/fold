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
];
const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com"];

// POST /api/seed/fill?title=Youth+Conference&count=30
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const count = parseInt(searchParams.get("count") || "30");

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const [event] = await db.select().from(fldEvtEvents).where(eq(fldEvtEvents.title, title)).limit(1);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Ensure field schemas exist
  let schemas = await db.select().from(fldEvtFieldSchemas).where(eq(fldEvtFieldSchemas.eventId, event.id));
  if (schemas.length === 0) {
    await db.insert(fldEvtFieldSchemas).values([
      { eventId: event.id, fieldName: "full_name", fieldLabels: { en: "Full Name" }, fieldType: "text", isRequired: true, sortOrder: 0 },
      { eventId: event.id, fieldName: "email", fieldLabels: { en: "Email" }, fieldType: "email", isRequired: true, sortOrder: 1 },
      { eventId: event.id, fieldName: "phone", fieldLabels: { en: "Phone" }, fieldType: "phone", isRequired: false, sortOrder: 2 },
    ]);
    schemas = await db.select().from(fldEvtFieldSchemas).where(eq(fldEvtFieldSchemas.eventId, event.id));
  }

  const nameSchema = schemas.find(s => s.fieldName === "full_name")!;
  const emailSchema = schemas.find(s => s.fieldName === "email")!;
  const phoneSchema = schemas.find(s => s.fieldName === "phone")!;

  let inserted = 0;
  for (let i = 0; i < count; i++) {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const [first, last] = name.toLowerCase().split(" ");
    const email = `${first}.${last}${Math.floor(Math.random() * 99)}@${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]}`;
    const phone = Math.random() > 0.3 ? `+234${Math.floor(7000000000 + Math.random() * 2999999999)}` : null;
    const isScan = Math.random() > 0.4;

    const roll = Math.random();
    let status = "processed";
    let reasons: string[] = [];
    let emailVal: string | null = email;

    if (roll < 0.10) {
      status = "defective"; reasons = ["missing_email"]; emailVal = null;
    } else if (roll < 0.15) {
      status = "defective"; reasons = ["malformed_data"]; emailVal = "bad-email";
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

    await db.insert(fldEvtFieldValues).values([
      { recordId: record.id, fieldSchemaId: nameSchema.id, extractedValue: name, confidence: isScan ? "high" : "exact" },
      { recordId: record.id, fieldSchemaId: emailSchema.id, extractedValue: emailVal, confidence: emailVal && !emailVal.startsWith("bad") ? "exact" : "low" },
      { recordId: record.id, fieldSchemaId: phoneSchema.id, extractedValue: phone, confidence: "medium" },
    ]);
    inserted++;
  }

  return NextResponse.json({ message: `Added ${inserted} records to "${event.title}"`, eventId: event.id });
}
