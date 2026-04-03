import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldIamUsers, fldIamVerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "@/services/email";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check if user exists
  const [user] = await db
    .select({ id: fldIamUsers.id })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    // Do not reveal whether the email exists
    return NextResponse.json({
      message: "If an account exists with this email, a sign-in link has been sent.",
    });
  }

  // Generate token (single-use, 15-minute expiry)
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(fldIamVerificationTokens).values({
    identifier: email.toLowerCase(),
    token,
    expires,
  });

  await sendMagicLinkEmail(email.toLowerCase(), token);

  return NextResponse.json({
    message: "If an account exists with this email, a sign-in link has been sent.",
  });
}
