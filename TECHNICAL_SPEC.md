# Fold - Technical Specification v1.0

**Document type:** Technical Specification
**Version:** 1.0
**Date:** April 3, 2026
**Status:** Draft for review

---

## 1. Product Overview

Fold is an event-based document intelligence and follow-up platform. It captures attendee information from physical registration cards (via AI-powered scanning) and digital form submissions, processes and validates the data, manages structured email follow-up sequences, and provides reporting across the entire lifecycle.

The primary use case is church event management: capturing new convert cards, visitor registration forms, and similar documents at services and events, then running personalized, multilingual email follow-up campaigns to those individuals.

### 1.1 Core Value Proposition

- Scan physical forms and extract structured data using AI vision
- Accept digital submissions via QR code and short URL
- Validate, deduplicate, and clean captured records
- Run scheduled, multilingual email sequences with catch-up logic for late additions
- Provide full GDPR compliance for personal data handling in the EU

### 1.2 Design Principles

- **Capture fast, process later.** Scanning at events must be instant. AI extraction and validation happen in the background after scanning is complete.
- **Digital data is the source of truth.** When both a scan and a digital submission exist for the same person, the digital record (typed by the person themselves) takes precedence.
- **No email is rushed.** Every email send has a mandatory 1-hour review countdown. No bypass.
- **Security is built in, not bolted on.** All 17 OWASP vulnerability categories are scoped into the architecture from day one.
- **Progressive disclosure everywhere.** Setup flows, forms, and dashboards reveal complexity only when needed.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Hosting | Hetzner VPS + Coolify | Self-hosted deployment and container orchestration |
| Framework | Next.js 14+ (App Router) | Full-stack React framework with SSR/SSG |
| Language | TypeScript | Type safety across frontend and backend |
| Database | PostgreSQL (via Coolify) | Primary data store |
| ORM | Drizzle ORM | Type-safe SQL, lightweight, good migration tooling |
| Cache/Queue | Redis + BullMQ (via Coolify) | Background job queue and real-time pub/sub |
| AI Primary | Gemini 2.0 Flash | Vision-based document extraction (free tier) |
| AI Fallback | Claude API (Sonnet) | Fallback extraction provider (paid, higher quality) |
| Translation | DeepL API | Form label and email template translation (free tier) |
| Email | Resend | Transactional and sequence email delivery (free tier) |
| Auth | NextAuth.js v5 | Email/password + Google OAuth authentication |
| Real-time | WebSocket (native) | Live scan counter sync for collaborative scanning |
| CAPTCHA | Cloudflare Turnstile | Bot protection on public forms (free) |
| Rich Text | TipTap | Email template editor with merge field support |
| Storage | Local disk on VPS | Scanned card image storage |

### 2.1 Why These Choices

**Drizzle over Prisma:** Lighter runtime, SQL-like syntax, better for custom table prefixes (`fld_*`). Prisma adds a query engine binary that increases deployment size unnecessarily.

**BullMQ over Inngest:** Self-hosted on the same VPS via Redis. No external dependency, no free tier limits, full control over job scheduling, retries, and concurrency.

**Resend over SendGrid/Mailgun:** Clean API, native Next.js integration, free tier covers testing (100 emails/day). Simple upgrade path when volume grows.

**Gemini Flash over Claude for primary extraction:** Free tier with 15 requests per minute. At zero cost, it handles testing and low-volume production. Claude API serves as the quality fallback when Gemini fails or returns low-confidence results.

---

## 3. Database Schema

All tables use the `fld_` prefix (Fold). Domain prefixes group related tables:

- `fld_iam_` - Identity and access management
- `fld_evt_` - Event domain
- `fld_eml_` - Email domain
- `fld_ai_` - AI processing
- `fld_job_` - Background jobs
- `fld_sys_` - System-level

All primary keys are UUID v4 (random, non-enumerable). All timestamps are stored in UTC. Sensitive PII columns (name, email, phone, address) are encrypted at application level.

### 3.1 Identity and Access Management

```sql
-- User accounts
CREATE TABLE fld_iam_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,           -- encrypted
  password_hash VARCHAR(255),            -- nullable (Google OAuth users)
  organization VARCHAR(255) NOT NULL,
  country VARCHAR(2) NOT NULL,           -- ISO 3166-1 alpha-2
  auth_method VARCHAR(20) NOT NULL,      -- 'email_password' | 'google'
  profile_complete BOOLEAN DEFAULT false,
  app_language VARCHAR(5) DEFAULT 'en',  -- ISO 639-1
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin delegation
CREATE TABLE fld_iam_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  delegated_to UUID NOT NULL REFERENCES fld_evt_members(id),
  delegated_by UUID NOT NULL REFERENCES fld_iam_users(id),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'active' | 'expired' | 'revoked'
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Event Domain

```sql
-- Events
CREATE TABLE fld_evt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES fld_iam_users(id),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  primary_language VARCHAR(5) NOT NULL DEFAULT 'en',
  secondary_language VARCHAR(5),
  expected_attendees_min INTEGER,
  expected_attendees_max INTEGER,
  status VARCHAR(20) DEFAULT 'active',   -- 'active' | 'closed' | 'archived' | 'deleted'
  duplicated_from UUID REFERENCES fld_evt_events(id),
  closed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event field schema (user-defined capture fields)
CREATE TABLE fld_evt_field_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  field_name VARCHAR(100) NOT NULL,       -- canonical: "Full Name"
  field_labels JSONB DEFAULT '{}',        -- {"en": "Name", "de": "Name"}
  field_type VARCHAR(20) NOT NULL,        -- 'text' | 'email' | 'phone' | 'date' | 'textarea' | 'checkbox' | 'radio' | 'select'
  field_options JSONB,                    -- for checkbox/radio/select: [{"en": "Option A", "de": "Option A DE"}]
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event records (scanned + digital submissions)
CREATE TABLE fld_evt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  capture_method VARCHAR(20) NOT NULL,    -- 'scan' | 'digital' | 'merged'
  source_detail VARCHAR(50),              -- 'camera_user1' | 'batch_upload' | 'qr_form' | 'short_url' | 'scan+digital'
  image_url TEXT,                         -- nullable, only for scans
  status VARCHAR(20) DEFAULT 'captured',  -- 'captured' | 'processing' | 'reviewed' | 'defective' | 'resolved'
  defective_reasons JSONB DEFAULT '[]',   -- ['email_missing', 'name_low_confidence', ...]
  form_language VARCHAR(5),               -- detected from printed labels
  content_language VARCHAR(5),            -- detected from handwritten/typed content
  email_opt_out BOOLEAN DEFAULT false,
  opted_out_at TIMESTAMPTZ,
  opt_out_source VARCHAR(30),             -- 'unsubscribe_link' | 'manual' | 'admin_removed'
  device_fingerprint VARCHAR(64),         -- hashed, for digital submissions
  ip_hash VARCHAR(64),                    -- hashed, for rate limiting
  merge_log JSONB,                        -- if merged: {scanned_id, digital_id, field_winners}
  submitted_at TIMESTAMPTZ,              -- for digital: when attendee submitted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Extracted field values per record
CREATE TABLE fld_evt_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES fld_evt_records(id),
  field_schema_id UUID NOT NULL REFERENCES fld_evt_field_schemas(id),
  extracted_value TEXT,                    -- encrypted for PII fields
  translated_value TEXT,                   -- optional: auto-translated to event language
  confidence VARCHAR(10),                  -- 'high' | 'medium' | 'low' (null for digital)
  manually_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Digital form settings
CREATE TABLE fld_evt_form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID UNIQUE NOT NULL REFERENCES fld_evt_events(id),
  is_enabled BOOLEAN DEFAULT true,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  form_language VARCHAR(10) DEFAULT 'auto',  -- 'en' | 'de' | 'auto'
  welcome_message TEXT,
  confirmation_message TEXT,
  show_data_protection BOOLEAN DEFAULT true,
  data_protection_text TEXT,
  closes_at TIMESTAMPTZ,                     -- nullable, open forever by default
  is_manually_closed BOOLEAN DEFAULT false,
  allow_multiple_submissions BOOLEAN DEFAULT false,
  progressive_disclosure VARCHAR(10) DEFAULT 'auto', -- 'auto' | 'always' | 'never'
  source_scan_images JSONB DEFAULT '{}',     -- {"en": "image_ref", "de": "image_ref"}
  supported_languages JSONB DEFAULT '["en"]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event team members
