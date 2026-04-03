import { NextResponse } from "next/server";
import { db } from "@/db";
import { fldIamUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name, organization, country } = body;

  if (!email || !password || !name || !organization || !country) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: fldIamUsers.id })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcryptjs.hash(password, 12);

  const [user] = await db
    .insert(fldIamUsers)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      organization,
      country: country.toUpperCase(),
      authMethod: "email_password",
      profileComplete: true,
    })
    .returning({ id: fldIamUsers.id, email: fldIamUsers.email });

  return NextResponse.json(
    { message: "Account created successfully", userId: user.id },
    { status: 201 }
  );
}
