import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await db
    .select({
      event: fldEvtEvents,
      role: fldEvtMembers.role,
    })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(eq(fldEvtMembers.userId, session.user.id))
    .limit(5);

  const activeEvents = memberships.filter(
    (m) => m.event.status === "active"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Here is an overview of your events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Total events</div>
          <div className="text-2xl font-bold mt-1">{memberships.length}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Active events</div>
          <div className="text-2xl font-bold mt-1">{activeEvents}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Your role</div>
          <div className="text-2xl font-bold mt-1 capitalize">
            {memberships[0]?.role || "—"}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent events</h2>
          <Link
            href="/dashboard/events/new"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            New event
          </Link>
        </div>

        {memberships.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              No events yet. Create your first event to get started.
            </p>
            <Link
              href="/dashboard/events/new"
              className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Create event
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {memberships.map(({ event, role }) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="block rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:hover:bg-neutral-800/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-neutral-500 mt-0.5">
                      {event.date} &middot;{" "}
                      <span className="capitalize">{role}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : event.status === "closed"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
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
    </div>
  );
}
