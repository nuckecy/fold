import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { fldEvtEvents } from "./events";

// ─── Activity Logs (Audit Trail) ─────────────────────────────────────────────
export const fldSysActivityLogs = pgTable(
  "fld_sys_activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").references(() => fldEvtEvents.id),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    actorUserId: uuid("actor_user_id"),
    actorLabel: varchar("actor_label", { length: 50 }),
    actedAsDelegate: boolean("acted_as_delegate").default(false),
    delegationId: uuid("delegation_id"),
    description: text("description").notNull(),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_fld_sys_activity_logs_event_id").on(table.eventId),
    index("idx_fld_sys_activity_logs_created").on(table.createdAt),
  ]
);
