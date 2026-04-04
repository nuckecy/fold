# Agent 3: UX Strategy Analysis for Fold

> Derived from pattern analysis of 66 iOS app screenshots across onboarding, browsing,
> detail, booking, and profile screens. All recommendations are tailored for Fold's
> church event management context: administrators, pastors, volunteers, and scanners
> working across a wide age range and varying technical comfort levels.

---

## 1. Information Architecture

### 1.1 Observed Patterns

The reference app enforces a strict single-task-per-screen philosophy. Each screen
presents one primary action or one category of information. Content is organized into
clearly separated sections using generous whitespace and subtle hairline dividers rather
than heavy visual containers. Progressive disclosure is used extensively: collapsed
accordion sections, "Show all N items" buttons, and expandable FAQ-style lists keep
screens scannable without hiding critical information.

Navigation depth is shallow. The dominant pattern is: Tab bar, then List, then Detail,
then Action. Screens rarely exceed three levels of depth. Search appears as a sticky
element at the top of browse screens, always visible and immediately accessible.

Profile and detail screens present summary statistics (counts, ratings, time periods)
in a compact horizontal row at the top, then expand into detailed list items below.

### 1.2 Recommendations for Fold

**One task per screen, always.** Fold's feature set spans scanning, record review,
email scheduling, team management, and reporting. The temptation to combine related
actions on a single screen will be strong. Resist it. Each screen should answer one
question or enable one action:

- Scanning screen: camera viewfinder, capture button, scan counter. Nothing else.
- Record review screen: the record data, field-level status indicators, and an action
  to resolve. No email controls, no team management sidebar.
- Email countdown screen: the template preview, the countdown timer, and pause/cancel
  controls. No record lists.

**Shallow navigation for all roles.** The three-tier role model (Admin, Sub-Admin,
Scanner) means different users see different depths of the application. Map navigation
so that every role reaches their primary task in two taps or fewer:

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 |
|---|---|---|---|---|
| Admin | Events | Records | Email | Team |
| Sub-Admin | Events | Records | Email (if permitted) | -- |
| Scanner | Scan | My Scans | -- | -- |

The Scanner role is especially critical. Volunteers at a church event who open the app
via QR code invitation should see the camera within one tap of landing. They should
never encounter event configuration, email templates, or team management screens.

**Progressive disclosure for field configuration.** The field setup flow (features C1
through C11) involves scanning a blank form, reviewing AI-detected fields, editing
labels, reordering, and setting required/optional status. Present this as a guided
sequence:

1. Scan or upload the blank form (single action screen).
2. Review detected fields in a simple list (collapsed detail, expandable per field).
3. Edit labels only when the user taps a specific field.
4. Reorder using drag handles, but only after the field list is confirmed.

Do not show all configuration options on a single screen. Church administrators
setting up their first event should feel guided, not overwhelmed.

**Section-based detail screens for events.** The event detail screen should follow the
observed pattern of summary stats at the top (total records, defective count, email
sequence progress, days until next send) in a compact horizontal row, followed by
expandable sections for records, email sequences, team members, and activity timeline.

**Sticky search on all list screens.** Events, records, team members, and templates
should all have a persistent search bar pinned to the top of the list. For record
search specifically (feature H13), support name, email, and phone number without
requiring the user to select a search mode. Parse the input and search across all
three fields simultaneously.

---

## 2. Interaction Design

### 2.1 Observed Patterns

The authentication flow uses a multi-step approach where each screen shows only the
fields needed for that step. Progress is implicit in the flow rather than shown as a
numbered stepper. CTAs use assertive, specific copy that describes the outcome of the
action, not generic labels.

Confirmation and review screens display editable sections with inline "Edit" links,
allowing the user to review and modify before committing. Booking and action flows
show completed steps as collapsed cards at the top of the screen, providing context
without requiring navigation back.

Destructive actions are presented through radio-button selection lists rather than
direct action buttons. This forces a deliberate choice before proceeding.

### 2.2 Recommendations for Fold

**Multi-step authentication with single-field focus.** Fold supports email/password
registration (A1), Google OAuth (A2), and magic link login (A3). Each auth path
should follow the one-field-per-screen pattern:

- Step 1: Email address only. Determine if returning user or new registration.
- Step 2 (new user): Full name.
- Step 3 (new user): Password creation.
- Step 4 (new user): Organization selection or creation.
- Step 5 (Google OAuth): Profile completion gate for any missing fields.

Never present email, password, and name on a single registration form. The wide age
range of Fold's users (pastors in their 60s through to young adult volunteers) means
cognitive load per screen must stay minimal.

