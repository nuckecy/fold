# FOLD - Architecture Decision Records

> Every significant technical or product decision is recorded here.
> Format: Context, Decision, Consequences, Alternatives Rejected.
> This file is auto-committed by Claude Code hooks alongside CLAUDE.md.

---

## ADR-001: Database table prefix convention

**Date:** 2026-04-03
**Status:** Accepted

**Context:** Default table names like `users`, `events`, `records` are predictable and are the first targets in SQL injection or enumeration attacks. Even with parameterized queries, obscured names add defense in depth.

**Decision:** All tables use the `fld_` prefix (derived from "Fold") with domain abbreviations: `fld_iam_` (identity), `fld_evt_` (events), `fld_eml_` (email), `fld_ai_` (AI processing), `fld_job_` (background jobs), `fld_sys_` (system), `fld_org_` (organizations), `fld_sms_` (SMS).

**Consequences:** Every ORM model, migration, query, and reference uses `fld_` prefixed names. Developers must know the convention. The Drizzle schema defines table names explicitly.

**Alternatives rejected:**
- `nsp_` (New Song Parish, too organization-specific, not app-level)
- `evs_` (Event Scan, too narrow, only describes one feature)
- No prefix (default names are guessable, security risk)

---

## ADR-002: AI extraction provider strategy

**Date:** 2026-04-03
**Status:** Accepted

**Context:** The app needs AI vision to extract handwritten data from scanned registration cards. Cost must be zero during development and testing.

**Decision:** Gemini 2.0 Flash (free tier: 15 RPM, 1M tokens/min) as primary provider. Claude API Sonnet as paid fallback when Gemini fails (rate limit, timeout, error). Both providers abstracted behind a common `ExtractionProvider` interface. Provider selection via environment variable.

**Consequences:** Every extraction request is logged with provider, tokens, latency, and cost. Switching providers requires only a config change. AI billing dashboard tracks spend per provider.

**Alternatives rejected:**
- Claude API only (cost from day one, no free tier)
- Tesseract OCR (raw text extraction only, no structured understanding)
- Google Cloud Vision (requires GCP account, more complex setup)

---

## ADR-003: Event hibernation instead of deletion

**Date:** 2026-04-03
**Status:** Accepted

**Context:** Events contain personal data (names, emails, phone numbers, prayer requests) protected by GDPR. Permanent deletion of events with real attendee data carries legal and practical risks. However, empty events and test events should be cleanly removable.

**Decision:** Events with 0-3 records can be permanently deleted (test data threshold). Events with 4+ records can only be hibernated. Hibernation pauses all activity, hides the event from default views, cancels scheduled emails, and deactivates the digital form. Hibernated events can be reactivated. Permanent purge requires: hibernation first, explicit purge request with confirmation, then a 30-day grace period before actual data removal.

**Consequences:** Need `hibernated` status in event lifecycle. Need reactivation flow. Need scheduled purge job with grace period. Admin can cancel purge during grace period.

**Alternatives rejected:**
- Hard delete with confirmation (GDPR risk, no recovery)
- Soft delete flag without hibernation UI (confusing, data still active in background)
- No deletion at all (clutters the dashboard with abandoned test events)

---

## ADR-004: Multi-organization support in v1

**Date:** 2026-04-03
**Status:** Accepted

**Context:** Multiple churches and organizations will use Fold. Events must be scoped to an organization, not just a user. Different RCCG parishes in different countries should be separate entities.

**Decision:** Organizations are standalone. Same name in different countries creates separate orgs (UNIQUE constraint on name + country). No auto-join: if an org with the same name and country exists, the user is told to contact the owner. Events belong to organizations, not individual users. Each org is fully isolated in v1. Cross-org visibility is parked for v2 but the system is configurable.

**Consequences:** Registration flow creates an org. Users are org members with roles. Events have an `org_id` foreign key. All queries include org scoping.

**Alternatives rejected:**
- User-level events (no org support, limits collaboration)
- Auto-join by org name (security risk, wrong people join)
- Single-tenant deployment (does not scale to multiple churches)

---

## ADR-005: SMS via Twilio as paid fallback

**Date:** 2026-04-03
**Status:** Accepted

**Context:** Some email deliveries fail (bounce, invalid mailbox). Records with phone numbers have an alternative channel. SMS has a per-message cost (~EUR 0.07 in Germany).

**Decision:** Twilio SMS as automatic fallback for bounced/failed emails. Disabled by default via feature flag. Super Admin enables it globally from the Super Admin dashboard. SMS is never sent if email succeeds. SMS uses a plain-text version of the email template. All SMS sends are logged with cost tracking. Monthly budget cap configurable by Super Admin.

**Consequences:** Feature flag system (`fld_sys_feature_flags`) needed. SMS send log table (`fld_sms_send_logs`) with cost tracking. Super Admin dashboard shows SMS spend. WhatsApp Business API scoped for v2 via the same Twilio infrastructure.

**Alternatives rejected:**
- No SMS at all (lost reach for bounced emails)
- SMS as primary channel (expensive, email is sufficient for most)
- WhatsApp in v1 (more complex API, better as v2 addition)
- Free SMS providers (do not exist at scale, all have per-message costs)

---

## ADR-006: Auto-memory via Claude Code hooks

**Date:** 2026-04-03
**Status:** Accepted

**Context:** Development context is lost between Claude Code sessions. Decisions, progress, and architectural choices must persist across sessions without manual logging.

**Decision:** Two Claude Code hooks handle memory automatically:
1. `Stop` hook: fires after every Claude Code response. If CLAUDE.md or DECISIONS.md was modified, it commits and pushes to GitHub.
2. `Notification` (idle_prompt) hook: fires when Claude Code goes idle (5+ minutes of inactivity). Snapshots ALL uncommitted work and pushes to GitHub.

CLAUDE.md contains: project status, session history, feature tracker, tech stack, decisions summary, and environment reference. DECISIONS.md contains: full architecture decision records with reasoning.

**Consequences:** Every session is automatically logged. No manual "save" step. CLAUDE.md must be read at the start of every session. Git history shows the full development timeline via `memory:` and `snapshot:` commit messages.

**Alternatives rejected:**
- Manual session logging (depends on remembering, unreliable)
- External notes (disconnected from the codebase)
- Database-backed memory (overengineered for this purpose)

---

## Template for Future Decisions

```
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX

**Context:** [Why this decision is needed]

**Decision:** [What was decided]

**Consequences:** [What changes as a result]

**Alternatives rejected:**
- [Option and why it was rejected]
```

---

**End of decisions file. Updated automatically by Claude Code hooks.**
