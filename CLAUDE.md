# FOLD - Development Memory

> **Read this file first at the start of every session.**
> This file is the persistent memory for the Fold project.
> It is auto-updated by Claude Code hooks after every response.
> Do not manually edit unless correcting an error.

---

## Quick Status

- **Phase:** Pre-development (setup and scaffolding)
- **Last updated:** 2026-04-03
- **Last session:** Initial planning, specification, and setup file creation
- **Next action:** Run SETUP.md, provision Hetzner VPS, install Coolify, scaffold Next.js project
- **Spec version:** v1.0 (108 features, 31 tables, 14 domains)

---

## What is Fold

Fold is an event-based document intelligence and follow-up platform. It captures attendee information from physical registration cards (via AI-powered scanning) and digital form submissions, processes and validates the data, manages structured email follow-up sequences, and provides reporting.

Primary use case: church event management for RCCG (Redeemed Christian Church of God), capturing new convert cards and visitor forms, then running personalized multilingual email campaigns.

**Repository:** https://github.com/nuckecy/fold.git

---

## Tech Stack (Locked)

Do not change these without discussion and an ADR entry in DECISIONS.md.

| Layer | Technology |
|---|---|
| Hosting | Hetzner VPS + Coolify |
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (via Coolify) |
| ORM | Drizzle ORM |
| Cache/Queue | Redis + BullMQ (via Coolify) |
| AI Primary | Gemini 2.0 Flash (free tier) |
| AI Fallback | Claude API Sonnet (paid) |
| Translation | DeepL API (free tier) |
| Email | Resend (free tier) |
| SMS (paid) | Twilio (disabled by default, Super Admin enables) |
| Auth | NextAuth.js v5 |
| Real-time | WebSocket (native) |
| CAPTCHA | Cloudflare Turnstile |
| Rich Text | TipTap |
| Storage | Local disk on VPS |
| Project Mgmt | Linear (via MCP) |

---

## Database Convention

- All tables prefixed with `fld_` (Fold)
- Domain prefixes: `fld_iam_`, `fld_evt_`, `fld_eml_`, `fld_ai_`, `fld_job_`, `fld_sys_`, `fld_org_`, `fld_sms_`
- All primary keys: UUID v4 (random, non-enumerable)
- All timestamps: UTC
- Sensitive PII columns: encrypted at application level
- Two DB roles: `fld_app_user` (CRUD only), `fld_migration_user` (schema rights)
- 31 tables total

---

## Design Principles

1. **Capture fast, process later.** Scanning is instant. AI extraction happens in background.
2. **Digital data is source of truth.** Typed data beats handwriting extraction.
3. **No email is rushed.** Mandatory 1-hour countdown on every send. No bypass.
4. **Security built in.** All 17 OWASP categories scoped from day one.
5. **Progressive disclosure.** Setup, forms, and dashboards reveal complexity only when needed.
6. **No contractions in written content.** Owner preference: always use full forms.

---

## Key Decisions Summary

Full reasoning in DECISIONS.md. Quick reference:

- **ADR-001:** Database prefix is `fld_` with domain abbreviations
- **ADR-002:** Gemini Flash primary, Claude Sonnet fallback for AI extraction
- **ADR-003:** Events with 4+ records cannot be deleted, only hibernated
- **ADR-004:** Multi-org support in v1, standalone orgs, same name + different country allowed
- **ADR-005:** SMS via Twilio as paid fallback for failed emails, disabled by default
- **ADR-006:** Stop hook for auto-memory, idle hook for snapshots
- **App name:** Fold
- **Form setup:** Scan blank form + DeepL translation (no second scan needed)
- **Email timing:** 1-hour mandatory countdown, template lock at T-5 minutes
- **Event deletion:** 0-3 records = deletable, 4+ records = hibernation only
- **Super Admin:** Single user (not hardcoded), manages platform-level features
- **Roles:** Admin > Sub-Admin (customizable permissions) > Scanner (capture only)
- **Delegation:** Admin can delegate to Sub-Admin with mandatory expiry (max 30 days)
- **Backup Admin:** Standing designation, auto-activates on 7-day inactivity
- **CRM:** Not in v1 but architecture is plug-and-play ready (export API, webhook infra)
- **WhatsApp:** Scoped for v2, Twilio WhatsApp Business API
- **Cross-org visibility:** Parked for v2, system configurable

---

## Implementation Phases

