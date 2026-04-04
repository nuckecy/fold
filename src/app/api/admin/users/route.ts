import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldIamUsers } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db
    .select({
      id: fldIamUsers.id,
      name: fldIamUsers.name,
      email: fldIamUsers.email,
      authMethod: fldIamUsers.authMethod,
      profileComplete: fldIamUsers.profileComplete,
      createdAt: fldIamUsers.createdAt,
    })
    .from(fldIamUsers);

  return NextResponse.json({ users });
}
