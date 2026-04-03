import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldIamUsers, fldIamVerificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { signIn } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=invalid_link", request.url)
    );
  }

  // Find and validate token
  const [record] = await db
    .select()
    .from(fldIamVerificationTokens)
    .where(eq(fldIamVerificationTokens.token, token))
    .limit(1);

  if (!record) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=invalid_link", request.url)
    );
  }

  if (new Date() > record.expires) {
    // Clean up expired token
    await db
      .delete(fldIamVerificationTokens)
      .where(eq(fldIamVerificationTokens.token, token));

    return NextResponse.redirect(
      new URL("/auth/signin?error=expired_link", request.url)
    );
  }

  // Delete token (single-use)
  await db
    .delete(fldIamVerificationTokens)
    .where(eq(fldIamVerificationTokens.token, token));

  // Verify user exists
  const [user] = await db
    .select({ id: fldIamUsers.id })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.email, record.identifier))
    .limit(1);

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=account_not_found", request.url)
    );
  }

  // Update auth method if needed
  await db
    .update(fldIamUsers)
    .set({ emailVerified: new Date() })
    .where(eq(fldIamUsers.id, user.id));

  // Redirect to a callback that will trigger client-side sign in
  return NextResponse.redirect(
    new URL(`/auth/signin?magic=success&email=${encodeURIComponent(record.identifier)}`, request.url)
  );
}
