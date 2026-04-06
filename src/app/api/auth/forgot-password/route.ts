import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldIamUsers, fldIamVerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/services/email";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  // Check if user exists and has a password (not OAuth-only)
  const [user] = await db
    .select({ id: fldIamUsers.id, passwordHash: fldIamUsers.passwordHash })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.email, normalizedEmail))
    .limit(1);

  if (!user || !user.passwordHash) {
    // Do not reveal whether the email exists
    return NextResponse.json({
      message: "If an account exists with this email, a reset link has been sent.",
    });
  }

  // Generate token (single-use, 1-hour expiry)
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(fldIamVerificationTokens).values({
    identifier: `reset:${normalizedEmail}`,
    token,
    expires,
  });

  await sendPasswordResetEmail(normalizedEmail, token);

  return NextResponse.json({
    message: "If an account exists with this email, a reset link has been sent.",
  });
}
