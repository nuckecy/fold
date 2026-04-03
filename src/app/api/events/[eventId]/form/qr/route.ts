import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtMembers, fldEvtFormSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";

// GET /api/events/:eventId/form/qr?format=png|svg — Generate QR code
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
  const format = searchParams.get("format") || "png";

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
    return NextResponse.json(
      { error: "Form not configured. Create form settings first." },
      { status: 400 }
    );
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const formUrl = `${appUrl}/f/${formSettings.shortCode}`;

  if (format === "svg") {
    const svg = await QRCode.toString(formUrl, {
      type: "svg",
      width: 400,
      margin: 2,
    });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="fold-form-qr.svg"`,
      },
    });
  }

  // Default: PNG
  const pngBuffer = await QRCode.toBuffer(formUrl, {
    width: 400,
    margin: 2,
  });
  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="fold-form-qr.png"`,
    },
  });
}
