# Design Patterns Library
## Extracted from 66 Inspiration Screenshots

Each pattern is described abstractly with its structure, behavior, and Fold application. No content or branding from the source is reproduced.

---

## 1. Navigation Patterns

### P-01: Bottom Tab Bar
**Structure:** 4-5 equally spaced items, each with outlined icon (inactive) or filled icon (active) + text label below. No top border — bar floats on white/frosted glass.
**Behavior:** Tap switches tabs instantly. Active tab text uses accent color. Icons transition outline → fill (not just color change).
**Fold use:** Events, Scan, Review, Profile tabs in `/capture`.

### P-02: Back Navigation Header
**Structure:** Left-aligned back chevron (`<`), centered or left-aligned title, optional right-side action (share, edit, close X).
**Behavior:** Back chevron navigates to parent. Title is semibold, 17px. Close X dismisses modals/sheets.
**Fold use:** All sub-pages within capture flow. Event detail, record detail, settings.

### P-03: Segmented Tab Bar
**Structure:** 2-3 text tabs horizontally, active tab has underline. Sits below the navigation header.
**Behavior:** Tap switches content below. Active underline animates to selected tab position.
**Fold use:** "Stays / Experiences" style → could be used for "Scanned / Digital" record filters.

---

## 2. Content Patterns

### P-04: Hero Content Card
**Structure:** Large image (full-width, rounded corners, 12-16px radius), overlaid with status badge (top-left), heart/save icon (top-right). Below: title (headline weight), metadata line (secondary color), price/stat line.
**Behavior:** Entire card is tappable. Press scales card to 0.98. Pagination dots if carousel.
**Fold use:** Event cards on home screen. Image could be event type icon or scan preview.

### P-05: Stat Row (Horizontal Metrics)
**Structure:** 2-4 stat blocks in a horizontal row, each with large number (title2 weight) + small label below (caption). Separated by thin vertical dividers.
**Behavior:** Static display, no interaction. Numbers can use tabular figures for alignment.
**Fold use:** Event detail page: "74 records | 52/22 scan/digital | 3 flagged"

### P-06: Icon + Text List Row
**Structure:** Leading icon (20px, secondary color) + primary text (body weight) + trailing chevron (14px, tertiary color). Full-width, 52px min height. Hairline divider between rows (inset 20px from edges).
**Behavior:** Entire row tappable. Tap highlight on press (subtle gray background flash). Chevron indicates drill-down.
**Fold use:** Action rows on event detail: "Continue scanning ›", "Share online form ›", "View flagged records ›"

### P-07: Section with Show More
**Structure:** Section heading (headline weight) + 3-5 visible items + "Show all N items" button (text style, with count).
**Behavior:** Tapping "Show all" expands the list inline or navigates to a full-page view.
**Fold use:** Record lists, activity timeline, field configuration list.

### P-08: Profile / Entity Card
**Structure:** Circular avatar (56-64px) with adjacent stats in a vertical column (number + label). Below: name (title weight) + role/designation badge. Then a list of icon + text info rows.
**Behavior:** Static, but sub-elements may link (e.g., "22 reviews" is tappable).
**Fold use:** User profile page, scanner info in collaborative scanning, event organizer details.

### P-09: Review / Feedback Card
**Structure:** Circular avatar (40px) + name (headline weight) + date (caption, secondary). Below: body text paragraph. Star rating may precede. Cards stacked with spacing between.
**Behavior:** Static display. "Show more" truncates long text after 3 lines.
**Fold use:** Activity timeline entries, delegation history, record edit log.

### P-10: Progress Bar / Rating Breakdown
**Structure:** Label (left-aligned) + horizontal bar (right-aligned, fills proportionally) + numeric value (right-aligned). Stacked vertically for multiple criteria.
**Behavior:** Static display. Bar width represents percentage.
**Fold use:** AI extraction confidence breakdown, email delivery rates, processing progress.

---

## 3. Form Patterns

### P-11: Stacked Field Form
**Structure:** Fields stacked vertically with 16-20px gap. Each field has: floating label or caption label above + input area (52px height, gray bg, 10px radius, no border). Fields grouped by theme with section headings.
**Behavior:** Focus state adds blue ring (3px, translucent). Keyboard pushes content up. "Next" in keyboard moves to next field.
**Fold use:** Registration, event creation, profile completion, record editing.

### P-12: Inline Validation
**Structure:** Below the input field: validation icon (checkmark green or X red, 14px) + validation message (body size, colored). Input border changes to match (green ring or red ring).
**Behavior:** Validates on blur (first interaction), then real-time after first error. Multiple rules shown as a checklist.
**Fold use:** Password strength, email format, required field validation, phone number format.

