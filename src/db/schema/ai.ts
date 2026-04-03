import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";
import { fldEvtRecords } from "./events";

// ─── AI Extraction Requests ──────────────────────────────────────────────────
export const fldAiExtractionRequests = pgTable("fld_ai_extraction_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordId: uuid("record_id")
    .notNull()
    .references(() => fldEvtRecords.id, { onDelete: "cascade" }),
  providerUsed: varchar("provider_used", { length: 30 }).notNull(),
  requestTokens: integer("request_tokens"),
  responseTokens: integer("response_tokens"),
  latencyMs: integer("latency_ms"),
  status: varchar("status", { length: 20 }).notNull(),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 6 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
