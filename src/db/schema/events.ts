import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Forward-declare user reference to avoid circular imports
// The actual FK is defined; relations are in iam.ts
const userRef = () => uuid("placeholder");

// ─── Events ──────────────────────────────────────────────────────────────────
export const fldEvtEvents = pgTable("fld_evt_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  date: date("date").notNull(),
  description: text("description"),
  primaryLanguage: varchar("primary_language", { length: 5 }).notNull().default("en"),
  secondaryLanguage: varchar("secondary_language", { length: 5 }),
  expectedAttendeesMin: integer("expected_attendees_min"),
  expectedAttendeesMax: integer("expected_attendees_max"),
  status: varchar("status", { length: 20 }).default("active"),
  duplicatedFrom: uuid("duplicated_from"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Field Schemas ───────────────────────────────────────────────────────────
export const fldEvtFieldSchemas = pgTable("fld_evt_field_schemas", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  fieldLabels: jsonb("field_labels").default({}),
  fieldType: varchar("field_type", { length: 20 }).notNull(),
  fieldOptions: jsonb("field_options"),
  isRequired: boolean("is_required").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Records ─────────────────────────────────────────────────────────────────
export const fldEvtRecords = pgTable("fld_evt_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  captureMethod: varchar("capture_method", { length: 20 }).notNull(),
  sourceDetail: varchar("source_detail", { length: 50 }),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).default("captured"),
  defectiveReasons: jsonb("defective_reasons").default([]),
  formLanguage: varchar("form_language", { length: 5 }),
  contentLanguage: varchar("content_language", { length: 5 }),
  emailOptOut: boolean("email_opt_out").default(false),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
  optOutSource: varchar("opt_out_source", { length: 30 }),
  deviceFingerprint: varchar("device_fingerprint", { length: 64 }),
  ipHash: varchar("ip_hash", { length: 64 }),
  mergeLog: jsonb("merge_log"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Field Values ────────────────────────────────────────────────────────────
export const fldEvtFieldValues = pgTable("fld_evt_field_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordId: uuid("record_id")
    .notNull()
    .references(() => fldEvtRecords.id, { onDelete: "cascade" }),
  fieldSchemaId: uuid("field_schema_id")
    .notNull()
    .references(() => fldEvtFieldSchemas.id),
  extractedValue: text("extracted_value"),
  translatedValue: text("translated_value"),
  confidence: varchar("confidence", { length: 10 }),
  manuallyEdited: boolean("manually_edited").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Form Settings ───────────────────────────────────────────────────────────
export const fldEvtFormSettings = pgTable("fld_evt_form_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .unique()
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").default(true),
  shortCode: varchar("short_code", { length: 10 }).unique().notNull(),
  formLanguage: varchar("form_language", { length: 10 }).default("auto"),
  welcomeMessage: text("welcome_message"),
  confirmationMessage: text("confirmation_message"),
  showDataProtection: boolean("show_data_protection").default(true),
  dataProtectionText: text("data_protection_text"),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  isManuallyClosed: boolean("is_manually_closed").default(false),
  allowMultipleSubmissions: boolean("allow_multiple_submissions").default(false),
  progressiveDisclosure: varchar("progressive_disclosure", { length: 10 }).default("auto"),
  sourceScanImages: jsonb("source_scan_images").default({}),
  supportedLanguages: jsonb("supported_languages").default(["en"]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Event Members ───────────────────────────────────────────────────────────
export const fldEvtMembers = pgTable("fld_evt_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  userId: uuid("user_id"),
  scannerEmail: varchar("scanner_email", { length: 255 }),
  role: varchar("role", { length: 20 }).notNull(),
  invitedBy: uuid("invited_by"),
  invitationMethod: varchar("invitation_method", { length: 10 }),
  accessCode: varchar("access_code", { length: 10 }),
  status: varchar("status", { length: 20 }).default("pending"),
  promotedAt: timestamp("promoted_at", { withTimezone: true }),
  promotedBy: uuid("promoted_by"),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  sessionToken: varchar("session_token", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Member Permissions ──────────────────────────────────────────────────────
export const fldEvtMemberPermissions = pgTable(
  "fld_evt_member_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => fldEvtMembers.id, { onDelete: "cascade" }),
    permissionKey: varchar("permission_key", { length: 50 }).notNull(),
    isGranted: boolean("is_granted").notNull(),
    grantedBy: uuid("granted_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.memberId, table.permissionKey)]
);

// ─── Invitations ─────────────────────────────────────────────────────────────
export const fldEvtInvitations = pgTable("fld_evt_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  invitedEmail: varchar("invited_email", { length: 255 }),
  accessCode: varchar("access_code", { length: 10 }).unique(),
  invitationMethod: varchar("invitation_method", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Household Groups ────────────────────────────────────────────────────────
export const fldEvtHouseholdGroups = pgTable("fld_evt_household_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  sharedEmail: varchar("shared_email", { length: 255 }).notNull(),
  emailHandling: varchar("email_handling", { length: 20 }).default("combined"),
  primaryRecordId: uuid("primary_record_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Household Members ───────────────────────────────────────────────────────
export const fldEvtHouseholdMembers = pgTable("fld_evt_household_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => fldEvtHouseholdGroups.id, { onDelete: "cascade" }),
  recordId: uuid("record_id")
    .notNull()
    .references(() => fldEvtRecords.id, { onDelete: "cascade" }),
});

// ─── Form Access Logs ────────────────────────────────────────────────────────
export const fldEvtFormAccessLogs = pgTable("fld_evt_form_access_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  formSettingsId: uuid("form_settings_id")
    .notNull()
    .references(() => fldEvtFormSettings.id, { onDelete: "cascade" }),
  accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow(),
  converted: boolean("converted").default(false),
  source: varchar("source", { length: 20 }),
  deviceType: varchar("device_type", { length: 20 }),
});

// ─── Submission Throttles ────────────────────────────────────────────────────
export const fldEvtSubmissionThrottles = pgTable("fld_evt_submission_throttles", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  ipHash: varchar("ip_hash", { length: 64 }).notNull(),
  deviceHash: varchar("device_hash", { length: 64 }),
  submissionCount: integer("submission_count").default(0),
  lastSubmissionAt: timestamp("last_submission_at", { withTimezone: true }),
  isBlocked: boolean("is_blocked").default(false),
});

// ─── Record Edit Logs ────────────────────────────────────────────────────────
export const fldEvtRecordEditLogs = pgTable("fld_evt_record_edit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordId: uuid("record_id")
    .notNull()
    .references(() => fldEvtRecords.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  editedBy: uuid("edited_by"),
  emailsAlreadySent: jsonb("emails_already_sent").default([]),
  editedAt: timestamp("edited_at", { withTimezone: true }).defaultNow(),
});

// ─── Field Label Changes ─────────────────────────────────────────────────────
export const fldEvtFieldLabelChanges = pgTable("fld_evt_field_label_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id, { onDelete: "cascade" }),
  fieldSchemaId: uuid("field_schema_id")
    .notNull()
    .references(() => fldEvtFieldSchemas.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 5 }).notNull(),
  oldLabel: varchar("old_label", { length: 255 }),
  newLabel: varchar("new_label", { length: 255 }),
  changeSource: varchar("change_source", { length: 30 }),
  userInstructionText: text("user_instruction_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const fldEvtEventsRelations = relations(fldEvtEvents, ({ many, one }) => ({
  fieldSchemas: many(fldEvtFieldSchemas),
  records: many(fldEvtRecords),
  members: many(fldEvtMembers),
  formSettings: one(fldEvtFormSettings),
}));

export const fldEvtFieldSchemasRelations = relations(fldEvtFieldSchemas, ({ one, many }) => ({
  event: one(fldEvtEvents, {
    fields: [fldEvtFieldSchemas.eventId],
    references: [fldEvtEvents.id],
  }),
  fieldValues: many(fldEvtFieldValues),
}));

export const fldEvtRecordsRelations = relations(fldEvtRecords, ({ one, many }) => ({
  event: one(fldEvtEvents, {
    fields: [fldEvtRecords.eventId],
    references: [fldEvtEvents.id],
  }),
  fieldValues: many(fldEvtFieldValues),
}));

export const fldEvtFieldValuesRelations = relations(fldEvtFieldValues, ({ one }) => ({
  record: one(fldEvtRecords, {
    fields: [fldEvtFieldValues.recordId],
    references: [fldEvtRecords.id],
  }),
  fieldSchema: one(fldEvtFieldSchemas, {
    fields: [fldEvtFieldValues.fieldSchemaId],
    references: [fldEvtFieldSchemas.id],
  }),
}));

export const fldEvtMembersRelations = relations(fldEvtMembers, ({ one, many }) => ({
  event: one(fldEvtEvents, {
    fields: [fldEvtMembers.eventId],
    references: [fldEvtEvents.id],
  }),
  permissions: many(fldEvtMemberPermissions),
}));

export const fldEvtFormSettingsRelations = relations(fldEvtFormSettings, ({ one }) => ({
  event: one(fldEvtEvents, {
    fields: [fldEvtFormSettings.eventId],
    references: [fldEvtEvents.id],
  }),
}));
