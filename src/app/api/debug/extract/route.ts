import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldEvtRecords, fldEvtFieldSchemas } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/debug/extract?eventId=xxx — Test extraction pipeline
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  // Get latest captured record
  const records = await db
    .select()
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId))
    .limit(5);

  // Get field schemas
  const schemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  // Test Gemini API
  let geminiTest = "not tested";
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Reply with just: OK" }] }],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        geminiTest = `OK (${data.candidates?.[0]?.content?.parts?.[0]?.text || "no text"})`;
      } else {
        const err = await res.text();
        geminiTest = `FAILED: ${res.status} ${err.slice(0, 200)}`;
      }
    } catch (e: any) {
      geminiTest = `ERROR: ${e.message}`;
    }
  } else {
    geminiTest = "NO API KEY";
  }

  // Test image fetch from R2
  let imageTest = "no records with images";
  const recordWithImage = records.find((r) => r.imageUrl);
  if (recordWithImage?.imageUrl) {
    try {
      const imgRes = await fetch(recordWithImage.imageUrl);
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        imageTest = `OK (${buf.byteLength} bytes, type: ${imgRes.headers.get("content-type")})`;
      } else {
        imageTest = `FAILED: ${imgRes.status}`;
      }
    } catch (e: any) {
      imageTest = `ERROR: ${e.message}`;
    }
  }

  return NextResponse.json({
    eventId,
    records: records.map((r) => ({
      id: r.id,
      status: r.status,
      imageUrl: r.imageUrl?.slice(0, 80),
      captureMethod: r.captureMethod,
      defectiveReasons: r.defectiveReasons,
    })),
    fieldSchemas: schemas.map((s) => ({ name: s.fieldName, type: s.fieldType, required: s.isRequired })),
    geminiApiKey: apiKey ? `${apiKey.slice(0, 10)}...` : "NOT SET",
    geminiTest,
    imageTest,
    claudeApiKey: process.env.CLAUDE_API_KEY ? "SET" : "NOT SET",
    env: {
      R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || "NOT SET",
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? "SET" : "NOT SET",
    },
  });
}