CREATE TABLE fld_evt_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  user_id UUID REFERENCES fld_iam_users(id),  -- nullable for QR-joined scanners
  scanner_email VARCHAR(255),                  -- for non-registered QR joiners
  role VARCHAR(20) NOT NULL,                   -- 'admin' | 'sub_admin' | 'scanner'
  invited_by UUID REFERENCES fld_iam_users(id),
  invitation_method VARCHAR(10),               -- 'creator' | 'email' | 'qr'
  access_code VARCHAR(10),                     -- for email invitations
  status VARCHAR(20) DEFAULT 'pending',        -- 'pending' | 'active' | 'revoked' | 'expired'
  promoted_at TIMESTAMPTZ,
  promoted_by UUID REFERENCES fld_iam_users(id),
  joined_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  session_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-member permissions (Sub-Admin customization)
CREATE TABLE fld_evt_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES fld_evt_members(id),
  permission_key VARCHAR(50) NOT NULL,
  is_granted BOOLEAN NOT NULL,
  granted_by UUID REFERENCES fld_iam_users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, permission_key)
);

-- Scanner invitations
CREATE TABLE fld_evt_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  invited_email VARCHAR(255),
  access_code VARCHAR(10) UNIQUE,
  invitation_method VARCHAR(10) NOT NULL,      -- 'qr' | 'email'
  status VARCHAR(20) DEFAULT 'pending',
  joined_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Household groups (shared email handling)
CREATE TABLE fld_evt_household_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  shared_email VARCHAR(255) NOT NULL,
  email_handling VARCHAR(20) DEFAULT 'combined', -- 'combined' | 'separate' | 'primary_only'
  primary_record_id UUID REFERENCES fld_evt_records(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Household group members
CREATE TABLE fld_evt_household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES fld_evt_household_groups(id),
  record_id UUID NOT NULL REFERENCES fld_evt_records(id)
);

-- Form access tracking
CREATE TABLE fld_evt_form_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_settings_id UUID NOT NULL REFERENCES fld_evt_form_settings(id),
  accessed_at TIMESTAMPTZ DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  source VARCHAR(20),                          -- 'qr' | 'direct_url' | 'referral'
  device_type VARCHAR(20)                      -- 'mobile' | 'desktop'
);

-- Form submission throttling
CREATE TABLE fld_evt_submission_throttles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  ip_hash VARCHAR(64) NOT NULL,
  device_hash VARCHAR(64),
  submission_count INTEGER DEFAULT 0,
  last_submission_at TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT false
);

-- Record edit history
CREATE TABLE fld_evt_record_edit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES fld_evt_records(id),
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  edited_by UUID REFERENCES fld_iam_users(id),
  emails_already_sent JSONB DEFAULT '[]',
  edited_at TIMESTAMPTZ DEFAULT now()
);

-- Field label translation change history
CREATE TABLE fld_evt_field_label_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  field_schema_id UUID NOT NULL REFERENCES fld_evt_field_schemas(id),
  language VARCHAR(5) NOT NULL,
  old_label VARCHAR(255),
  new_label VARCHAR(255),
  change_source VARCHAR(30),                   -- 'user_instruction' | 'manual'
  user_instruction_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Email Domain

```sql
-- Email templates
CREATE TABLE fld_eml_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES fld_iam_users(id),  -- null for system defaults
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email template language versions
CREATE TABLE fld_eml_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES fld_eml_templates(id),
  language VARCHAR(5) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',          -- 'draft' | 'active' | 'auto_translated' | 'auto_reviewed'
  translation_source VARCHAR(20),              -- 'manual' | 'auto_deepl' | 'auto_reviewed'
  translated_from_version_id UUID REFERENCES fld_eml_template_versions(id),
  reviewed_at TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by_countdown_id UUID,
  lock_released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email sequences per event
CREATE TABLE fld_eml_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  template_id UUID NOT NULL REFERENCES fld_eml_templates(id),
  template_version_snapshot_id UUID REFERENCES fld_eml_template_versions(id),
  sequence_order INTEGER NOT NULL,
  send_type VARCHAR(20) NOT NULL,              -- 'immediate' | 'scheduled' | 'relative_delay'
  scheduled_at TIMESTAMPTZ,
  delay_days INTEGER,
  status VARCHAR(20) DEFAULT 'draft',          -- 'draft' | 'confirmed' | 'scheduled' | 'sending' | 'sent' | 'partially_sent'
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email send log (per record per email)
CREATE TABLE fld_eml_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES fld_eml_sequences(id),
  record_id UUID NOT NULL REFERENCES fld_evt_records(id),
  template_version_id UUID REFERENCES fld_eml_template_versions(id),
  language_sent VARCHAR(5),
  status VARCHAR(20) DEFAULT 'queued',         -- 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'skipped' | 'blocked_opt_out'
  is_catchup BOOLEAN DEFAULT false,
  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  provider_message_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email send countdown
CREATE TABLE fld_eml_countdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES fld_eml_sequences(id),
  triggered_at TIMESTAMPTZ NOT NULL,
  scheduled_send_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'counting',       -- 'counting' | 'paused' | 'cancelled' | 'completed'
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES fld_iam_users(id),
  resumed_at TIMESTAMPTZ,
  reset_count INTEGER DEFAULT 0,
  reset_reason VARCHAR(30),
  template_locked_at TIMESTAMPTZ,              -- T-5 minutes
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-flight email logs
CREATE TABLE fld_eml_preflight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES fld_eml_sequences(id),
  sent_to_user_id UUID NOT NULL REFERENCES fld_iam_users(id),
  user_role VARCHAR(20) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  action_taken VARCHAR(20),                    -- 'approved' | 'paused' | 'flagged' | 'no_action'
  action_at TIMESTAMPTZ,
  flag_message TEXT,
  flag_reviewed_by UUID REFERENCES fld_iam_users(id),
  flag_reviewed_at TIMESTAMPTZ,
  flag_resolution VARCHAR(20)                  -- 'acknowledged' | 'dismissed' | 'led_to_pause'
);

-- Unsubscribe tracking
CREATE TABLE fld_eml_unsubscribe_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES fld_evt_records(id),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  unsubscribed_at TIMESTAMPTZ DEFAULT now(),
  resubscribed_at TIMESTAMPTZ,
  resubscribe_token VARCHAR(255),
  resubscribe_expires_at TIMESTAMPTZ,
  is_global BOOLEAN DEFAULT true
);
```

### 3.4 AI Processing

```sql
-- AI extraction request log
CREATE TABLE fld_ai_extraction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES fld_evt_records(id),
  provider_used VARCHAR(30) NOT NULL,          -- 'gemini-2.0-flash' | 'claude-sonnet'
  request_tokens INTEGER,
  response_tokens INTEGER,
  latency_ms INTEGER,
  status VARCHAR(20) NOT NULL,                 -- 'success' | 'failed' | 'fallback_triggered'
  cost_estimate DECIMAL(10, 6),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Background Jobs

```sql
-- Processing job tracking
CREATE TABLE fld_job_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fld_evt_events(id),
  total_records INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  flagged_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'queued',         -- 'queued' | 'processing' | 'completed' | 'failed'
  estimated_completion_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notification_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.6 System

```sql
-- Activity log (audit trail)
CREATE TABLE fld_sys_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES fld_evt_events(id),
  action_type VARCHAR(50) NOT NULL,
  actor_user_id UUID REFERENCES fld_iam_users(id),
  actor_label VARCHAR(50),                     -- 'system' | user name | 'scanner_session_xyz'
  acted_as_delegate BOOLEAN DEFAULT false,
  delegation_id UUID REFERENCES fld_iam_delegations(id),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.7 Database Security Configuration

```sql
-- Application user: LEAST PRIVILEGE
CREATE ROLE fld_app_user WITH LOGIN PASSWORD '${FLD_DB_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fld_app_user;
REVOKE DROP, ALTER, CREATE ON SCHEMA public FROM fld_app_user;

