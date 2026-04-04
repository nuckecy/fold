import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers, fldEvtRecords } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

export default async function CaptureHomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await db
    .select({
      event: fldEvtEvents,
      role: fldEvtMembers.role,
    })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(eq(fldEvtMembers.userId, session.user.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Events</h1>
        <Link
          href="/capture/events/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          + New
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">No events yet.</p>
          <Link
            href="/capture/events/new"
            className="mt-3 inline-block rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {memberships.map(({ event, role }) => (
            <Link
              key={event.id}
              href={`/capture/events/${event.id}`}
              className="block rounded-xl border border-neutral-200 p-4 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {event.date}
                  </div>
                </div>
                <span
                  className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    event.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
