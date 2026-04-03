import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldIamUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { organization, country } = body;

  if (!organization || !country) {
    return NextResponse.json(
      { error: "Organization and country are required" },
      { status: 400 }
    );
  }

  await db
    .update(fldIamUsers)
    .set({
      organization,
      country: country.toUpperCase(),
      profileComplete: true,
      updatedAt: new Date(),
    })
    .where(eq(fldIamUsers.id, session.user.id));

  return NextResponse.json({ message: "Profile completed" });
}