| Phase | Weeks | Focus | Status |
|---|---|---|---|
| 1 | 1-2 | Foundation: Hetzner, Coolify, DB, Auth, Event CRUD | Not started |
| 2 | 3-4 | Capture Engine: Fields, scanning, camera, offline | Not started |
| 3 | 5-6 | Processing: AI extraction, BullMQ, defective pipeline | Not started |
| 4 | 7-8 | Digital Forms: QR, short URL, progressive disclosure | Not started |
| 5 | 9 | Collaborative Scanning: QR join, WebSocket sync | Not started |
| 6 | 10-12 | Email System: Templates, sequences, countdown, catch-up | Not started |
| 7 | 13 | Team and Permissions: Roles, delegation, granular perms | Not started |
| 8 | 14 | Dashboard and Reporting: Super Admin, user dashboard | Not started |
| 9 | 15-16 | Polish: Security audit, performance, mobile, docs | Not started |

---

## Feature Tracker (108 features)

### A: User Authentication (6)
- [ ] A1. Email/password registration with verification link
- [ ] A2. Google OAuth with profile completion gate
- [ ] A3. Passwordless login via magic link
- [ ] A4. Session management (7-day, server-side)
- [ ] A5. App language preference
- [ ] A6. Notification preferences

### B: Event Management (8)
- [ ] B1. Create event (title, date, description)
- [ ] B2. Expected attendee range
- [ ] B3. Event language configuration
- [ ] B4. Event lifecycle (active/closed/archived/hibernated)
- [ ] B5. Duplicate event (structure only)
- [ ] B6. Duplication audit log
- [ ] B7. Activity timeline
- [ ] B8. Event isolation

### C: Field Configuration (11)
- [ ] C1. Scan blank form to auto-detect fields
- [ ] C2. Multi-language form detection loop
- [ ] C3. Translation-based label generation (DeepL)
- [ ] C4. AI-powered label edit cycle
- [ ] C5. Label change history
- [ ] C6. Manual field selection from library
- [ ] C7. Custom field creation
- [ ] C8. Canonical names with per-language labels
- [ ] C9. Required/optional marking
- [ ] C10. Drag-to-reorder
- [ ] C11. Auto field type detection by option count

### D: Physical Card Scanning (10)
- [ ] D1. Camera capture with alignment guide
- [ ] D2. Pre-capture quality check
- [ ] D3. Upload from gallery (single)
- [ ] D4. Batch upload from gallery
- [ ] D5. Each upload as unique scan
- [ ] D6. Offline resilience (IndexedDB)
- [ ] D7. Card count prompt
- [ ] D8. Live scan counter
- [ ] D9. Camera permission fallback
- [ ] D10. Scan-to-verify

### E: Collaborative Scanning (8)
- [ ] E1. QR code for scanner invitation
- [ ] E2. QR join requires email
- [ ] E3. Email invitation with unique code
- [ ] E4. Code entry join
- [ ] E5. Real-time scan counter sync
- [ ] E6. Session expiry on scanning close
- [ ] E7. Inactivity timeout (4 hours)
- [ ] E8. Scanner access scope (capture only)

### F: Digital Form Capture (20)
- [ ] F1. QR code generation (PNG + SVG)
- [ ] F2. Short URL generation
- [ ] F3. Forms live forever until manually closed
- [ ] F4. Late submission notification
- [ ] F5. Form language (EN/DE/auto)
- [ ] F6. Progressive disclosure (auto-step splitting)
- [ ] F7. Step 1: identity fields
- [ ] F8. Step 2+: event-specific fields + consent
- [ ] F9. Desktop single-page rendering
- [ ] F10. Form fields from scanned labels
- [ ] F11. Real-time field validation
- [ ] F12. Data protection consent
- [ ] F13. Customizable messages
- [ ] F14. Confirmation page
- [ ] F15. Form click tracking
- [ ] F16. Abuse prevention (Turnstile + honeypot)
- [ ] F17. Rate limiting based on attendee range
- [ ] F18. Monitoring thresholds
- [ ] F19. Mid-event range update
- [ ] F20. Multiple submissions toggle

### G: AI Extraction and Processing (11)
- [ ] G1. Gemini Flash primary extraction
- [ ] G2. Claude API fallback
- [ ] G3. Dynamic extraction prompt from field schema
- [ ] G4. Per-language labels in prompt
- [ ] G5. Extraction request logging
- [ ] G6. Background processing via BullMQ
- [ ] G7. Estimated processing time
- [ ] G8. Wait or leave (progress bar / email notification)
- [ ] G9. Completion email
- [ ] G10. Provider switching via env var
- [ ] G11. AI billing dashboard (Super Admin only)

