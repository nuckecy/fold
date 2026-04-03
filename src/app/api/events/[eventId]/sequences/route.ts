import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  fldEvtMembers,
  fldEmlSequences,
  fldEmlCountdowns,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { logActivity } from "@/services/activity-log";
import {
  startCountdown,
  pauseCountdown,
  resumeCountdown,
  cancelCountdown,
  sendSequenceEmails,
} from "@/services/email-sequence";

// GET /api/events/:eventId/sequences — List sequences with countdown status
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const [membership] = await db
    .select()
    .from(fldEvtMembers)
    .where(
      and(
        eq(fldEvtMembers.eventId, eventId),
        eq(fldEvtMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sequences = await db
    .select()
    .from(fldEmlSequences)
    .where(eq(fldEmlSequences.eventId, eventId))
    .orderBy(asc(fldEmlSequences.sequenceOrder));

  const enriched = await Promise.all(
    sequences.map(async (seq) => {
      const countdowns = await db
        .select()
        .from(fldEmlCountdowns)
        .where(eq(fldEmlCountdowns.sequenceId, seq.id));

      const activeCountdown = countdowns.find(
        (c) => c.status === "counting" || c.status === "paused"
      );

      return { ...seq, countdown: activeCountdown || null };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/events/:eventId/sequences — Create a sequence step or perform action
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const [membership] = await db
    .select()
    .from(fldEvtMembers)
    .where(
      and(
        eq(fldEvtMembers.eventId, eventId),
        eq(fldEvtMembers.userId, session.user.id),
        eq(fldEvtMembers.role, "admin")
      )
    )
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Action: create new sequence step
  if (body.action === "create") {
    const [sequence] = await db
      .insert(fldEmlSequences)
      .values({
        eventId,
        templateId: body.templateId,
        sequenceOrder: body.sequenceOrder || 1,
        sendType: body.sendType || "immediate",
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        delayDays: body.delayDays,
      })
      .returning();

    await logActivity({
      eventId,
      actionType: "sequence_created",
      actorUserId: session.user.id,
      description: `Created email sequence step ${sequence.sequenceOrder}`,
      metadata: { sequenceId: sequence.id },
    });

    return NextResponse.json(sequence, { status: 201 });
  }

  // Action: start countdown
  if (body.action === "start_countdown") {
    const result = await startCountdown(body.sequenceId, session.user.id);

    await logActivity({
      eventId,
      actionType: "countdown_started",
      actorUserId: session.user.id,
      description: `Started 1-hour countdown for sequence step`,
      metadata: { sequenceId: body.sequenceId, scheduledSendAt: result.scheduledSendAt },
    });

    return NextResponse.json(result);
  }

  // Action: pause countdown
  if (body.action === "pause") {
    await pauseCountdown(body.countdownId, session.user.id);

    await logActivity({
      eventId,
      actionType: "countdown_paused",
      actorUserId: session.user.id,
      description: `Paused email countdown`,
      metadata: { countdownId: body.countdownId },
    });

    return NextResponse.json({ message: "Countdown paused" });
  }

  // Action: resume countdown (restarts full 1 hour)
  if (body.action === "resume") {
    const result = await resumeCountdown(body.countdownId);

    await logActivity({
      eventId,
      actionType: "countdown_resumed",
      actorUserId: session.user.id,
      description: `Resumed countdown (restarted to full 1 hour)`,
      metadata: { countdownId: body.countdownId, scheduledSendAt: result.scheduledSendAt },
    });

    return NextResponse.json(result);
  }

  // Action: cancel
  if (body.action === "cancel") {
    await cancelCountdown(body.countdownId);

    await logActivity({
      eventId,
      actionType: "countdown_cancelled",
      actorUserId: session.user.id,
      description: `Cancelled email countdown`,
      metadata: { countdownId: body.countdownId },
    });

    return NextResponse.json({ message: "Countdown cancelled" });
  }

  // Action: send now (after countdown completes)
  if (body.action === "send") {
    const result = await sendSequenceEmails(body.sequenceId, eventId);

    await logActivity({
      eventId,
      actionType: "emails_sent",
      actorUserId: session.user.id,
      description: `Sent ${result.sent} email${result.sent !== 1 ? "s" : ""} (${result.skipped} skipped, ${result.failed} failed)`,
      metadata: { sequenceId: body.sequenceId, ...result },
    });

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
