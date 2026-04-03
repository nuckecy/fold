import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtEvents,
  fldEvtMembers,
  fldEvtRecords,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EventActions } from "@/components/event-actions";
import { ActivityTimeline } from "@/components/activity-timeline";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { eventId } = await params;

  const [membership] = await db
    .select({
      event: fldEvtEvents,
      role: fldEvtMembers.role,
    })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(
      and(
        eq(fldEvtMembers.eventId, eventId),
        eq(fldEvtMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership) notFound();

  const { event, role } = membership;

  const [recordStats] = await db
    .select({
      total: sql<number>`count(*)`,
      defective: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'defective')`,
    })
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/events"
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to events
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {event.date} &middot; {event.primaryLanguage?.toUpperCase()}
              {event.secondaryLanguage &&
                ` / ${event.secondaryLanguage.toUpperCase()}`}{" "}
              &middot; <span className="capitalize">{role}</span>
            </p>
            {event.description && (
              <p className="text-sm text-neutral-600 mt-2 dark:text-neutral-400">
                {event.description}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              event.status === "active"
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : event.status === "closed"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                  : event.status === "archived"
                    ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {event.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Total records</div>
          <div className="text-2xl font-bold mt-1">{recordStats.total}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Defective</div>
          <div className="text-2xl font-bold mt-1">{recordStats.defective}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Expected range</div>
          <div className="text-2xl font-bold mt-1">
            {event.expectedAttendeesMin ?? "—"} - {event.expectedAttendeesMax ?? "—"}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Your role</div>
          <div className="text-2xl font-bold mt-1 capitalize">{role}</div>
        </div>
      </div>

      {role === "admin" && (
        <EventActions
          eventId={event.id}
          currentStatus={event.status ?? "active"}
          recordCount={recordStats.total}
        />
      )}

      <ActivityTimeline eventId={event.id} />
    </div>
  );
}