**Assertive, outcome-describing CTAs.** Replace generic button labels throughout:

| Instead of | Use |
|---|---|
| Submit | Create event |
| Next | Continue to field setup |
| Save | Save and start scanning |
| Send | Begin email countdown |
| Delete | Remove from this event |
| OK | Understood |
| Cancel | Go back |

This is especially important for the email countdown flow. The action to initiate a
sequence is irreversible after the 1-hour window. The CTA should read "Start 1-hour
countdown" not "Send" or "Schedule." The gravity of the action must be communicated
through the label itself.

**Review screens before every consequential action.** Before starting an email
sequence, the user should see a review screen showing:

- Template preview (collapsed, tappable to expand).
- Recipient count and breakdown (language, defective exclusions).
- Schedule details (relative delay or absolute date/time).
- An "Edit" link on each section that returns to the relevant configuration step.

This pattern should also apply before: closing an event (show record count and
implications), delegating admin access (show permissions being granted and expiry
date), and bulk operations on records.

**Collapsed completed steps in multi-step flows.** The field configuration flow, event
creation flow, and email sequence setup flow should all show completed steps as
collapsed summary cards at the top of the current step. This provides context ("I am
setting up email for the 'Easter Service 2026' event with 47 records") without
requiring backward navigation.

**Radio-button selection for destructive or consequential choices.** When an admin
chooses to hibernate an event (B4), handle a duplicate record (H7/H8), or select a
household email handling option (H10), present the choices as a radio-button list with
a separate confirmation button below. Do not use swipe-to-delete, hold-to-delete, or
inline destructive buttons.

Example for household email handling (H10):

```
How should emails be sent to this household?

( ) Send to the shared email address once
( ) Send a separate email for each person
( ) Let each person choose during form submission

[Confirm selection]
```

**Offline resilience feedback for scanning.** Feature D6 specifies IndexedDB offline
resilience. When the device is offline during scanning, show a persistent but
non-intrusive banner at the top of the scan screen: "Scans are being saved locally.
They will upload when you reconnect." Do not use a modal or block the scanning flow.
The scanner should never stop scanning because of network status.

---

## 3. Accessibility and Inclusivity

### 3.1 Observed Patterns

Touch targets are generous at minimum 50px button height. Radio buttons are large
(24px diameter). Full-width rows are tappable across their entire area, not just on
the text label. Text contrast is excellent with pure black on white backgrounds; gray
is reserved exclusively for secondary helper text that is not critical.

Every icon in the navigation bar is paired with a visible text label. Font sizes never
drop below 13px, with most body content at 15-17px. Section headers are descriptive
and spelled out, never abbreviated. Bottom navigation labels remain permanently
visible rather than being hidden behind gestures.

Helper text under form inputs explains the purpose and context of the requested
information, building trust by answering "why" before the user has to ask.

### 3.2 Recommendations for Fold

**Minimum touch target: 48px height, full-width tappable rows.** This is non-
negotiable given Fold's user base. Pastors and older church members will use this app
on devices with varying screen sizes. Every interactive element must meet this
threshold. Specific applications:

- Scan button on the camera screen: at minimum 64px, ideally 72px. This is the most
  frequently tapped element in the entire app and is used in time-sensitive
  situations.
- Record list items: full-width tappable rows, minimum 56px height, with clear
  separation between items.
- Radio buttons in selection lists: 24px diameter minimum with a tappable area
  extending to the full row width and height.
- Tab bar icons: 48px touch target minimum, with visible text labels always shown.

**Font size minimums.** Establish and enforce these minimums across the entire app:

| Element | Minimum size | Recommended |
|---|---|---|
| Body text | 15px | 16px |
| Secondary/helper text | 13px | 14px |
| Section headers | 17px | 18px |
| Screen titles | 22px | 24px |
| Button labels | 15px | 16px |
| Input field text | 16px (prevents iOS zoom) | 16px |
| Tab bar labels | 10px | 11px |

The 16px minimum for input fields is critical on iOS. Any input with a font size
below 16px triggers automatic page zoom when focused, which disorients users and
breaks layout. This is a common source of usability complaints and must be prevented.

**Icon-plus-label everywhere.** No icon-only navigation elements, no icon-only action
buttons. Every icon must have an accompanying text label. This applies to:

- Bottom tab bar items (already standard, but enforce it).
- Action buttons in record detail screens (not just a pencil icon, but "Edit record").
- Scan screen controls (not just a gallery icon, but "Upload from gallery").
- Email template editor toolbar (TipTap): text labels or tooltips for every
  formatting option.

**Helper text that explains "why."** Under every form field that requests sensitive or
non-obvious information, include helper text:

- Email field on registration: "We will use this to send you event notifications and
  login links."
- Phone number on attendee form: "Optional. Used only if email delivery fails."
- Data protection consent checkbox: "Required by data protection regulations. Your
  information is stored securely and never shared outside your organization."
- Birthday field (if used): "This will not be shared publicly. It helps personalize
  follow-up communications."

This pattern is especially important for digital form submissions (features F6-F14).
Attendees filling out a form at a church event need to trust the organization with
their personal data. Every field should justify its presence.

**Color contrast and color independence.** Use pure black (#000000 or #111111) on
white (#FFFFFF) for all primary text. Reserve gray (#6B7280 or similar) exclusively
for secondary helper text, timestamps, and metadata that is not essential. Never use
color alone to communicate status:

- Defective record indicators (H3): use both a colored badge AND a text label
  ("Defective - missing email").
- Email sequence health (L3): use both color AND text/icon ("Paused," "Active,"
  "Completed").
- Language mismatch badge (H18): use both color AND an explicit label ("Language
  mismatch: form in English, record in German").

**Support for multilingual content.** Fold supports English and German (with
potential for more languages via DeepL). The UI must handle:

- German text is typically 20-30% longer than English. All containers must accommodate
  this without truncation or layout breaking.
- Right-to-left languages are not in scope for v1 but the layout system should use
  logical properties (start/end rather than left/right) to be ready.
- Language labels in the interface should use the language's own name: "Deutsch" not
  "German," "English" not "Englisch."

---

## 4. Emotional Design and Trust

### 4.1 Observed Patterns

The personality is confident, clean, professional, and approachable without being
playful or quirky. Trust is built through explicit explanations under sensitive fields,
with legal text visible but not obstructive. The design is deliberately invisible --
it does not draw attention to itself. Content and actions are the heroes.

Warmth comes from generous spacing and readable typography, not from colors or
illustrations. Consistency is extreme: every screen follows identical patterns with
zero surprises. Onboarding uses large, friendly headings in a conversational tone that
feels inviting rather than demanding.

### 4.2 Recommendations for Fold

**Establish a tone that is warm, clear, and respectful.** Fold serves a church
community. The tone should convey care without being saccharine, and authority without
being cold. Specific guidelines:

- Use full sentences in headers and descriptions. "Your event has been created" not
  "Event created!"
- Never use exclamation marks in success messages. Calm confidence reads better than
  manufactured excitement.
- Use conversational phrasing for permission requests: "Would you like to turn on
  notifications?" not "Enable push notifications."
- Address the user directly with "you" and "your" rather than passive constructions.
- Per the project's design principles: never use contractions. "You will" not
  "You'll." "It does not" not "It doesn't."

**The interface should be invisible.** Fold is a tool for managing real-world
interactions with real people. The design must never compete with the content. This
means:

- No decorative illustrations on functional screens. Save warmth for empty states and
  onboarding.
- No animated transitions that delay task completion. Transitions should be 200-250ms
  maximum.
- No branded color splashes on content screens. Reserve the brand color for primary
  CTAs and active navigation states.
- White or near-white backgrounds for all content screens. No colored cards, no
  gradient backgrounds.

**Build trust at every sensitive touchpoint.** Fold handles personal data from church
attendees -- names, email addresses, phone numbers, potentially addresses. Every data
collection point must earn trust:

- Digital form landing page (F6-F14): before any fields appear, show a brief statement
  about who is collecting the data and why. Example: "This form is managed by [Church
  Name] for [Event Name]. Your information is stored securely and used only for
  follow-up communication about this event."
- Camera permission request (D9): explain the specific purpose. "Fold needs camera
  access to scan registration cards. Photos are processed securely and stored only
  within your organization."
- Consent checkboxes (N8, N9): must be unchecked by default, clearly worded, and must
  not block the form if the user needs time to read the full privacy text (provide an
  expandable section).

**Consistency as a trust signal.** The extreme consistency observed in the reference
app is not an aesthetic choice -- it is a trust mechanism. When every screen behaves
the same way, users build confidence that they understand the system. For Fold:

- Every list screen must use the same row height, spacing, and typography.
- Every form screen must place the CTA in the same position (bottom of screen, full
  width, fixed).
- Every confirmation screen must use the same layout (summary at top, action at
  bottom).
- Every destructive action must use the same pattern (radio selection, then confirm).
- Navigation must be in the same position on every screen, with no exceptions.

**Empty states that guide, not decorate.** When an admin creates their first event and
has no records yet, the empty state should:

- Acknowledge the current state clearly: "No records yet for this event."
- Provide the immediate next action: "Start by scanning registration cards or sharing
  the digital form."
- Include a single CTA that begins the most common path.
- Avoid cute illustrations or humorous copy. Be direct and helpful.

---

## 5. Flow-Specific UX Recommendations

### 5.1 Scanning Flow (Features D1-D10)

The scanning flow is where Fold's UX must be at its absolute best. Scanners are often
volunteers at a live event, working quickly, possibly in low-light conditions, and
potentially unfamiliar with the app. The principles:

- **Speed over precision at capture time.** Align with design principle #1: "Capture
  fast, process later." The scan screen should feel like a camera, not a form. Tap to
  capture, see the count increment, capture again.
- **Live scan counter (D8)** must be large (at minimum 20px bold), positioned in a
  consistent location (top-right of camera screen), and update instantly on capture.
- **Card count prompt (D7):** at the end of a scanning session, not during. Do not
  interrupt the scanning flow to ask "how many cards are remaining?" Ask once when the
  scanner taps "Done scanning."
- **Quality feedback (D2)** must be instantaneous and non-blocking. If the image is
  blurry or too dark, show a brief overlay ("Try again -- image is not clear enough")
  and auto-dismiss after 2 seconds. Do not navigate away from the camera.
- **Offline banner (D6):** small, persistent, and calm. Never a modal. "Scans saved
  locally. Will upload when reconnected."

### 5.2 Email Countdown Flow (Features J1-J22)

This is the highest-stakes flow in Fold. A mistake here means an email goes to
potentially hundreds of church attendees. The 1-hour mandatory countdown (J2) exists
specifically to prevent rushed sends.

- **Countdown visualization:** a prominent, calm timer. Not a spinning animation. A
  static display that updates every minute: "Sending in 47 minutes." Use a warm amber
  color for the countdown state, green when ready to send.
- **Template lock notification (J11):** at T-5 minutes, show a non-dismissible banner:
  "This template is now locked. Changes are no longer possible for this send."
- **Pause/resume (J21):** a single toggle button, not a separate pause and resume
  button. Label changes based on state: "Pause countdown" or "Resume countdown."
  Restarting the full countdown on resume must be clearly communicated: "Resuming will
  restart the 1-hour countdown."
- **Pre-flight test email (J15):** surface this prominently 1 hour before the
  scheduled send. "A test email has been sent to your address. Review it before the
  countdown completes."

### 5.3 Digital Form for Attendees (Features F1-F20)

The digital form is the only part of Fold that non-admin users interact with. It must
work for anyone: any age, any technical literacy, any device.

- **Progressive disclosure (F6):** Step 1 contains only identity fields (name, email,
  optionally phone). Step 2 contains event-specific fields and consent. On desktop,
  render as a single page with clear section breaks (F9). On mobile, render as
  separate screens with a progress indicator.
- **Form language detection (F5):** auto-detect from browser locale, but provide a
  visible language toggle at the top of the form. Do not bury it in settings.
- **Confirmation page (F14):** after submission, show a clear confirmation with the
  event name and a brief message: "Thank you. Your information has been received by
  [Church Name]." Include the option to edit the submission if the multiple
  submissions toggle (F20) is enabled.
- **Abuse prevention (F16):** Turnstile and honeypot must be invisible to the user.
  No CAPTCHAs that require image selection or text entry. The form must feel
  frictionless.

### 5.4 Collaborative Scanning (Features E1-E8)

When an admin invites scanners via QR code, the onboarding for the scanner must be
near-instantaneous.

- QR scan lands on a single screen: "Join [Event Name] as a scanner."
- One field: email address.
- One button: "Start scanning."
- After tapping, the camera opens immediately. No tutorials, no welcome screens, no
  feature tours.
- The scanner should be capturing their first card within 15 seconds of scanning the
  QR code.

---

## 6. Design System Foundations

Based on the patterns observed, Fold should establish the following design system
primitives before building any screens.

### 6.1 Spacing Scale

Use a 4px base grid with the following named tokens:

| Token | Value | Use case |
|---|---|---|
| space-xs | 4px | Icon-to-label gaps, tight internal padding |
| space-sm | 8px | Between related items (label to helper text) |
| space-md | 12px | Internal card/section padding |
| space-lg | 16px | Between sections on a screen |
| space-xl | 24px | Major section separators |
| space-2xl | 32px | Screen-level vertical padding (top/bottom) |
| space-3xl | 48px | Between screen title and first content block |

### 6.2 Typography Scale

| Token | Size | Weight | Line height | Use case |
|---|---|---|---|---|
| text-xs | 11px | Regular | 16px | Tab bar labels, captions |
| text-sm | 13px | Regular | 18px | Helper text, timestamps, metadata |
| text-base | 16px | Regular | 24px | Body text, input field text, list items |
| text-lg | 18px | Semibold | 26px | Section headers, card titles |
| text-xl | 22px | Bold | 28px | Screen titles |
| text-2xl | 28px | Bold | 34px | Onboarding headings |
| text-3xl | 34px | Bold | 40px | Hero numbers (scan counter, stats) |

### 6.3 Component Inventory (Minimum Viable)

Before building screens, Fold needs these base components:

1. **NavigationBar** -- top bar with title, optional back arrow, optional right action.
2. **TabBar** -- bottom navigation with icon-plus-label items, role-aware visibility.
3. **ListRow** -- full-width tappable row, 56px minimum height, with title, optional
   subtitle, optional right chevron or badge.
4. **SectionHeader** -- left-aligned text with optional "See all" link on the right.
5. **StatRow** -- horizontal row of 2-4 stat items (value + label), evenly spaced.
6. **PrimaryButton** -- full-width, 50px height, assertive label, single brand color.
7. **SecondaryButton** -- full-width, 50px height, outlined, for non-primary actions.
8. **TextField** -- with label above, 16px input text, helper text below, error state.
9. **RadioGroup** -- vertical list of options with 24px radio buttons, full-row
   tappable.
10. **CollapsibleSection** -- accordion with header, expand/collapse, content area.
11. **Banner** -- persistent top-of-screen notification (info, warning, success).
12. **EmptyState** -- centered layout with message and single CTA.
13. **CountdownDisplay** -- large timer with status label and action button.
14. **CameraOverlay** -- alignment guide, capture button, scan counter, flash toggle.
15. **ProgressSteps** -- horizontal step indicator for multi-step flows.

### 6.4 Color Strategy

Keep the palette minimal. The interface should be content-forward, not color-forward.

| Token | Value | Purpose |
|---|---|---|
| color-text-primary | #111111 | All primary text |
| color-text-secondary | #6B7280 | Helper text, timestamps, metadata |
| color-text-inverse | #FFFFFF | Text on dark/colored backgrounds |
| color-bg-primary | #FFFFFF | All screen backgrounds |
| color-bg-secondary | #F9FAFB | Subtle section differentiation |
| color-bg-elevated | #FFFFFF | Cards, modals (with shadow) |
| color-border | #E5E7EB | Hairline dividers, input borders |
| color-brand | TBD | Primary CTA fill, active nav state |
| color-success | #059669 | Completion states, active sequences |
| color-warning | #D97706 | Countdown states, attention needed |
| color-error | #DC2626 | Errors, defective record indicators |
| color-info | #2563EB | Informational banners, links |

The brand color should be selected to work at WCAG AA contrast against white at both
the button fill (white text on brand) and link text (brand text on white) levels.
A deep blue, deep teal, or warm indigo would serve well. Avoid red (conflicts with
error states) and green (conflicts with success states).

---

## 7. Summary of Key Principles

These seven principles should guide every screen, component, and interaction in Fold:

1. **One task per screen.** Never combine unrelated actions. If in doubt, split into
   two screens.

2. **Two taps to primary task.** Every role should reach their most common action
   (scanning, reviewing records, checking email status) within two taps of opening the
   app.

3. **Explain before asking.** Every form field that requests personal data must be
   accompanied by helper text explaining why it is needed and how it will be used.

4. **Label everything.** No icon-only elements. No abbreviated headers. No mystery
   meat navigation.

5. **Confirm before consequences.** Any action that affects attendee data, sends
   communications, or changes permissions must pass through a review screen with
   inline edit capability.

6. **Consistency is trust.** Every list, form, button, and navigation element must
   follow the same patterns. Zero exceptions build maximum confidence.

7. **Design for the least technical user.** If a 65-year-old pastor picking up a phone
   for the first time today can complete the task, the design is correct. If they
   cannot, simplify further.

---

*Analysis produced by Agent 3: UX Strategy Analyst. Patterns extracted from structural
and interaction analysis of 66 reference iOS screens. No proprietary content, brand
names, or copyrighted material has been reproduced.*