-- Migration user: SCHEMA MODIFICATION
CREATE ROLE fld_migration_user WITH LOGIN PASSWORD '${FLD_MIGRATION_PASSWORD}';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fld_migration_user;

-- Never use postgres superuser for the application
```

### 3.8 Indexes

```sql
-- High-frequency lookups
CREATE INDEX idx_fld_evt_records_event_id ON fld_evt_records(event_id);
CREATE INDEX idx_fld_evt_records_status ON fld_evt_records(status);
CREATE INDEX idx_fld_evt_records_email_opt_out ON fld_evt_records(email_opt_out);
CREATE INDEX idx_fld_evt_field_values_record_id ON fld_evt_field_values(record_id);
CREATE INDEX idx_fld_evt_members_event_id ON fld_evt_members(event_id);
CREATE INDEX idx_fld_evt_members_user_id ON fld_evt_members(user_id);
CREATE INDEX idx_fld_eml_send_logs_sequence_id ON fld_eml_send_logs(sequence_id);
CREATE INDEX idx_fld_eml_send_logs_record_id ON fld_eml_send_logs(record_id);
CREATE INDEX idx_fld_eml_send_logs_status ON fld_eml_send_logs(status);
CREATE INDEX idx_fld_sys_activity_logs_event_id ON fld_sys_activity_logs(event_id);
CREATE INDEX idx_fld_sys_activity_logs_created ON fld_sys_activity_logs(created_at);
CREATE INDEX idx_fld_evt_form_settings_short_code ON fld_evt_form_settings(short_code);

-- GDPR person search (cross-event email lookup)
-- This requires a functional index on decrypted email, implemented at application level
-- The app decrypts and searches, not the database directly
```

---

## 4. Feature Specifications

### Domain A: User Authentication and Account Management

**A1. Email/password registration**
Users register with full name, email, organization, country, and password. All fields are required. Password is hashed with bcrypt (cost factor 12+). Email verification via magic link before account is activated.

**A2. Google OAuth with profile completion gate**
Google sign-up pre-fills name and email. User is redirected to a mandatory profile completion screen to provide organization and country. The `profile_complete` flag remains false until submitted. All routes except the completion screen are blocked when `profile_complete = false`.

**A3. Passwordless login via magic link**
Users can request a magic link sent to their registered email as an alternative to password login. Link expires after 15 minutes and is single-use.

**A4. Session management**
Sessions last 7 days with sliding expiry (refresh on activity). Sessions are stored server-side (not JWT-only) to allow immediate invalidation on role changes, password changes, or security events.

**A5. App language preference**
Each user sets their preferred UI language (English or German for v1). This controls navigation labels, system messages, button text, and error messages. Stored as ISO 639-1 code.

**A6. Notification preferences**
Users configure which notifications they receive: email on processing complete, email on new submission to old event, email on unsubscribe, pre-flight test emails. Stored as JSONB for flexible expansion.

---

### Domain B: Event Management

**B1. Create event**
Title, date, and description. The date is the primary event date (when it takes place). Title is freeform text. Description is optional but recommended.

**B2. Expected attendee range**
Min and max integer values. These drive monitoring thresholds for the digital form: rate limiting is calculated as `max × 0.5` per minute, alert at `2× max`, soft-pause at `5× max`. Adjustable mid-event.

**B3. Event language configuration**
Primary language is required (ISO 639-1). Secondary language is optional. If "Both" is selected during setup, both primary and secondary are stored. This determines: report output language, default email template version, and digital form default language.

**B4. Event lifecycle**
Four statuses with one-way transitions: `active → closed → archived → deleted`. Closing stops new scanning sessions but allows scheduled emails to continue. Archiving makes the event read-only. Deletion is irreversible and cascades to all records, images, extraction logs, and email logs. Deletion requires typing the event name for confirmation.

**B5. Duplicate event**
Copies structure only: field schemas, form settings, email templates, and form configuration. Does not copy records, images, email send history, scanner invitations, or team members (except the Admin). New event gets new UUIDs for everything. The `duplicated_from` field references the source event.

**B6. Duplication audit log**
Every duplication is logged in `fld_sys_activity_logs` with `action_type: "event_duplicated"` and metadata containing the source event ID, title, date, copied field count, and copied template count.

**B7. Activity timeline**
Every significant action within an event is logged: scans added, processing started/completed, records resolved, emails sent/paused/resumed, team changes, delegations, form submissions, unsubscribes. Displayed as a chronological timeline on the event dashboard.

**B8. Event isolation**
Every event is a fully isolated entity with its own UUID. No cross-event data access in normal operation. The only exception is the GDPR person search (Admin-only), which searches by email across all events owned by that Admin. Database queries always include `event_id` in WHERE clauses.

---

### Domain C: Field Configuration

**C1. Scan blank form to auto-detect fields**
The owner photographs an empty/blank form. The image is sent to the AI extraction provider with a prompt: "This is a blank form. Identify all field labels, their likely data types, and any checkbox/radio options." The AI returns structured JSON with field names, types, and options.

**C2. Multi-language form detection loop**
After the first blank form is scanned and fields are confirmed, the system asks: "Is this form available in other languages?" If yes, the user selects the language and the system generates translations (see C3). The loop continues until the user confirms all languages are covered. Each language version stores the actual printed labels in `fld_evt_field_schemas.field_labels`.

**C3. Translation-based label generation**
Instead of scanning a second blank form, the system sends detected English labels to the DeepL API for translation into the selected language. The translated labels are presented for review. The user can approve or request changes (see C4).

**C4. AI-powered label edit cycle**
If the user has corrections to the translated labels, they type natural language instructions (e.g., "Change 'Adresse' to 'Anschrift'"). The AI processes the instruction against the current label set and returns only modified fields. The updated preview shows a change marker on edited items. The cycle repeats until the user confirms.

**C5. Label change history**
Every label modification is stored in `fld_evt_field_label_changes` with the old label, new label, change source ("user_instruction" or "manual"), and the raw instruction text. This allows reverting to previous versions.

**C6. Manual field selection**
Alternative to scanning: the owner picks fields from a pre-built library. The library contains common fields with built-in canonical names and AI extraction aliases: Full Name, Email, Phone, Address, Date. Each library field has sensible defaults for type and required status.

**C7. Custom field creation**
For fields not in the library, the owner types a label and selects a field type. The system suggests a type based on the label (e.g., "Email" suggests email type, "Comments" suggests textarea).

**C8. Canonical names with per-language labels**
Each field has one canonical name (used internally for merge fields, deduplication, and reporting) and multiple language-specific labels (used for AI extraction prompts and digital form rendering). The `field_labels` JSONB column stores `{"en": "Full Name", "de": "Vollständiger Name"}`.

**C9. Required/optional marking**
Each field is marked required or optional. Required fields are enforced on digital form submissions (client-side validation + server-side check). For scanned records, missing required fields trigger the `defective` status with the appropriate reason code.

**C10. Drag-to-reorder**
Fields have a `sort_order` integer. The setup UI supports drag-and-drop reordering. Sort order determines: display order on the digital form, order of fields in the review UI, and column order in CSV exports.

**C11. Auto field type detection by option count**
When a user creates a choice-based field and adds options: 2 to 4 options render as radio buttons, 5 to 10 options render as a dropdown, 10+ options render as a searchable dropdown. The switch is automatic based on option count. The field type in the database remains the semantic type ("radio", "select", "searchable_select"), but the rendering adapts.

---

### Domain D: Physical Card Scanning

**D1. Camera capture with alignment guide**
The camera viewfinder displays a semi-transparent overlay frame sized to a standard card/form. The user positions the card within the frame and taps to capture. The frame helps with consistent framing and reduces cropping issues.

**D2. Pre-capture quality check**
After capture, a quick client-side analysis checks brightness (not too dark), blur (not out of focus), and content presence (does the image contain text-like content). If any check fails, the user is prompted: "This photo looks [blurry/dark/empty]. Would you like to retake it?" The user can accept or retake.

**D3. Upload from gallery (single)**
For cases where the camera is not available or the photo was taken with a different device. The user selects a single image from their device gallery. Same pipeline as camera capture.

**D4. Batch upload from gallery**
Select multiple images at once. Before processing, a thumbnail grid displays all selected images with an "×" button on each for removal. The user reviews and confirms before the batch enters the processing queue. Each image becomes one `fld_evt_records` entry with `source_detail: 'batch_upload'`.

**D5. Each upload treated as unique scan**
Every image, whether from camera or batch upload, creates a separate record in `fld_evt_records`. No image produces multiple records. No multiple images merge into one record. One image = one record, always.

**D6. Offline resilience**
Captured images are saved to browser IndexedDB immediately on capture. An upload queue runs in the background. If the device is offline, images accumulate locally and sync automatically when connectivity returns. The scan counter reflects both uploaded and locally queued scans. The UI shows: "3 scans saved locally, waiting for connection."

**D7. Card count prompt**
Before scanning begins: "How many cards do you have?" (optional, skip allowed). The count serves as a progress indicator ("12 of 30 scanned") and a completion check ("You said 30 but only 27 were scanned. Continue or proceed?"). Not a hard lock.

**D8. Live scan counter**
A persistent counter visible during scanning shows: scans completed, expected total (if card count was entered), and scans by other active scanners (for collaborative sessions). Updates in real-time via WebSocket.

**D9. Camera permission fallback**
If the user denies camera access or the device has no camera, the UI shows instructions to enable camera in settings, plus the upload-from-gallery option as an alternative.

**D10. Scan-to-verify**
After scanning is complete (or at any time), the user can re-scan a card. Instead of creating a new record, the system extracts the name/email and searches against existing records in the event. Results: "This person is already captured" (with record details) or "No match found. Add as new record?"

---

### Domain E: Collaborative Scanning

**E1. QR code for scanner invitation**
The Admin generates a QR code from the event dashboard. The QR encodes a URL pointing to the scanner join page for that specific event. QR is downloadable as PNG and SVG.

**E2. QR join requires email**
When a person scans the QR code, they land on a minimal join page showing the event title and host name. They enter their email address to join. The email serves as their identifier in the activity log and enables promotion to Sub-Admin later if needed.

**E3. Email invitation with unique code**
The Admin enters an email address in the team management UI. The system sends an invitation email containing a unique 6-character access code (alphanumeric, hyphenated for readability, e.g., "XK7-M92") and a direct link to the join page.

**E4. Code entry join**
Email-invited users land on the join page and enter only their access code (no email re-entry). The code is validated server-side, single-use, and time-bound (expires after 48 hours or when the event scanning session closes, whichever is first).

**E5. Real-time scan counter sync**
All active scanners (Admin + all joined scanners) see the same live count via WebSocket. When any scanner captures an image, the counter increments for everyone within 1 to 2 seconds. The counter shows: total scans (all scanners combined) and optional breakdown by scanner.

**E6. Session expiry on scanning close**
When the Admin clicks "Done scanning" or closes the scanning session, all scanner sessions are terminated. Active scanners see: "Scanning session has ended. Thank you for your help." Their locally queued scans continue to upload in the background.

**E7. Inactivity timeout**
Scanner sessions automatically expire after 4 hours of inactivity (no scans, no page interaction). This prevents orphaned sessions from consuming resources.

**E8. Scanner access scope**
Scanners see only: the camera viewfinder, the live scan counter, and a "Done" button. They cannot view records, settings, reports, templates, or other team members. Their session token is scoped to capture-only API endpoints.

---

### Domain F: Digital Form Capture

**F1. QR code generation**
Generated server-side using a Node.js QR library. Encodes the full URL: `https://{domain}/f/{short_code}`. Downloadable as PNG (for screen display, flyers) and SVG (for high-resolution print). The event title is included as a label below the QR image.