### H: Record Management (18)
- [ ] H1. Defective record pipeline
- [ ] H2. Defective record detail page
- [ ] H3. Field-level status indicators
- [ ] H4. Phone as fallback for defective email
- [ ] H5. Defective records excluded from emails
- [ ] H6. Catch-up on resolution
- [ ] H7. Auto-merge exact duplicates
- [ ] H8. Cross-method duplicate detection
- [ ] H9. Household grouping (shared email)
- [ ] H10. Household email handling options
- [ ] H11. Digital preferred over scan (smart merge)
- [ ] H12. Friendly merge notification email
- [ ] H13. Record search (name/email/phone)
- [ ] H14. Scan-to-verify
- [ ] H15. Record edit with change log
- [ ] H16. Current data at send time
- [ ] H17. Language detection per record
- [ ] H18. Language mismatch badge

### I: Email Templates (11)
- [ ] I1. Default templates (EN + DE pairs)
- [ ] I2. Custom template creation (TipTap)
- [ ] I3. Merge field insertion
- [ ] I4. Multi-language template versions
- [ ] I5. Auto-translation via DeepL
- [ ] I6. Auto-translated flag for review
- [ ] I7. Translation caching
- [ ] I8. Template preview with real data
- [ ] I9. Multi-record preview scroll
- [ ] I10. Template deletion protection
- [ ] I11. Merge notification template

### J: Email Sequences and Scheduling (22)
- [ ] J1. Multi-step sequences
- [ ] J2. Mandatory 1-hour countdown
- [ ] J3. Countdown reset on changes
- [ ] J4. 4-hour post-scan minimum
- [ ] J5. Relative delay scheduling
- [ ] J6. Absolute date/time scheduling
- [ ] J7. Catch-up logic for late additions
- [ ] J8. Exclude non-reviewed records
- [ ] J9. Hold on unreviewed flags
- [ ] J10. Template version snapshot
- [ ] J11. Template lock at T-5 minutes
- [ ] J12. Resend rate limit awareness
- [ ] J13. Auto-resume on rate limit
- [ ] J14. Digital submission catch-up
- [ ] J15. Pre-flight test email (1 hour before)
- [ ] J16. Admin and Sub-Admin can pause
- [ ] J17. Scanner can flag issue
- [ ] J18. Flag does not auto-pause
- [ ] J19. Admin flag notification
- [ ] J20. Skip-test option (logged)
- [ ] J21. Pause/resume restarts full countdown
- [ ] J22. 30-minute reminder

### K: Unsubscribe and Opt-Out (8)
- [ ] K1. Unsubscribe link in every email
- [ ] K2. Unsubscribe landing page
- [ ] K3. Confirmation email
- [ ] K4. Re-subscribe link (30-day expiry)
- [ ] K5. Global opt-out across events
- [ ] K6. Owner notification on unsubscribe
- [ ] K7. Opt-out logging
- [ ] K8. Bounce history

### L: Dashboard, Reporting, Exports (16)
- [ ] L1. Event overview dashboard
- [ ] L2. Defective record summary
- [ ] L3. Email sequence health
- [ ] L4. Language breakdown
- [ ] L5. Form conversion metrics
- [ ] L6. Activity timeline
- [ ] L7. Delegated action marking
- [ ] L8. Bounce report
- [ ] L9. CSV export (Google Sheets/Excel)
- [ ] L10. PDF summary report
- [ ] L11. Per-record email status
- [ ] L12. Per-sequence email status
- [ ] L13. Super Admin: AI billing dashboard
- [ ] L14. GDPR person search
- [ ] L15. GDPR data export
- [ ] L16. GDPR data erasure

### M: Team Management and Permissions (18)
- [ ] M1. Three-tier role model
- [ ] M2. Admin: full access
- [ ] M3. Sub-Admin defaults
- [ ] M4. Scanner: capture only
- [ ] M5. Per-Sub-Admin permission toggling
- [ ] M6. Grantable permissions
- [ ] M7. Locked permissions
- [ ] M8. Admin delegation with expiry
- [ ] M9. Delegation max 30 days
- [ ] M10. Delegate permissions (minus 3 locked)
- [ ] M11. One delegation per event
- [ ] M12. Delegation notifications
- [ ] M13. Delegated action logging
- [ ] M14. Simultaneous operation
- [ ] M15. Demotion resets permissions
- [ ] M16. QR-joined scanner promotion requires registration
- [ ] M17. Permission change propagation
- [ ] M18. Team management view

