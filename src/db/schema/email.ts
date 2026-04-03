import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { fldEvtEvents, fldEvtRecords } from "./events";

// ─── Templates ───────────────────────────────────────────────────────────────
export const fldEmlTemplates = pgTable("fld_eml_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  isDefault: boolean("is_default").default(false),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Template Versions ───────────────────────────────────────────────────────
export const fldEmlTemplateVersions = pgTable("fld_eml_template_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => fldEmlTemplates.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 5 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 20 }).default("draft"),
  translationSource: varchar("translation_source", { length: 20 }),
  translatedFromVersionId: uuid("translated_from_version_id"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  isLocked: boolean("is_locked").default(false),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedByCountdownId: uuid("locked_by_countdown_id"),
  lockReleasedAt: timestamp("lock_released_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Sequences ───────────────────────────────────────────────────────────────
export const fldEmlSequences = pgTable("fld_eml_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => fldEmlTemplates.id),
  templateVersionSnapshotId: uuid("template_version_snapshot_id"),
  sequenceOrder: integer("sequence_order").notNull(),
  sendType: varchar("send_type", { length: 20 }).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  delayDays: integer("delay_days"),
  status: varchar("status", { length: 20 }).default("draft"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Send Logs ───────────────────────────────────────────────────────────────
export const fldEmlSendLogs = pgTable("fld_eml_send_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sequenceId: uuid("sequence_id")
    .notNull()
    .references(() => fldEmlSequences.id, { onDelete: "cascade" }),
  recordId: uuid("record_id")
    .notNull()
    .references(() => fldEvtRecords.id),
  templateVersionId: uuid("template_version_id"),
  languageSent: varchar("language_sent", { length: 5 }),
  status: varchar("status", { length: 20 }).default("queued"),
  isCatchup: boolean("is_catchup").default(false),
  queuedAt: timestamp("queued_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  bouncedAt: timestamp("bounced_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Countdowns ──────────────────────────────────────────────────────────────
export const fldEmlCountdowns = pgTable("fld_eml_countdowns", {
  id: uuid("id").primaryKey().defaultRandom(),
  sequenceId: uuid("sequence_id")
    .notNull()
    .references(() => fldEmlSequences.id, { onDelete: "cascade" }),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull(),
  scheduledSendAt: timestamp("scheduled_send_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).default("counting"),
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  pausedBy: uuid("paused_by"),
  resumedAt: timestamp("resumed_at", { withTimezone: true }),
  resetCount: integer("reset_count").default(0),
  resetReason: varchar("reset_reason", { length: 30 }),
  templateLockedAt: timestamp("template_locked_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Preflight Logs ──────────────────────────────────────────────────────────
export const fldEmlPreflightLogs = pgTable("fld_eml_preflight_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sequenceId: uuid("sequence_id")
    .notNull()
    .references(() => fldEmlSequences.id, { onDelete: "cascade" }),
  sentToUserId: uuid("sent_to_user_id").notNull(),
  userRole: varchar("user_role", { length: 20 }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
  actionTaken: varchar("action_taken", { length: 20 }),
  actionAt: timestamp("action_at", { withTimezone: true }),
  flagMessage: text("flag_message"),
  flagReviewedBy: uuid("flag_reviewed_by"),
  flagReviewedAt: timestamp("flag_reviewed_at", { withTimezone: true }),
  flagResolution: varchar("flag_resolution", { length: 20 }),
});

// ─── Unsubscribe Logs ────────────────────────────────────────────────────────
export const fldEmlUnsubscribeLogs = pgTable("fld_eml_unsubscribe_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordId: uuid("record_id")
    .notNull()
    .references(() => fldEvtRecords.id),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }).defaultNow(),
  resubscribedAt: timestamp("resubscribed_at", { withTimezone: true }),
  resubscribeToken: varchar("resubscribe_token", { length: 255 }),
  resubscribeExpiresAt: timestamp("resubscribe_expires_at", { withTimezone: true }),
  isGlobal: boolean("is_global").default(true),
});