**F2. Short URL generation**
6-character alphanumeric code, collision-checked against existing codes on generation. Resolves to the full form page. Example: `https://foldapp.com/f/a3x9k2`.

**F3. Forms live forever**
Forms remain open indefinitely until the Admin manually closes them. There is no default `closes_at` value. The `is_manually_closed` boolean is the only way to deactivate a form. This ensures that someone who watches a recorded program months later can still submit.

**F4. Late submission notification**
When a digital submission arrives for an event that was created more than 30 days ago, the Admin receives a notification email: "New submission received for [Event Title] (created X months ago). [Name] submitted via the online form. [View record] [Manage event]."

**F5. Form language**
Three options: English, German, or Auto. "Auto" detects the attendee's browser `Accept-Language` header and renders labels in the matching language. If no matching language version exists, falls back to the event's primary language. The attendee can manually toggle the language on the form.

**F6. Progressive disclosure**
If the form has more than 4 fields or the estimated form height exceeds the mobile viewport, the form is automatically split into steps. Fields are grouped: Step 1 contains identity fields (name, email, phone, address), Step 2+ contains event-specific fields. The data protection consent checkbox always appears on the final step. A progress indicator (dots or "Step 1 of 2") shows the attendee's position.

**F7-F8. Step grouping**
Step 1: identity fields. Step 2+: event-specific fields and consent. Maximum 4 fields per step. On desktop, if the viewport fits all fields, the form renders as a single page (progressive disclosure only activates when needed).

**F9. Desktop single-page rendering**
On desktop viewports where all fields fit comfortably, the form renders as a single scrollable page. The step splitting is a mobile optimization, not a universal requirement.

**F10. Form fields from scanned labels**
The digital form renders field labels using the actual labels detected from the scanned blank form (`field_labels` in the schema), not generic translations. A German attendee sees "Gebetsanliegen" (what their church actually printed) rather than a system-generated alternative.

**F11. Real-time field validation**
Email format validated on blur (not just on submit). Required fields show inline error messages when left empty. Phone fields validate format with country code. All validation runs client-side for instant feedback and server-side on submission for security.

**F12. Data protection consent**
A checkbox with the data protection statement text (pre-filled with the RCCG standard statement, editable by Admin). The form cannot be submitted without checking this box. Consent timestamp is stored with the record.

**F13. Customizable messages**
The Admin configures: a welcome message (displayed above the form), and a confirmation message (displayed after submission). Both support rich text and can include links.

**F14. Confirmation page**
After submission, the attendee sees: a thank-you message with their name, the confirmation message (which can include service times, directions, website links), and no further action required. This turns a data capture moment into a warm first touchpoint.

**F15. Form click tracking**
Lightweight tracking: how many people opened the form (accessed the URL), how many submitted, source (QR scan vs direct URL), and device type (mobile vs desktop). Stored in `fld_evt_form_access_logs`. Conversion rate calculated: `submissions / unique_opens × 100`.

**F16. Abuse prevention**
Cloudflare Turnstile (invisible CAPTCHA) on the form. A honeypot field (hidden, bots fill it, humans do not). Both applied to every submission. No JavaScript required for the basic form (server-side rendered for accessibility and low-bandwidth resilience).

**F17. Rate limiting based on attendee range**
Rate limit per minute calculated as `expected_max × 0.5`. Burst allowance: `expected_max × 0.3` in a 10-second window. Exceeding the rate limit adds a 2 to 3 second delay to the submission (queuing, not rejection). Nobody is blocked during legitimate high-concurrency moments.

**F18. Monitoring thresholds**
Submissions at or below `expected_max`: normal. Between `1× max` and `2× max`: logged as "higher than expected." Between `2× max` and `5× max`: Admin notified, brief queue delay added. Above `5× max`: form paused, Admin notified urgently. The form is never permanently blocked without Admin action.

**F19. Mid-event range update**
The Admin can update the expected attendee range from the event dashboard at any time. Monitoring thresholds recalculate immediately.

