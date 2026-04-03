import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers, fldIamUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "./email";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-tokens";

/**
 * Send unsubscribe confirmation email to the person (K3).
 * Includes re-subscribe link valid for 30 days.
 */
export async function sendUnsubscribeConfirmation(
  email: string,
  eventId: string,
  recordId: string,
  resubscribeToken: string,
  scope: "event" | "global"
): Promise<void> {
  const [event] = await db
    .select({ title: fldEvtEvents.title })
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.id, eventId))
    .limit(1);

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resubscribeUrl = `${appUrl}/api/resubscribe?token=${resubscribeToken}&record=${recordId}`;

  await sendEmail({
    to: email,
    subject: "You have been unsubscribed",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>Unsubscribe Confirmation</h2>
        <p>You have been unsubscribed from ${
          scope === "global"
            ? "all future emails from this organization"
            : `emails from "${event?.title || "this event"}"`
        }.</p>
        <p style="color: #666; font-size: 14px;">
          Changed your mind? You can re-subscribe within 30 days:
        </p>
        <a href="${resubscribeUrl}" style="display: inline-block; background: #171717; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-top: 8px;">
          Re-subscribe
        </a>
      </div>
    `,
  });
}

/**
 * Notify the event owner/admin when someone unsubscribes (K6).
 */
export async function notifyOwnerOnUnsubscribe(
  eventId: string,
  attendeeEmail: string,
  scope: "event" | "global"
): Promise<void> {
  // Find the event admin
  const [adminMember] = await db
    .select()
    .from(fldEvtMembers)
    .where(
      and(
        eq(fldEvtMembers.eventId, eventId),
        eq(fldEvtMembers.role, "admin")
      )
    )
    .limit(1);

  if (!adminMember?.userId) return;

  const [admin] = await db
    .select({ email: fldIamUsers.email, name: fldIamUsers.name })
    .from(fldIamUsers)
    .where(eq(fldIamUsers.id, adminMember.userId))
    .limit(1);

  if (!admin?.email) return;

  const [event] = await db
    .select({ title: fldEvtEvents.title })
    .from(fldEvtEvents)
    .where(eq(fldEvtEvents.id, eventId))
    .limit(1);

  await sendEmail({
    to: admin.email,
    subject: `[Fold] Someone unsubscribed from "${event?.title}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>Unsubscribe Notification</h2>
        <p><strong>${attendeeEmail}</strong> has unsubscribed from ${
          scope === "global" ? "all events" : `"${event?.title}"`
        }.</p>
        <p style="color: #666; font-size: 14px;">
          This is informational. No action is required from you.
        </p>
      </div>
    `,
  });
}
