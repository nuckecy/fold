import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldIamUsers, fldIamVerificationTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcryptjs from "bcryptjs";

export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Find valid token
  const [verification] = await db
    .select()
    .from(fldIamVerificationTokens)
    .where(
      and(
        eq(fldIamVerificationTokens.token, token),
        gt(fldIamVerificationTokens.expires, new Date())
      )
    )
    .limit(1);

  if (!verification || !verification.identifier.startsWith("reset:")) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const email = verification.identifier.replace("reset:", "");

  // Hash new password
  const passwordHash = await bcryptjs.hash(password, 12);

  // Update user password
  await db
    .update(fldIamUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(fldIamUsers.email, email));

  // Delete the used token
  await db
    .delete(fldIamVerificationTokens)
    .where(eq(fldIamVerificationTokens.token, token));

  return NextResponse.json({ message: "Password has been reset" });
}