**F20. Multiple submissions toggle**
Default: off (one submission per device, enforced via browser cookie). When enabled, the same device can submit multiple times. The cookie check is a soft block (honest users, not a security boundary).

---

### Domain G: AI Extraction and Processing

**G1. Gemini Flash primary**
All extraction requests first go to Gemini 2.0 Flash. The prompt includes: the image as base64, the event's field schema (canonical names + language-specific labels), and instructions to return structured JSON matching the schema.

**G2. Claude API fallback**
If Gemini returns an error (rate limit, timeout, 5xx), the system retries once, then falls back to Claude API (Sonnet). If Claude also fails, the record is marked as `status: 'defective'` with `defective_reasons: ['extraction_failed']` for manual entry.

**G3. Dynamic extraction prompt**
The AI prompt is built at runtime from the event's `fld_evt_field_schemas`. Only the fields the owner selected are requested. The prompt includes both the canonical name and the language-specific labels: "This form may have a field labeled 'Gebetsanliegen' (German) or 'Prayer Requests' (English). Extract the handwritten content for this field."

**G4. Per-language labels in prompt**
For each field, all known language labels are included in the prompt. This handles the case where the scanning user does not know which language form was filled out. The AI matches against all known labels and extracts accordingly.

**G5. Extraction request logging**
Every API call logged in `fld_ai_extraction_requests`: which provider was used, input/output token counts, latency in milliseconds, success/failure status, and estimated cost (calculated from token counts using each provider's pricing).

**G6. Background processing via BullMQ**
When the Admin triggers processing, a job is created in `fld_job_processing` and dispatched to the BullMQ queue. The worker picks up the job and processes records sequentially (one AI call at a time to respect rate limits). Each record: extract → validate → flag → save → update progress counter.

**G7. Estimated processing time**
Formula: `base_time = record_count × 4 seconds`, `buffer = 20%`, `estimated_minutes = ceil((base_time × 1.2) / 60)`. Displayed to the user: "Estimated completion: ~X minutes."

**G8. Wait or leave**
The user can stay on the page (real-time progress bar via polling every 5 seconds) or leave (email notification on completion). Both options presented after processing is triggered.

**G9. Completion email**
When the processing job finishes, an email is sent to the Admin (and Sub-Admins with dashboard access) with: event name, total processed, flagged count, failed count, and a direct link to the review page.

**G10. Provider switching**
The AI provider is configured via environment variable (`AI_PRIMARY_PROVIDER=gemini`, `AI_FALLBACK_PROVIDER=claude`). Switching providers requires only a config change, no code modification. The extraction interface is abstracted behind a common `ExtractionProvider` interface.

**G11. AI billing dashboard**
A dedicated view showing: total requests per provider, success/failure rate, average latency, estimated cost per provider, and cost per event. Data sourced from `fld_ai_extraction_requests`.

---

### Domain H: Record Management

**H1. Defective record pipeline**
Records that fail validation are set to `status: 'defective'` with specific reasons stored in the `defective_reasons` JSONB array. Possible reasons: `email_missing`, `email_malformed`, `email_low_confidence`, `name_missing`, `name_low_confidence`, `unreadable_field`, `extraction_failed`, `poor_image_quality`.

**H2. Defective record detail page**
Side-by-side view: original scanned image on the left, extracted data on the right. Each field shows a green checkmark (correctly captured) or red flag (needs attention) with the specific issue described.

**H3. Field-level status indicators**
Each extracted field displays its confidence level and validation status. Green: valid and high confidence. Yellow: extracted but low confidence (editable, pre-filled with the AI's best guess). Red: missing or malformed (empty input field for the user to fill).

**H4. Phone as fallback**
When email is defective but a phone number was successfully extracted, the report surfaces this: "12 defective records, 9 have phone numbers available for manual outreach." The phone number is displayed prominently on the defective record detail page.

**H5. Defective records excluded from emails**
Records with `status: 'defective'` are automatically excluded from all email sequences. They do not appear in the send queue and do not count toward the "total to send" number.

**H6. Catch-up on resolution**
When a defective record is resolved (user fills in the missing data, hits "Save and Resolve"), the status changes to `resolved` and the catch-up email logic evaluates which emails in the sequence have already been sent to other records. The resolved record is queued for those emails with appropriate spacing.

**H7. Auto-merge exact duplicates**
During the duplicate detection pass (after processing), records with identical email AND identical name (case-insensitive, trimmed) are automatically merged. The most complete record is kept, the other is deleted. The merge is logged in `fld_sys_activity_logs`.

**H8. Cross-method duplicate detection**
Deduplication runs across all capture methods. A digital submission is compared against scanned records, and vice versa. Primary match key: email address (exact). Secondary: fuzzy name match (Levenshtein distance threshold).

**H9. Household grouping**
When two records share the same email but have different names, a `fld_evt_household_groups` entry is created. The Admin is presented with three options: send one email addressed to both names ("Dear John and Grace"), send separate emails to the same address, or mark one as primary and skip the other.

**H10. Household email handling**
Based on the Admin's choice: "combined" merges the `{full_name}` field to "John and Grace" for that email address; "separate" sends duplicate emails to the same address; "primary_only" sends to only one record.

**H11. Digital preferred over scan**
When a digital submission and a scanned record match (same email), a field-by-field comparison determines the winner per field. Digital values are preferred for text fields (typed by the person, cleaner). Scanned values are kept only for fields the digital submission left empty. The merged record stores the comparison log in the `merge_log` JSONB column.

**H12. Merge notification email**
A friendly, warm email sent to the person whose records were merged. Template exists in both English and German. Sent immediately after merge, outside the normal email sequence. Does not count as Email 1 in the sequence.

**H13. Record search**
Text search within an event by name, email, or phone. Returns matching records with their status and capture method. Available to Admin and Sub-Admins with the `review_records` permission.

**H14. Scan-to-verify**
Re-scan a card, extract key fields (name/email), and search against existing records. Shows: "This person is already captured" with details, or "No match found."

**H15. Record edit with change log**
Every edit to a record field is logged in `fld_evt_record_edit_logs`: old value, new value, who edited, when, and which emails had already been sent at that point. This provides a full audit trail for data modifications.

**H16. Current data at send time**
Email merge fields always pull the current value from the record at the moment the email is rendered for sending. If a record was edited after Email 1 was sent, Email 2 uses the updated data.

**H17. Language detection per record**
Two language fields per record: `form_language` (language of the printed form labels, detected by AI) and `content_language` (language of the handwritten or typed content, detected by AI). Both stored as ISO 639-1 codes.

**H18. Language mismatch badge**
In the review UI and dashboard, records where `content_language` differs from `event.primary_language` display a small language badge (e.g., "DE" on a blue badge). This alerts the Admin: "This person responded in German."

---

### Domain I: Email Templates

**I1. Default templates**
Five template pairs ship with the app, each in English and German: "Welcome to the Family" (first-time decision), "Welcome Back" (rededication), "Thank You for Visiting" (general event), "Next Steps" (follow-up with service info), and "Prayer Follow-Up" (for those with prayer requests). Defaults are read-only. Users can duplicate and customize.

**I2. Custom template creation**
TipTap rich text editor with toolbar: bold, italic, underline, headings, links, and a merge field insertion dropdown. The editor produces clean HTML stored in `fld_eml_template_versions.body`.

**I3. Merge field insertion**
A dropdown in the editor lists all fields from the event's field schema, plus system fields: `{full_name}`, `{email}`, `{event_title}`, `{event_date}`, `{unsubscribe_link}`. Selecting a field inserts the token into the editor at the cursor position.

**I4. Multi-language versions**
Each template has one entry in `fld_eml_templates` and multiple entries in `fld_eml_template_versions`, one per language. The Admin creates versions manually or triggers auto-translation.

**I5. Auto-translation via DeepL**
When a template exists in English but not German (or vice versa), the Admin can click "Auto-translate to [language]." The system sends the template body to DeepL, receives the translation, and creates a new `fld_eml_template_versions` entry with `translation_source: 'auto_deepl'`. The translation is cached (stored as a version), so it is not re-requested.

**I6. Auto-translated flag**
Auto-translated versions display a banner: "This version was auto-translated. Review recommended." The `status` field is set to `'auto_translated'`. Once the Admin reviews and approves, the status changes to `'auto_reviewed'`.

**I7. Translation caching**
Each auto-translated version is stored as a proper `fld_eml_template_versions` row. Subsequent records in the same language use this cached version. DeepL is called only once per template per language.

**I8. Template preview**
Before confirming a send, the Admin previews the email with real merge data. The preview renders the template using the first record's data, showing the actual email as the recipient would see it (not `{full_name}` placeholders).

**I9. Multi-record preview**
The preview UI allows scrolling through 3 to 5 records, prioritizing records in different languages and records with different field combinations (e.g., one with a prayer request, one without). This catches merge field issues, empty field handling, and language version problems before 80 emails go out.

**I10. Template deletion protection**
Templates linked to an active email sequence (status: `confirmed`, `scheduled`, or `sending`) cannot be deleted. The UI shows: "This template is used in [N] active email sequences. Remove it from those sequences before deleting."

**I11. Merge notification template**
A system default template for the duplicate merge notification email. Exists in English and German. Customizable by the Admin. Sent outside the normal email sequence.

---

### Domain J: Email Sequences and Scheduling

**J1. Multi-step sequences**
Each event can have an ordered sequence of emails: Email 1, Email 2, Email 3, etc. Each sequence entry links to a template and defines when it sends. Stored in `fld_eml_sequences` with `sequence_order`.

**J2. Mandatory 1-hour countdown**
Every email send triggers a 1-hour countdown. The countdown is tracked in `fld_eml_countdowns`. No email is ever sent without this review window. "Send now" translates to "send in 1 hour."

**J3. Countdown reset on changes**
Any modification to the template, recipient list, or schedule after the countdown starts resets the countdown to 60 minutes. A new pre-flight test email is sent. The previous countdown is cancelled. The `reset_count` increments and the `reset_reason` is logged.

**J4. 4-hour post-scan minimum**
The first email in a sequence cannot send earlier than 4 hours after the last scan is confirmed. This creates a natural window for the review phase. If the 4-hour window expires and unreviewed flagged records exist, the send is held (see J9).

**J5. Relative delay scheduling**
Emails can be scheduled relative to the previous email: "3 days after Email 1." The `delay_days` field on `fld_eml_sequences` stores this value. The actual send time is calculated when Email 1 completes sending.

**J6. Absolute scheduling**
Emails can be scheduled for a specific date and time. The `scheduled_at` field stores the datetime with timezone. Timezone is inferred from the Admin's profile or event settings.

**J7. Catch-up logic**
When new records are added to an event after emails have already been sent, the system creates a catch-up queue. Catch-up emails are spaced out (not all sent at once): Email 1 immediately after record confirmation, Email 2 after a configurable catch-up interval (default: 24 hours), subsequent emails join the normal schedule when they align. The `is_catchup` flag in `fld_eml_send_logs` distinguishes catch-up from on-schedule sends.

**J8. Exclude non-reviewed records**
The send job only includes records with `status: 'reviewed'` or `status: 'resolved'`. Records still in `processing`, `captured`, `defective`, or `flagged` are excluded. They catch up later once reviewed.

**J9. Hold on unreviewed flags**
If flagged records exist when a scheduled email is about to fire, the system pauses the send and notifies the Admin: "You have [N] unreviewed flagged records. Emails will not be sent until you review them, or you can choose to send to confirmed records only." Options: "Review now," "Send to confirmed only," "Reschedule."

**J10. Template version snapshot**
When the Admin confirms an email sequence entry, the current template version is snapshotted (the `template_version_snapshot_id` is set). Late additions receive the same version as the original cohort. If the Admin wants late additions to receive an updated template, they explicitly re-confirm.

**J11. Template lock at T-5 minutes**
When the countdown reaches 5 minutes remaining, the linked template version is locked (`is_locked = true`). No edits are allowed. If the Admin needs to edit, they must first pause the countdown (which restarts the full 1-hour cycle). Only the Admin can pause.

**J12. Resend rate limit awareness**
Resend free tier: 100 emails/day. The send job checks the daily count before dispatching. If approaching the limit, the job pauses and resumes the next day. The dashboard shows: "60 of 80 emails sent today. Remaining 20 will be sent tomorrow."

**J13. Auto-resume on rate limit**
Paused-for-rate-limit sends automatically resume at midnight UTC (or when the daily quota resets). The Admin is notified: "Rate limit reached. Remaining emails will be sent tomorrow."

**J14. Digital submission catch-up**
When a digital form submission arrives for an event with an active email sequence, the system checks which emails have already been sent and queues the catch-up sequence for the new record.

**J15. Pre-flight test email**
One hour before any scheduled send, a test email is sent to all event team members (Admin, Sub-Admins, and Scanners). The test uses real merge data from a sample record. The email footer includes role-appropriate action buttons.

**J16. Admin and Sub-Admin can pause**
Admin and Sub-Admins (with `pause_email_send` permission) can pause the countdown from the pre-flight email or the dashboard. Pausing freezes the countdown immediately.

**J17. Scanner can flag**
Scanners see a "Flag an issue" button in their pre-flight test email. Tapping it opens a text input for describing the issue. The flag is submitted and the Admin is notified immediately.

**J18. Flag does not auto-pause**
A flag is an escalation, not a block. The email continues on its countdown unless an Admin or Sub-Admin explicitly pauses. If the Admin does not review the flag before the countdown completes, the email sends as scheduled. The flag and non-action are logged.

**J19. Admin flag notification**
When a Scanner flags an issue, the Admin receives: an immediate email notification with the flag message and countdown timer context, plus a push notification on the dashboard if online.

**J20. Skip-test option**
For immediate sends, the Admin can skip the 1-hour test period. The option is presented but discouraged: "[Send in 1 hour (recommended)] [Skip test, send now]". Skipping is logged as a decision in the activity log.

**J21. Pause and resume behavior**
When the Admin pauses and then resumes, the countdown restarts from 60 minutes (not from where it was paused). A new pre-flight test is sent. This ensures every change gets a full review window.

**J22. 30-minute reminder**
At the 30-minute mark, the Admin receives a notification: "Email sending in 30 minutes. No issues flagged." (or "[N] flags raised, [reviewed/unreviewed]"). This is a gentle checkpoint, not a required action.

---

### Domain K: Unsubscribe and Opt-Out

**K1. Unsubscribe link in every email**
Every email includes a one-click unsubscribe link in the footer. This is legally required under GDPR and CAN-SPAM. The link contains an encrypted token identifying the record and event.

**K2. Unsubscribe landing page**
Clicking the link opens a page confirming the unsubscribe. Shows which event emails they were receiving. Offers a re-subscribe option: "Was this a mistake? Click here to re-subscribe."

**K3. Confirmation email**
Immediately after unsubscribing, a confirmation email is sent: "You have been unsubscribed from [Event Name] emails." This is the last email they receive. Includes the re-subscribe link.

**K4. Re-subscribe expiry**
The re-subscribe link contains a token that expires after 30 days. After expiry, the person would need to re-submit the digital form or contact the Admin to be re-added.

**K5. Global opt-out**
When someone unsubscribes from one event, the `email_opt_out` flag is set on their record. On future email sends across all events, the system checks: does this email address have a global opt-out? If yes, the send is skipped and logged as `blocked_opt_out`.

**K6. Owner notification**
The Admin receives a notification when someone unsubscribes: "[Name] unsubscribed from [Event Name] emails." This appears in the dashboard activity feed and optionally as an email notification.

**K7. Opt-out logging**
Every opt-out is tracked in `fld_eml_unsubscribe_logs` with: which record, which event, when, and the re-subscribe token expiry. All future skipped sends reference this log entry.

**K8. Bounce history**
When Resend reports a bounce, the record's email is flagged as `bounced`. If the same email appears in a future event, the review UI surfaces a warning: "This email has bounced previously on [date]." Bounced emails are not retried automatically.

---

### Domain L: Dashboard, Reporting, and Exports

**L1. Event overview**
Top-level dashboard showing: total records, breakdown by capture method (scan vs digital vs merged), breakdown by status (reviewed, defective, resolved, processing), and expected vs actual attendee count.

**L2. Defective record summary**
Count of defective records by reason type. "8 defective: 3 missing email, 2 malformed email, 2 low confidence name, 1 unreadable." With the callout: "6 of 8 have phone numbers for manual outreach."

**L3. Email sequence health**
Per-sequence view: total targeted, sent, delivered, bounced, failed, scheduled, catch-up pending. Visual status bar showing completion percentage.

**L4. Language breakdown**
Records by content language: "48 English, 12 German, 2 French." Highlights records that received emails in a non-native language.

**L5. Form conversion metrics**
QR scans (opens), form submissions, conversion rate. Breakdown by source (QR vs direct URL) and device (mobile vs desktop).

**L6. Activity timeline**
Chronological log of all event actions. Filterable by action type, actor, and date range.

**L7. Delegated action marking**
Actions performed by a delegate are marked in the timeline: "[Name] (delegated admin) resumed Email 2 send."

**L8. Bounce report**
Per-sequence bounce list with email addresses, bounce reasons, and timestamps.

**L9. CSV export**
All records with all fields, exported as CSV. Compatible with Google Sheets and Excel. Columns match the field schema order. Includes: record ID, capture method, status, all field values, language, email send status per sequence entry.

**L10. PDF summary report**
One-page summary: event details, record counts, email sequence status, defective record summary, form conversion metrics. Generated server-side as a downloadable PDF.

**L11. Per-record email status**
On the record detail page: which emails have been sent, when, delivery status, and which are scheduled.

**L12. Per-sequence email status**
On the sequence detail page: how many records received this email, how many on schedule vs catch-up, how many bounced, how many skipped (opt-out, no email, defective).

**L13. AI billing dashboard**
Total extraction requests, by provider, success/failure rate, average latency, estimated total cost, cost per event. Helps the Admin monitor AI spending and compare provider performance.

**L14. GDPR person search**
Admin-only. Search by email across all events owned by that Admin. Returns every record linked to that email address, across all events, with full details.

**L15. GDPR data export**
Generate a PDF report for a specific person: all records, all field values, all emails sent to them, consent timestamps, opt-out status. This report satisfies GDPR data access requests (Article 15).

**L16. GDPR data erasure**
Delete a person's data from all events: records, field values, images, email send logs. Irreversible. Requires Admin confirmation. The erasure action is logged for compliance (the log entry does not contain the deleted PII, only that a deletion occurred for audit purposes).

---

### Domain M: Team Management and Permissions

**M1. Three-tier role model**
Admin (event owner, full access), Sub-Admin (elevated collaborator, customizable permissions), Scanner (capture-only, session-based).

**M2. Admin: full access**
Every feature, every action, every report. The Admin is always the event creator. Admin role cannot be transferred in v1.

**M3. Sub-Admin defaults**
On promotion, Sub-Admins receive these permissions by default (all ON): scan_cards, batch_upload, share_form_link, review_records, edit_records, resolve_defective, merge_duplicates, configure_form_fields, manage_form_settings, create_edit_templates, approve_email_preflight, pause_email_send, flag_issue, view_dashboard, view_reports.

**M4. Scanner: capture only**
Scanners can: scan cards, see the live counter, and flag issues during pre-flight. Nothing else. Their session is scoped and temporary.

**M5. Per-Sub-Admin permission toggling**
The Admin can toggle individual permissions on or off for each Sub-Admin independently. Changing Ben's permissions does not affect Grace's. The `fld_evt_member_permissions` table stores overrides from the default set.

**M6. Grantable permissions**
Permissions that are OFF by default but can be granted by the Admin: configure_sequences, export_data, invite_members, edit_template_during_countdown.

**M7. Locked permissions**
Permissions that can never be granted to Sub-Admins, regardless of customization: resume_paused_email, manage_roles, gdpr_person_search, gdpr_data_erasure, delete_archive_event, delegate_admin.

**M8. Admin delegation**
The Admin can delegate temporary full admin access to a selected Sub-Admin. The delegation has a mandatory start date, end date, and a maximum duration of 30 days. Stored in `fld_iam_delegations`.

**M9. Delegation max duration**
30 days. This prevents forgotten delegations. The Admin receives a 24-hour expiry warning.

**M10. Delegate permissions**
The delegate receives all Admin permissions except: event deletion, re-delegation, ownership transfer, and removing the Admin's own access. These are hardcoded restrictions.

**M11. One delegation per event**
Only one active delegation per event at a time. Creating a new delegation while one is active requires revoking the current one first.

**M12. Delegation notifications**
Four notification points: delegation starts (both parties notified), 24 hours before expiry (both parties), delegation expires (both parties), delegation revoked (delegate notified).

**M13. Delegated action logging**
Every action performed by a delegate is logged with `acted_as_delegate: true` and a reference to the `delegation_id`. The Admin can review everything the delegate did during their period.

**M14. Simultaneous operation**
Both Admin and delegate can operate on the event simultaneously. In case of conflict (both edit the same record), last-write-wins, but Admin's writes always override in the same second.

**M15. Demotion resets permissions**
When a Sub-Admin is demoted to Scanner, all custom permissions are cleared. If re-promoted later, they start with the default Sub-Admin permission set, not their previous custom configuration.

**M16. QR-joined scanner promotion**
QR-joined scanners only provided an email, not a full account. Promotion to Sub-Admin requires a full registered account. The system sends a registration invitation email. After registration, the promotion is applied automatically.

**M17. Permission change propagation**
Permission changes take effect on the next API call. The current page remains visible, but any action requiring a revoked permission fails gracefully with a message: "Your permissions for this event have been updated."

**M18. Team management view**
Dashboard tab showing all team members: name, email, role, join method, scan count, last active, and permission customizations for Sub-Admins.

---

### Domain N: Security, Compliance, and Infrastructure

**N1. OWASP 17 categories scoped**
All 17 vulnerability categories from the Security Policy Framework are mapped to specific controls within this application. Each category has actionable, application-specific mitigations (documented in Section 5 of this specification).

**N2. Database table prefix**
All tables use the `fld_` prefix with domain abbreviations (`fld_iam_`, `fld_evt_`, `fld_eml_`, `fld_ai_`, `fld_job_`, `fld_sys_`). No table name is guessable from outside the codebase.

**N3. Least privilege database users**
Two database roles: `fld_app_user` (SELECT, INSERT, UPDATE, DELETE only) for the application, and `fld_migration_user` (full schema rights) for migrations. The postgres superuser is never used by the application.

**N4. UUID v4 for all IDs**
All primary keys use UUID v4 (random). No sequential IDs, no time-based UUIDs. This prevents ID enumeration and timing attacks.

**N5. PII encryption at rest**
Sensitive columns (name, email, phone, address) are encrypted at the application level before storage. Encryption key stored in environment variable, rotatable without data migration (using key versioning).

**N6. UUID-based image filenames**
Scanned card images are stored with UUID filenames, no PII in file paths. Example: `/storage/images/a7f3e2b1-4c5d-6e7f-8a9b-0c1d2e3f4g5h.jpg`. No metadata in filenames.

**N7. Image retention policy**
Three phases: Active (while event is open, full access), Archive (30 days after event closes, images compressed, not displayed by default), Purge (90 days after event closes, images permanently deleted, only structured data remains). A nightly job handles transitions. Admin can override (delete immediately or extend retention).

**N8. GDPR consent for scans**
The RCCG data protection statement printed on the card serves as the legal basis for processing. Consent is implicit when the card is filled out and scanned. The system logs the consent mechanism: `consent_type: 'printed_statement'`.

**N9. GDPR consent for digital forms**
Explicit checkbox consent on the digital form. The submission cannot proceed without checking the box. Consent timestamp is stored with the record.

**N10. Full audit trail**
Every data operation that creates, modifies, or deletes personal data is logged in `fld_sys_activity_logs`. The log includes: who, what, when, and the event context. Logs are append-only (no deletion or modification).

**N11. HTTPS and security headers**
HTTPS enforced via Coolify reverse proxy (Let is Encrypt SSL). HSTS headers with long max-age. Secure cookie flags: HttpOnly, Secure, SameSite=Strict.

**N12. CSRF protection**
CSRF tokens on all state-changing forms and API endpoints. SameSite=Strict on session cookies. The public digital form (stateless) uses Turnstile + honeypot instead of CSRF (no session to protect).

**N13. Security headers suite**
X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection: 1; mode=block, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy: camera=(self), Content-Security-Policy: default-src 'self'.

**N14. Rate limiting**
Per-user, per-IP, and per-endpoint rate limits. AI extraction endpoint: max 15 requests/minute (aligned with Gemini free tier). Public form: smart throttling based on expected attendee range. API endpoints: 100 requests/minute per authenticated user.

**N15. AI response validation**
AI extraction responses are treated as untrusted input. The response JSON is validated against the expected schema (field names, types, value formats) before any data is written to the database. Malformed responses trigger a retry or fallback.

**N16. Secrets management**
All secrets (database passwords, API keys, encryption keys, session secrets) stored in environment variables. Never hardcoded, never committed to version control. `.env` files in `.gitignore`.

**N17. Dependency security**
`npm audit` runs in CI pipeline. Builds fail on critical or high severity vulnerabilities. Dependencies pinned via lockfile (`package-lock.json` committed). Dependabot or Renovate configured for automated update PRs.

**N18. Infrastructure: Hetzner + Coolify**
Hetzner VPS (CX21 or CX31, 4GB+ RAM) running Coolify. Coolify manages: PostgreSQL container, Redis container, application container(s), reverse proxy with SSL. All services on an internal Docker network, not exposed to public internet except ports 80/443.

**N19. Email delivery: Resend**
Resend API for all transactional email: magic links, pre-flight tests, sequence emails, merge notifications, unsubscribe confirmations, processing completion notifications. Free tier: 100 emails/day, 3000/month.

**N20. Translation: DeepL API**
DeepL free tier: 500,000 characters/month. Used for: form label translation, email template auto-translation. Each translation is cached (stored as a database record), so the API is called once per unique text per language.

**N21. AI extraction: Gemini + Claude**
Gemini 2.0 Flash (free tier: 15 RPM, 1M tokens/minute) as primary. Claude API Sonnet as fallback. Both accessed via their respective SDKs, abstracted behind a common interface.

**N22. Domain and SSL**
Custom domain pointed to Hetzner VPS. SSL certificate provisioned via Coolify (Let is Encrypt, auto-renewal). All traffic HTTPS, HTTP redirects to HTTPS.

---

## 5. Security Controls: Full OWASP 17 Mapping

Each of the 17 vulnerability categories from the Security Policy Framework is mapped to specific, actionable controls within Fold. See the conversation record dated November 2025 for the complete Security Policy Framework document. The controls are integrated into the feature specifications above (not a separate appendix) and are enforced at the code level, not as post-deployment checks.

**Summary of critical controls by priority:**

**Critical (must be in place before any deployment):**
- Authentication on all endpoints (A1-A4)
- Permission checks at API + data layer (M1-M7)
- Input validation and sanitization on all data paths (F11, F16, G3, N15)
- PII encryption at rest (N5)
- HTTPS enforcement (N11)
- CSRF protection (N12)
- Parameterized queries via ORM (N3)

**High (must be in place before production data):**
- Rate limiting (N14)
- Security headers (N13)
- Image retention and purge (N7)
- Audit trail (N10)
- GDPR tools (L14-L16)
- Secrets management (N16)

**Medium (must be in place before public access):**
- Dependency scanning (N17)
- Monitoring and alerting (F18)
- Bounce handling (K8)
- Session expiry and invalidation (A4, E6-E7)

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Hetzner VPS provisioning and Coolify setup
- PostgreSQL and Redis deployment via Coolify
- Next.js project scaffolding with TypeScript
- Drizzle ORM setup with all `fld_*` tables and migrations
- Authentication (NextAuth.js): registration, login, Google OAuth, profile completion gate
- Basic event CRUD (create, list, view, close)
- Security foundation: HTTPS, headers, CSRF, rate limiting

### Phase 2: Capture Engine (Weeks 3-4)
- Field configuration: library selection + custom fields
- Blank form scanning with AI field detection
- Translation-based multilingual label generation (DeepL integration)
- Camera capture with alignment guide and quality check
- Gallery upload (single + batch)
- Offline resilience (IndexedDB queue)
- Image storage on VPS disk

### Phase 3: Processing Pipeline (Weeks 5-6)
- Gemini Flash integration (primary extraction)
- Claude API integration (fallback)
- Background processing via BullMQ
- Defective record pipeline
- Duplicate detection and merge logic
- Household grouping
- Record review UI with side-by-side image and data
- Processing completion email via Resend

### Phase 4: Digital Forms (Weeks 7-8)
- QR code and short URL generation
- Public form page (server-side rendered)
- Progressive disclosure (auto-step splitting)
- Turnstile + honeypot abuse prevention
- Rate limiting with attendee range thresholds
- Form access tracking
- Cross-method duplicate detection (digital vs scan)
- Merge notification email

### Phase 5: Collaborative Scanning (Week 9)
- QR code scanner invitation
- Email invitation with access codes
- Join page with email/code entry
- WebSocket real-time scan counter
- Scanner session management (expiry, termination)
- Live counter sync across multiple scanners

### Phase 6: Email System (Weeks 10-12)
- Email template CRUD with TipTap editor
- Merge field system
- Multi-language template versions
- DeepL auto-translation for templates
- Email sequence configuration
- 1-hour mandatory countdown
- Pre-flight test emails with role-based actions
- Scanner flag escalation
- Template lock at T-5 minutes
- Catch-up logic for late additions
- Unsubscribe flow (link, landing page, confirmation email, global opt-out)
- Resend integration for all email types

### Phase 7: Team and Permissions (Week 13)
- Role model implementation (Admin, Sub-Admin, Scanner)
- Per-Sub-Admin permission toggling
- Admin delegation with expiry
- Delegation notifications
- Permission change propagation

### Phase 8: Dashboard and Reporting (Week 14)
- Event overview dashboard
- Email sequence health view
- Defective record summary
- Form conversion metrics
- Activity timeline
- CSV export
- PDF summary report
- AI billing dashboard
- GDPR tools (person search, data export, data erasure)

### Phase 9: Polish and Security Hardening (Weeks 15-16)
- Full security audit against all 17 OWASP categories
- Penetration testing (manual, focused on auth and data access)
- Performance optimization (query tuning, image compression)
- Mobile responsiveness polish
- Error handling and edge case coverage
- Documentation (API docs, Admin guide)
- Monitoring and alerting setup

---

## 7. Infrastructure Setup Guide

Detailed step-by-step guide for Hetzner VPS + Coolify setup will be provided as a separate document when we begin Phase 1. It will cover:

1. Hetzner VPS provisioning (OS, SSH keys, firewall)
2. Coolify installation and initial configuration
3. PostgreSQL deployment (with `fld_app_user` and `fld_migration_user`)
4. Redis deployment
5. Domain configuration and SSL
6. Next.js application deployment
7. Environment variable management
8. Backup strategy (database + images)
9. Monitoring setup

---

## 8. Open Questions for Future Versions

These items were discussed but explicitly deferred from v1:

1. **QR code detection on physical cards** - Parked for v2
2. **PWA with offline form submission** - v2, after validating v1 form usage
3. **Backup Admin designation** - v2, currently Admin role cannot be transferred
4. **vCard export** - v2, contact card generation for phone import
5. **CRM integration** - v2+, API integration for external systems
6. **SMS follow-up** - v2+, alternative to email for records with phone but no email
7. **Multi-organization support** - v2+, one user managing events for multiple churches
8. **App naming** - To be researched separately

---

**End of Technical Specification v1.0**
