import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldIamUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/user/settings — Get current user settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      appLanguage: fldIamUsers.appLanguage,
      notificationPreferences: fldIamUsers.notificationPreferences,
    })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.id, session.user.id))
    .limit(1);

  return NextResponse.json(user);
}

// PATCH /api/user/settings — Update user settings
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.appLanguage !== undefined) {
    updates.appLanguage = body.appLanguage;
  }

  if (body.notificationPreferences !== undefined) {
    updates.notificationPreferences = body.notificationPreferences;
  }

  updates.updatedAt = new Date();

  await db
    .update(fldIamUsers)
    .set(updates)
    .where(eq(fldIamUsers.id, session.user.id));

  return NextResponse.json({ message: "Settings updated" });
}