### P-13: Stepper Control
**Structure:** Minus button (–) + numeric value (centered, headline weight) + Plus button (+). Horizontal arrangement, 44px touch targets for buttons.
**Behavior:** Tap ±1, long-press for rapid increment. Value has min/max constraints. Disabled state grays out buttons at limits.
**Fold use:** Expected attendee count, card count prompt before scanning.

### P-14: Segmented Selector (Chip Group)
**Structure:** Horizontal row of pill-shaped chips (9999px radius). Selected chip is filled (black bg, white text). Unselected chips have 1px border.
**Behavior:** Single-select: tap one deselects others. Multi-select: tap toggles individual chips.
**Fold use:** Language selector ("English | German | Both"), date range flexibility, filter pills for record status.

### P-15: Dropdown / Country Picker
**Structure:** Full-width field (52px height) with label above, current value displayed, trailing chevron-down icon. Tapping opens native picker or bottom sheet list.
**Behavior:** Selected value replaces placeholder. Chevron rotates on open.
**Fold use:** Country selector on registration, language selector, event status dropdown.

### P-16: Radio Selection List
**Structure:** Full-width rows, each with text label + trailing radio circle (24px). Selected radio is filled black. Rows separated by hairline dividers.
**Behavior:** Single select — tapping one deselects others. Bottom CTA activates after selection.
**Fold use:** Reporting reasons, household email handling options, delegation member selection.

### P-17: Checkbox List with Toggle Rows
**Structure:** Label (left) + description below (secondary color) + toggle switch (right, iOS style) or checkbox (right, rounded square). Rows separated by dividers.
**Behavior:** Toggle switches animate smoothly (200ms). Checkboxes fill with checkmark.
**Fold use:** Field detection toggles, notification preferences, feature flags in admin.

---

## 4. Action Patterns

### P-18: Sticky Bottom CTA Bar
**Structure:** Full-width bar fixed to bottom of screen. Contains: left side info (price, count, date) + right side primary CTA button (accent fill, 12px radius). Thin top border or shadow for separation.
**Behavior:** Always visible while scrolling. CTA text describes the outcome ("Show 29 places", "Request to book").
**Fold use:** "Process N records" on scan review, "Show N results" on filtered views, "Start scanning" on pre-scan setup.

### P-19: Dual Action Stack
**Structure:** Primary CTA (full-width, accent fill) stacked above secondary CTA (full-width, bordered or text only). 12px gap between.
**Behavior:** Primary action is the recommended path. Secondary is the escape/alternative.
**Fold use:** "Save and resolve" (primary) + "Skip for now" (secondary) on record detail. "Start scanning" + "Upload from gallery".

### P-20: Clear All / Show Results Footer
**Structure:** Left-aligned "Clear all" text link + right-aligned "Show N results" primary button. Fixed to bottom of filter/modal views.
**Behavior:** "Clear all" resets all selections. "Show N" dynamically updates count as filters change.
**Fold use:** Filter views for records, events list, any filterable screen.

### P-21: Confirmation Screen
**Structure:** Large display heading (conversational: "Message sent!"), avatar/icon, body paragraph explaining what happens next, primary CTA + secondary CTA below.
**Behavior:** Appears after completing an action. Cannot go back — only forward through CTAs.
**Fold use:** "Processing complete!", "Event created!", "Scan session ended", "Account created".

### P-22: Error / Failure Screen
**Structure:** Large display heading (direct, not apologetic), body paragraph explaining what happened and what to do, single CTA button ("OK" or "Try again").
**Behavior:** Full-screen takeover. No back navigation — only the CTA to proceed.
**Fold use:** Database connection error, processing failure, permission denied, session expired.

---

## 5. Overlay Patterns

### P-23: Bottom Sheet
**Structure:** White panel sliding up from bottom. Top handle bar (40px wide, 4px height, centered, gray). Rounded top corners (16-20px). Content scrolls within. Background dims.
**Behavior:** Swipe down to dismiss. Tap dimmed background to dismiss. Can snap to half-height or full-height.
**Fold use:** QR code sharing, scanner invitation, filter panels, record details on mobile.

### P-24: Full-Screen Modal
**Structure:** Takes over entire screen. Close X in top-left (not back chevron). Title centered in header. Own scroll context.
**Behavior:** X dismisses back to previous screen. No navigation within — linear flow.
**Fold use:** Create event flow, scan blank form camera, email template editor.

### P-25: Inline Expandable Section (Accordion)
**Structure:** Section heading (headline weight) + trailing chevron-down. Tapping expands to reveal content below (body text, sub-list, or nested fields). Chevron rotates 180° to point up.
**Behavior:** Only one section open at a time (accordion behavior) or all independently toggleable.
**Fold use:** FAQ-style help, record defective reasons detail, event settings groups, field configuration categories.

---

## 6. Feedback Patterns

