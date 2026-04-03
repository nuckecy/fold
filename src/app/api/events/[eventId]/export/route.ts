import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEvtRecords,
  fldEvtFieldValues,
  fldEvtFieldSchemas,
  fldEvtEvents,
  fldEmlSendLogs,
  fldEmlSequences,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// GET /api/events/:eventId/export?format=csv — Export records as CSV (L9)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

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

  const [event] = await db
    .select()
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.id, eventId))
    .limit(1);

  const fieldSchemas = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId))
    .orderBy(asc(fldEvtFieldSchemas.sortOrder));

  const records = await db
    .select()
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId));

  // Build CSV
  const headers = [
    "Record ID",
    "Capture Method",
    "Status",
    "Created At",
    ...fieldSchemas.map(
      (s) =>
        (s.fieldLabels as Record<string, string>)?.en || s.fieldName
    ),
    "Email Opt-Out",
  ];

  const rows = await Promise.all(
    records.map(async (record) => {
      const fieldValues = await db
        .select()
        .from(fldEvtFieldValues)
        .where(eq(fldEvtFieldValues.recordId, record.id));

      const valueMap = new Map(
        fieldValues.map((fv) => [fv.fieldSchemaId, fv.extractedValue || ""])
      );

      return [
        record.id,
        record.captureMethod,
        record.status,
        record.createdAt?.toISOString() || "",
        ...fieldSchemas.map((s) => valueMap.get(s.id) || ""),
        record.emailOptOut ? "Yes" : "No",
      ];
    })
  );

  // Escape CSV values
  function escapeCsv(val: string): string {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map((v) => escapeCsv(String(v))).join(",")),
  ].join("\n");

  const filename = `fold-${event?.title?.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
