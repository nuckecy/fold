import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { fldEvtEvents, fldEvtMembers } from "./events";

// ─── Users ───────────────────────────────────────────────────────────────────
export const fldIamUsers = pgTable("fld_iam_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  passwordHash: varchar("password_hash", { length: 255 }),
  organization: varchar("organization", { length: 255 }),
  country: varchar("country", { length: 2 }),
  authMethod: varchar("auth_method", { length: 20 }),
  profileComplete: boolean("profile_complete").default(false),
  appLanguage: varchar("app_language", { length: 5 }).default("en"),
  notificationPreferences: jsonb("notification_preferences").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── NextAuth Accounts (OAuth) ───────────────────────────────────────────────
export const fldIamAccounts = pgTable("fld_iam_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => fldIamUsers.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 50 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: text("session_state"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Sessions ────────────────────────────────────────────────────────────────
export const fldIamSessions = pgTable("fld_iam_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => fldIamUsers.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Verification Tokens ─────────────────────────────────────────────────────
export const fldIamVerificationTokens = pgTable("fld_iam_verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

// ─── Delegations ─────────────────────────────────────────────────────────────
export const fldIamDelegations = pgTable("fld_iam_delegations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => fldEvtEvents.id),
  delegatedTo: uuid("delegated_to")
    .notNull()
    .references(() => fldEvtMembers.id),
  delegatedBy: uuid("delegated_by")
    .notNull()
    .references(() => fldIamUsers.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const fldIamUsersRelations = relations(fldIamUsers, ({ many }) => ({
  accounts: many(fldIamAccounts),
  sessions: many(fldIamSessions),
}));

export const fldIamAccountsRelations = relations(fldIamAccounts, ({ one }) => ({
  user: one(fldIamUsers, {
    fields: [fldIamAccounts.userId],
    references: [fldIamUsers.id],
  }),
}));

export const fldIamSessionsRelations = relations(fldIamSessions, ({ one }) => ({
  user: one(fldIamUsers, {
    fields: [fldIamSessions.userId],
    references: [fldIamUsers.id],
  }),
}));