### P-26: Skeleton Loading
**Structure:** Gray rounded rectangles (matching the shape and position of expected content). Cards, text lines, avatars all have skeleton equivalents.
**Behavior:** Pulsing opacity animation (0.4 → 0.7 → 0.4, 1.5s loop). Never a centered spinner.
**Fold use:** Event list loading, record list loading, dashboard stats loading, any server-fetched content.

### P-27: Empty State
**Structure:** Centered vertically: large icon (48px, secondary color) + heading (headline weight) + description (body, secondary color, max 2 lines) + optional primary CTA button.
**Behavior:** Static. CTA navigates to the action that would populate this view.
**Fold use:** "No events yet" + "Create event", "No flagged records" + icon, "No scans" + "Start scanning".

### P-28: Success Confirmation (Inline)
**Structure:** Heading with exclamation/checkmark + avatar/icon + paragraph describing next steps + dual CTA stack.
**Behavior:** Replaces the previous content. Forward-only navigation.
**Fold use:** After resolving a record, after completing a scan session, after sending emails.

### P-29: Toast / Snackbar
**Structure:** Small rounded card (12px radius) floating at bottom of screen (above tab bar). Icon + short message text. Auto-dismisses after 3-4 seconds.
**Behavior:** Slides up from bottom, fades out after timeout. Can be manually dismissed by swipe.
**Fold use:** "Scan captured", "Record resolved", "Saved offline", "Synced 3 scans".

---

## 7. Data Display Patterns

### P-30: Key-Value List
**Structure:** Left-aligned label (secondary color) + right-aligned value (primary color, sometimes semibold). Full-width rows with hairline dividers. "Edit" link on right for editable sections.
**Behavior:** Static display or tappable to edit. Grouped with section headings.
**Fold use:** Event details (date, language, expected attendees), user profile info, record field values.

### P-31: Search with Results
**Structure:** Pill-shaped search input (gray bg, 44px height, 9999px radius) with magnifying glass icon. Results appear as list rows below with icon/category indicators on the right.
**Behavior:** Results filter in real-time as user types. Recent searches shown on empty state.
**Fold use:** Record search (by name/email/phone), event search, GDPR person search.

### P-32: Two-Column Grid
**Structure:** 2 equal-width cards in a row with 12px gap. Cards have image (top, fills width) + title + subtitle below. Rounded corners (12px).
**Behavior:** Tappable cards. Masonry-style if heights vary.
**Fold use:** Could be used for wishlists/collections, but likely not needed in Fold capture. Possible for event type selection.

---

## 8. Fold-Specific Pattern Recommendations

### P-33: Scan Counter Overlay
**Structure:** Floating pill (top-right of viewfinder) showing "12 / 30" in accent background. Animate on count change (scale bounce).
**Behavior:** Updates in real-time as cards are captured. Shows progress toward expected count.
**Maps to:** D8 (Live scan counter)

### P-34: Processing Progress
**Structure:** Circular progress ring (80px) with percentage in center. Below: "23 of 50 processed" text + estimated time. Feed of completed items below.
**Behavior:** Ring fills clockwise. Feed items appear with fade-in as each completes. Status icons (check/x) per item.
**Maps to:** G7-G8 (Estimated processing time, wait or leave)

### P-35: Email Countdown Timer
**Structure:** Large countdown display (MM:SS or HH:MM remaining). Status text below. Pause/Resume and Cancel buttons.
**Behavior:** Timer counts down in real-time. Pause stops the timer. Resume restarts the full 1-hour countdown. Cancel aborts.
**Maps to:** J2 (Mandatory 1-hour countdown)

### P-36: Defective Record Badge
**Structure:** Red badge (9999px radius) with count. Appears on page headers, tab bar items, and event cards.
**Behavior:** Badge pulses briefly when count changes. Disappears when count reaches 0.
**Maps to:** H1 (Defective record pipeline)

---

## Pattern-to-Screen Mapping

| Screen | Patterns Used |
|---|---|
| Capture Home | P-01, P-04, P-05, P-27 |
| Event Detail | P-02, P-05, P-06, P-25 |
| Pre-Scan Setup | P-02, P-13, P-06, P-19 |
| Scanner Viewfinder | P-33, P-19 |
| Flagged Records | P-02, P-06, P-14, P-36 |
| Record Detail | P-02, P-11, P-12, P-19 |
| Create Event | P-02, P-11, P-13, P-14 |
| Field Detection | P-02, P-17, P-19 |
| Share Form | P-02, P-30, P-19 |
| Processing | P-02, P-34, P-19 |
| Sign In | P-11, P-19 |
| Register | P-11, P-15, P-19 |
| Profile | P-01, P-08, P-06 |
| Empty States | P-27 (all list screens) |
| Error States | P-22 (all error screens) |
