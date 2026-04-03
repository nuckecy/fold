import { db } from "@/db";
import { fldSysActivityLogs } from "@/db/schema";

interface LogActivityParams {
  eventId?: string;
  actionType: string;
  actorUserId?: string;
  actorLabel?: string;
  actedAsDelegate?: boolean;
  delegationId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  await db.insert(fldSysActivityLogs).values({
    eventId: params.eventId,
    actionType: params.actionType,
    actorUserId: params.actorUserId,
    actorLabel: params.actorLabel,
    actedAsDelegate: params.actedAsDelegate ?? false,
    delegationId: params.delegationId,
    description: params.description,
    metadata: params.metadata ?? {},
  });
}
