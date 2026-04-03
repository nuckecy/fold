import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { fldEvtEvents } from "./events";

// ─── Processing Jobs ─────────────────────────────────────────────────────────
export const fldJobProcessing = pgTable("fld_job_processing", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  totalRecords: integer("total_records").notNull(),
  processedCount: integer("processed_count").default(0),
  flaggedCount: integer("flagged_count").default(0),
  failedCount: integer("failed_count").default(0),
  status: varchar("status", { length: 20 }).default("queued"),
  estimatedCompletionAt: timestamp("estimated_completion_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notificationEmail: varchar("notification_email", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