### N: Security, Compliance, Infrastructure (22)
- [ ] N1. OWASP 17 categories scoped
- [ ] N2. Database table prefix (fld_)
- [ ] N3. Least privilege DB users
- [ ] N4. UUID v4 for all IDs
- [ ] N5. PII encryption at rest
- [ ] N6. UUID-based image filenames
- [ ] N7. Image retention policy (30d archive, 90d purge)
- [ ] N8. GDPR consent for scans
- [ ] N9. GDPR consent for digital forms
- [ ] N10. Full audit trail
- [ ] N11. HTTPS and security headers
- [ ] N12. CSRF protection
- [ ] N13. Security headers suite
- [ ] N14. Rate limiting
- [ ] N15. AI response validation
- [ ] N16. Secrets management
- [ ] N17. Dependency security (npm audit)
- [ ] N18. Hetzner VPS + Coolify
- [ ] N19. Resend for email
- [ ] N20. DeepL for translations
- [ ] N21. Gemini + Claude for extraction
- [ ] N22. Domain with SSL

### Additional (6)
- [ ] 102. SMS via Twilio (paid, disabled by default)
- [ ] 103. Super Admin feature flag control
- [ ] 104. SMS send logging with cost tracking
- [ ] 105. CRM plug-and-play readiness
- [ ] 106. Multi-organization support
- [ ] 107. Organization management
- [ ] 108. Super Admin dashboard (system, AI, email, access, GDPR)

---

## Session History

### Session 001 - 2026-04-03
**Type:** Planning and specification
**Completed:**
- Full product concept defined across 14 domains
- 108 features specified with detailed requirements
- 31-table database schema designed (all fld_ prefixed)
- Security controls scoped for all 17 OWASP categories
- Tech stack locked
- Implementation plan: 9 phases, ~16 weeks
- Setup files created (SETUP.md, hooks, settings, memory files)
- Technical specification v1.0 document produced

**Decisions made:**
- App name: Fold
- DB prefix: fld_ (ADR-001)
- AI strategy: Gemini primary, Claude fallback (ADR-002)
- Event hibernation, not deletion (ADR-003)
- Multi-org in v1 (ADR-004)
- SMS as paid fallback (ADR-005)
- Auto-memory via hooks (ADR-006)
- Super Admin: single user, not hardcoded
- Backup Admin: standing designation, 7-day inactivity trigger
- Forms live forever until manually closed
- Digital submissions preferred over scans in merge
- 1-hour mandatory countdown on all email sends
- Template lock at T-5 minutes
- Event deletion only if 0-3 records (test data)

**Next:**
- Run SETUP.md to configure Claude Code environment
- Set up Linear workspace and import backlog
- Provision Hetzner VPS
- Install Coolify
- Scaffold Next.js project
- Begin Phase 1: Foundation

---

## Environment Variables Reference

No actual secrets here. This documents which env vars the app needs.

```
# Database
DATABASE_URL=postgresql://fld_app_user:***@localhost:5432/fold
DATABASE_MIGRATION_URL=postgresql://fld_migration_user:***@localhost:5432/fold

# Redis
REDIS_URL=redis://localhost:6379

# AI Providers
GEMINI_API_KEY=***
CLAUDE_API_KEY=***
AI_PRIMARY_PROVIDER=gemini
AI_FALLBACK_PROVIDER=claude

# Email
RESEND_API_KEY=***

# Translation
DEEPL_API_KEY=***

# SMS (disabled by default)
TWILIO_ACCOUNT_SID=***
TWILIO_AUTH_TOKEN=***
TWILIO_FROM_NUMBER=***

# Auth
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://foldapp.com
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# Encryption
ENCRYPTION_KEY=***

# App
APP_URL=https://foldapp.com
NODE_ENV=production
```

---

## File Structure (updated as project grows)

```
fold/
├── .claude/
│   ├── settings.json
│   └── hooks/
│       ├── update-memory.sh
│       └── idle-snapshot.sh
├── CLAUDE.md              (this file)
├── DECISIONS.md           (architecture decision records)
├── SETUP.md               (one-time setup guide)
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── .env.local             (local secrets, gitignored)
├── .gitignore
├── src/
│   ├── app/               (Next.js app router)
│   ├── components/        (React components)
│   ├── lib/               (shared utilities)
│   ├── db/                (Drizzle schema, migrations)
│   ├── services/          (business logic)
│   ├── jobs/              (BullMQ job definitions)
│   └── types/             (TypeScript types)
└── public/                (static assets)
```

---

## Known Issues and Technical Debt

None yet. This section will be populated during development.

---

**End of memory file. Updated automatically by Claude Code hooks.**
