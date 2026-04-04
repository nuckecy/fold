import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fldEvtEvents, fldEvtMembers, fldEvtRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CaptureEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { eventId } = await params;

  const [membership] = await db
    .select({ event: fldEvtEvents, role: fldEvtMembers.role })
    .from(fldEvtMembers)
    .innerJoin(fldEvtEvents, eq(fldEvtMembers.eventId, fldEvtEvents.id))
    .where(
      and(eq(fldEvtMembers.eventId, eventId), eq(fldEvtMembers.userId, session.user.id))
    )
    .limit(1);

  if (!membership) notFound();
  const { event, role } = membership;

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      captured: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'captured')`,
      processing: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'processing')`,
      defective: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'defective')`,
      reviewed: sql<number>`count(*) filter (where ${fldEvtRecords.status} = 'reviewed')`,
    })
    .from(fldEvtRecords)
    .where(eq(fldEvtRecords.eventId, eventId));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/capture" className="text-sm text-neutral-500">&larr; Events</Link>
        <h1 className="text-xl font-bold mt-1">{event.title}</h1>
        <p className="text-xs text-neutral-500">{event.date}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-neutral-500">Total</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <div className="text-2xl font-bold">{stats.reviewed}</div>
          <div className="text-xs text-neutral-500">Reviewed</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <div className="text-2xl font-bold">{stats.captured + stats.processing}</div>
          <div className="text-xs text-neutral-500">Processing</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <div className={`text-2xl font-bold ${stats.defective > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {stats.defective}
          </div>
          <div className="text-xs text-neutral-500">Flagged</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        {event.status === "active" && (
          <Link
            href={`/capture/events/${eventId}/scan`}
            className="block w-full rounded-xl bg-neutral-900 px-4 py-4 text-center text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Start scanning
          </Link>
        )}

        <Link
          href={`/capture/events/${eventId}/fields`}
          className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-center text-sm font-medium dark:border-neutral-700"
        >
          Configure fields
        </Link>

        <Link
          href={`/capture/events/${eventId}/form`}
          className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-center text-sm font-medium dark:border-neutral-700"
        >
          Share digital form
        </Link>

        {stats.defective > 0 && (
          <Link
            href={`/capture/events/${eventId}/records?status=defective`}
            className="block w-full rounded-xl border border-red-300 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-800 dark:text-red-400"
          >
            Review {stats.defective} flagged record{stats.defective !== 1 ? "s" : ""}
          </Link>
        )}
      </div>
    </div>
  );
}
