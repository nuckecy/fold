# Agent 2: Frontend Engineering Analysis

> **Source:** 66 iOS app screenshots from the inspiration folder, cross-referenced with Agent 1 visual analysis
> **Purpose:** Define the component architecture, layout systems, interaction patterns, and implementation strategy for Fold
> **Date:** 2026-04-03
> **Scope:** Component inventory, layout architecture, interaction engineering, responsive strategy, accessibility implementation
> **Stack context:** Next.js 14+ (App Router), TypeScript, Tailwind CSS (implied by modern Next.js), React Server Components where applicable

---

## 1. Component Inventory

This section catalogs every distinct component type observed across the 66 screens, organized by atomic design level. Each component includes its structural specification, variant states, and recommended implementation approach.

### 1.1 Atoms (Primitive Elements)

#### Button: Primary

The primary call-to-action button appears on nearly every action screen. It is the single most repeated interactive element.

| Property | Specification |
|---|---|
| Width | Full-width (fills parent container minus page padding) |
| Height | 50px |
| Border radius | 12px |
| Background | Accent fill color (warm coral) |
| Text | White, 16px, semibold (600), centered |
| Padding | 0 horizontal (text is centered), height defines vertical |
| States | Default, Pressed (scale 0.97), Disabled (40% opacity), Loading (spinner replaces text) |
| Position | Typically pinned to bottom of screen or bottom of bottom sheet |

Implementation note: This button should be a single reusable component with a `variant` prop. The pressed state uses CSS `transform: scale(0.97)` with `transition: transform 100ms ease-out`. The disabled state reduces the entire button opacity rather than changing the background color -- this preserves the accent color association even when inactive.

#### Button: Secondary

The secondary button appears alongside or as an alternative to the primary CTA. It is used for actions like "Skip", "Cancel", or alternative paths.

| Property | Specification |
|---|---|
| Width | Full-width (same as primary) |
| Height | 50px |
| Border radius | 12px |
| Background | Transparent |
| Border | 1px solid near-black (#222222) |
| Text | Near-black (#222222), 16px, semibold (600), centered |
| States | Default, Pressed (scale 0.97, border and text shift to 60% opacity), Disabled (40% opacity) |

Implementation note: The secondary button must never appear alone as the only action on a screen. It always accompanies or follows a primary button. When stacked vertically (primary above, secondary below), use 12px gap between them.

#### Button: Text / Tertiary

A text-only button with no border or fill. Used for low-priority actions: "Show all", "Learn more", "Clear".

| Property | Specification |
|---|---|
| Width | Fit content (not full-width) |
| Height | Auto (based on text line-height + padding) |
| Min height | 44px (touch target compliance) |
| Background | None |
| Text | Near-black (#222222) or accent color, 16px, semibold (600), with optional underline |
| Padding | 12px horizontal, 10px vertical (ensures 44px touch target) |
| States | Default, Pressed (opacity 0.6) |

#### Input: Text Field

The standard text input. Used across registration, event creation, field configuration, search, and the digital form.

| Property | Specification |
|---|---|
| Height | 52px (internal screens), 56px (public-facing digital form) |
| Border radius | 10px |
| Border | 1px solid #E0E0E0 (default), 1px solid #222222 (focused), 1px solid error color (invalid) |
| Background | #F7F7F7 or #FFFFFF (context-dependent) |
| Text | Near-black (#222222), 16px, regular (400) |
| Placeholder | Mid-gray (#999999), 16px, regular (400) |
| Padding | 16px horizontal |
| Label | Positioned above the field, 14-15px, semibold (600), 6px gap below label |
| Helper text | Below the field, 14-15px, secondary gray, 4px gap above helper |
| Error text | Below the field, 14-15px, error color, replaces helper text, accompanied by inline icon |
| Validation icons | Inside the field, right-aligned, 20px: green checkmark (valid), red X (invalid) |

Implementation notes:
- Label is a separate element above the input, not a floating label inside. Floating labels create accessibility challenges and introduce animation complexity that does not add value for Fold's use case.
- The focus state transition (`border-color`) should animate over 150ms ease-out.
- For the public digital form, the input height increases to 56px and font size to 17px. This should be a prop-driven variant, not a separate component.
- Validation icons appear only after the user has interacted with the field (on blur or after first keystroke, depending on context). They should never appear on initial render.

#### Input: Search Field

A distinct variant of the text input, used for searching records, events, or email templates.

| Property | Specification |
|---|---|
| Height | 48px |
| Border radius | 24px (full pill shape) |
| Background | #F2F2F2 (gray fill, no border) |
| Border | None (default), 1px solid #222222 (focused -- optional) |
| Icon | Search icon (20px), left-aligned, mid-gray, 12px from left edge |
| Text | 16px, regular, near-black |
| Placeholder | Mid-gray, 16px |
| Padding | 40px left (icon + gap), 16px right |
| Clear button | X icon appears at right edge when input has value, 20px, mid-gray |

#### Input: Stepper (Numeric)

A horizontal stepper for numeric input. Used for guest counts, expected attendee ranges, and similar bounded numeric values.

| Property | Specification |
|---|---|
| Layout | Horizontal row: [Minus button] [Value] [Plus button] |
| Button size | 36px circle (or 36px rounded square) |
| Button border | 1px solid #CCCCCC (enabled), 1px solid #E8E8E8 (disabled when at min/max) |
| Button icon | Minus (-) or Plus (+), 16px, 1.5px stroke |
| Value | Centered between buttons, 18px, semibold (600), minimum 48px width |
| Total height | 44px (touch target) |
| Total width | Fit content, typically 120-140px |

#### Chip / Pill

Small, rounded, selectable elements used for category filtering and tag display.

| Property | Specification |
|---|---|
| Height | 36-40px |
| Border radius | 9999px (full pill) |
| Border | 1px solid #E0E0E0 (unselected), 1px solid #222222 (selected) |
| Background | Transparent (unselected), #222222 (selected) |
| Text | 14px, regular (unselected), 14px, regular, white (selected) |
| Padding | 12-16px horizontal |
| Icon | Optional, 18-20px, left of text, 6px gap |
| Layout context | Always in a horizontal scrolling row, never wrapped |

Implementation note: The horizontal scroll container should use `overflow-x: auto` with `-webkit-overflow-scrolling: touch`. Hide the scrollbar with CSS (`scrollbar-width: none; -ms-overflow-style: none; ::-webkit-scrollbar { display: none }`). The scroll container should have the same horizontal page padding on the first and last item to maintain visual alignment with the content above and below.

#### Radio Button

| Property | Specification |
|---|---|
| Size | 24px diameter circle |
| Border | 2px solid #CCCCCC (unselected), none (selected) |
| Fill | None (unselected), solid near-black #222222 (selected) |
| Inner dot | None. The entire circle fills on selection -- no inner/outer ring pattern |
| Touch target | 44px minimum (achieved via padding on the parent row) |

#### Checkbox

| Property | Specification |
|---|---|
| Size | 22-24px square |
| Border radius | 4-6px (slightly rounded corners) |
| Border | 2px solid #CCCCCC (unchecked), none (checked) |
| Fill | None (unchecked), solid near-black #222222 (checked) |
| Checkmark | White, 2px stroke, centered within the filled square |
| Touch target | 44px minimum (via row padding) |

#### Toggle Switch

| Property | Specification |
|---|---|
| Track size | 51px wide, 31px tall (standard iOS dimensions) |
| Track radius | 9999px (full pill) |
| Track color | #E0E0E0 (off), accent color or #222222 (on) |
| Thumb size | 27px circle |
| Thumb color | White, with subtle shadow |
| Thumb position | Left (off), right (on) |
| Transition | 200ms ease-in-out for thumb slide and track color change |

#### Divider

| Property | Specification |
|---|---|
| Weight | 0.5px |
| Color | #E8E8E8 to #EEEEEE |
| Inset | Starts at content edge (after page padding), or after icon/avatar column |
| Never | Full-bleed. The divider always respects at least the page padding margin. |

Implementation note: Use a `<div>` with `border-top: 0.5px solid var(--color-border)` and appropriate margin-left. Do not use `<hr>` as it introduces unwanted default browser styling.

#### Badge / Status Indicator

Small colored indicators used for record status, email delivery status, and notification counts.

| Property | Specification |
|---|---|
| Height | 22-26px |
| Border radius | 9999px (pill) or 4px (rounded rect, for status labels) |
| Background | Status color at 10-15% opacity |
| Text | Status color at 100%, 12-13px, semibold (600) |
| Padding | 8px horizontal, 4px vertical |
| Dot variant | 8px circle, solid status color, no text |

---

### 1.2 Molecules (Compound Components)

#### Card: Standard

The primary container for grouped information. Used for events, records, email sequences, scan batches, and settings groups.

| Property | Specification |
|---|---|
| Background | #FFFFFF |
| Border radius | 12-16px |
| Shadow | `0 1px 3px rgba(0,0,0,0.04)` (resting), `0 2px 8px rgba(0,0,0,0.06)` (elevated/hovered) |
| Border | None (shadow provides edge definition), or 0.5px #EEEEEE on flat backgrounds |
| Padding | 16-20px internal |
| Gap between cards | 12-16px vertical |

Internal structure (typical):
```
[Card]
  [Header row: Title (semibold) ... Right action/chevron]
  [Divider (optional)]
  [Body content: text, metadata, or nested rows]
  [Footer row (optional): secondary action or status]
```

Variants needed for Fold:
- **Event card:** Title, date, attendee count badge, status badge, chevron
- **Record card:** Name, email (truncated), source badge (scan/digital), status indicator
- **Email sequence card:** Sequence name, step count, next scheduled time, status
- **Scan batch card:** Image thumbnail, count, processing status, timestamp
- **Defective record card:** Same as record card but with left-border accent in error color (2px)

#### Card: Image Gallery / Selection

A two-column grid card used for image galleries and type selection (property types, event types).

| Property | Specification |
|---|---|
| Layout | CSS Grid, 2 columns, equal width |
| Gap | 12px (both column and row) |
| Each cell | Image or icon on top, label below, border radius 12px |
| Selection | 2px border in near-black when selected, checkmark badge in top-right corner |
| Aspect ratio | 1:1 or 4:3 depending on content |

#### List Row

A single row in a vertical list. Used for settings, navigation menus, detail attributes, filter options.

| Property | Specification |
|---|---|
| Height | Auto, minimum 52px (touch target + padding) |
| Padding | 16px vertical, 0 horizontal (parent provides page padding) |
| Layout | Flexbox row: [Left icon/avatar (optional)] [Title + subtitle column] [Right element] |
| Left icon | 24px, mid-gray or near-black, 12px gap to text |
| Left avatar | 40px circle, 12px gap to text |
| Title | 16px, regular or semibold |
| Subtitle | 14-15px, secondary gray, 2px below title |
| Right element | Chevron (>), toggle switch, badge, value text, or nothing |
| Separator | 0.5px divider below, inset from left icon/avatar edge |

Implementation note: The list row should be a single component with composable left/right slots. Use React children or render props for the slot content. The separator should be rendered as a pseudo-element or as a conditional last-child exclusion.

#### Form Field Group

A labeled form field with optional helper text and validation state. This wraps the input atom.

| Property | Specification |
|---|---|
| Layout | Vertical stack |
| Label | Above input, 14-15px, semibold, near-black, 6px margin-bottom |
| Input | Standard text input atom |
| Helper text | Below input, 14-15px, secondary gray, 4px margin-top |
| Error text | Replaces helper, error color, with error icon |
| Gap between field groups | 16px (forms should feel spacious, not cramped) |

#### Sticky Bottom Bar

A persistent bar pinned to the bottom of the screen, above the tab bar (if present) or at the absolute bottom (in modals/detail views).

| Property | Specification |
|---|---|
| Height | Auto, typically 70-90px including padding |
| Background | #FFFFFF |
| Padding | 16px horizontal (matches page padding), 12px vertical |
| Shadow | `0 -1px 3px rgba(0,0,0,0.06)` (upward shadow to separate from content) |
| Border | None (shadow provides separation) |
| Layout | Flexbox row: [Left info (price, summary)] [Right CTA button] |
| Left info | Primary value in semibold, secondary label in regular gray |
| Right CTA | Primary button, but not full-width -- width fits content + generous padding |
| Safe area | Additional bottom padding for devices with home indicator (env(safe-area-inset-bottom)) |

Fold applications:
- Event detail: "N records" on left, "Start Scanning" CTA on right
- Email sequence: "N recipients" on left, "Schedule Send" CTA on right
- Record detail: Status on left, "Mark Resolved" CTA on right
- Digital form: Progress indicator on left, "Next Step" CTA on right

#### Expandable Section / Accordion

A collapsible section that reveals content on tap. Used for progressive disclosure in settings, detail views, and FAQs.

| Property | Specification |
|---|---|
| Header | Full-width row: [Title (semibold)] [Chevron-down icon (rotates to chevron-up)] |
| Header height | Minimum 52px |
| Content | Hidden by default, revealed with height animation (225ms ease-in-out) |
| Content padding | 0 top (flush with header divider), 16px bottom |
| Divider | 0.5px below header, always visible regardless of state |
| Chevron | 20px, rotates 180 degrees on expand, transitions with content |

Implementation note: Use CSS `max-height` transition or a JavaScript-measured approach for smooth height animation. The `max-height` approach is simpler but can feel sluggish if the max value is too high. For Fold, prefer using `grid-template-rows: 0fr / 1fr` transition which provides true content-height animation without JavaScript measurement.

---

### 1.3 Organisms (Complex Components)

#### Bottom Sheet / Modal

A slide-up panel that overlays the main content. Used for filters, confirmations, selection lists, and secondary actions.

| Property | Specification |
|---|---|
| Background | #FFFFFF |
| Border radius | 20px top-left, 20px top-right, 0 bottom |
| Overlay | rgba(0,0,0,0.4), covers entire screen behind the sheet |
| Grabber | 36px wide, 4px tall, #D5D5D5, centered, 12px from top |
| Content start | 20px below grabber |
| Padding | 20-24px horizontal (matches page padding) |
| Close button | X icon, 24px, top-right corner, 44px touch target |
| Animation | Slide up from bottom, 300ms ease-out (open), 200ms ease-in (close) |
| Scroll | Content scrolls independently within the sheet if it exceeds viewport |
| Max height | 90% of viewport height (always leave status bar visible) |

Variants:
- **Filter sheet:** Title + tabs at top, scrollable content, sticky "Show N results" CTA at bottom
- **Confirmation sheet:** Icon/illustration + heading + description + primary/secondary button pair
- **Selection sheet:** Title + scrollable list of radio/checkbox rows + CTA

Tabs within bottom sheet:
| Property | Specification |
|---|---|
| Style | Text-only with underline indicator |
| Layout | Horizontal row, left-aligned or evenly distributed |
| Active tab | Near-black text, 2px underline in near-black, semibold |
| Inactive tab | Mid-gray text, no underline, regular weight |
| Underline animation | Slides horizontally to follow active tab, 200ms ease-in-out |
| Height | 44px (tab row) |

#### Navigation Header

The top navigation area of each screen.

| Property | Specification |
|---|---|
| Height | 44-56px (below status bar) |
| Background | Transparent or #FFFFFF (becomes opaque on scroll) |
| Left action | Back chevron (<), 24px, near-black, 44px touch target |
| Title | Centered (for standard screens) or left-aligned large (for root screens) |
| Centered title | 17px, semibold |
| Large title | 28-34px, bold, left-aligned, sits below the nav bar proper, scrolls with content |
| Right action(s) | Icon buttons (share, more, filter), 24px, 44px touch target each |

Implementation note: The large title pattern (left-aligned, scrolls away) is used on root screens (dashboard, event list, settings). Sub-screens (detail views, forms) use the centered title pattern. In Next.js, this can be handled with a layout-level header component that accepts a `variant` prop.

#### Bottom Tab Bar

The persistent navigation bar at the bottom of the app.

| Property | Specification |
|---|---|
| Height | 84px (includes safe area padding on modern devices) |
| Background | #FFFFFF |
| Border | None (no top border line) |
| Shadow | None (relies on content scrolling behind it for perceived separation) |
| Layout | 5 equal-width items, flexbox row, justify-content: space-around |
| Each item | Vertical stack: [Icon 24px] [Label 10-11px, 4px below icon] |
| Active item | Filled icon variant + near-black text (or accent color text) |
| Inactive item | Outlined icon + mid-gray text |
| Touch target | Each item spans full width/height of its column (minimum 44x44px) |
| Position | Fixed to bottom of viewport |
| Safe area | `padding-bottom: env(safe-area-inset-bottom)` for home indicator |

Fold tab items (5):
1. Events (calendar icon)
2. Scan (camera icon -- consider making this the center item, slightly emphasized)
3. Records (users/list icon)
4. Emails (mail icon)
5. Settings (gear icon)

Implementation note: In a Next.js web app, the tab bar will be rendered as a fixed-position component in the root layout. Navigation between tabs should use Next.js `<Link>` components with `prefetch` enabled for instant tab switches. The active state should be determined by the current pathname.

#### Filter Panel

A structured filtering interface, typically presented in a bottom sheet.

| Property | Specification |
|---|---|
| Layout | Vertical stack of filter sections |
| Section header | 18-20px, semibold, near-black |
| Section gap | 24px between sections |
| Filter types | Checkbox list, radio list, range slider, stepper, chip row |
| Sticky footer | "Clear all" text button (left) + "Show N results" primary button (right) |
| Footer shadow | `0 -1px 3px rgba(0,0,0,0.06)` |
| Result count | Updates dynamically as filters change |

#### Empty State

Displayed when a list or section has no content. Used for first-time users, empty search results, and zero-state screens.

| Property | Specification |
|---|---|
| Layout | Centered vertically and horizontally within the content area |
| Heading | 22-24px, semibold, near-black, centered |
| Description | 16px, regular, secondary gray, centered, max-width 280px |
| CTA (optional) | Primary or secondary button, below description, 24px gap |
| Illustration (optional) | Simple line illustration or icon, 64-80px, above heading, 24px gap |
| Vertical position | Slightly above true center (approximately 40% from top) for visual comfort |

Fold empty states needed:
- No events yet (first-time user)
- No records for this event
- No email sequences configured
- No scan batches uploaded
- No defective records (positive empty state: "All records are clean")
- No search results (with suggestion to adjust filters)
- No team members invited

---

## 2. Layout Architecture

### 2.1 Page Structure

Every screen in the app follows a consistent vertical structure. This structure should be encoded as a reusable layout component in Next.js.

```
[Status Bar - system controlled]
[Navigation Header - 44-56px]
[Scrollable Content Area - flex: 1]
[Sticky Bottom Bar (conditional) - 70-90px]
[Tab Bar (conditional) - 84px]
```

The scrollable content area is the only section that scrolls. The navigation header, sticky bottom bar, and tab bar are all fixed in position. This creates a "content sandwich" where the user's attention is focused on the scrollable middle.

### 2.2 Content Width and Padding

| Context | Max Width | Horizontal Padding |
|---|---|---|
| Mobile (< 768px) | 100% of viewport | 20px each side |
| Tablet (768-1024px) | 100% of viewport | 24-32px each side |
| Desktop (> 1024px) | 480px centered | Auto margins |
| Public digital form | 480px centered | 24px each side within the centered column |

Implementation note: Fold is mobile-first, but it runs as a Next.js web app accessed via browser. On desktop, the entire app should be rendered within a centered 480px column (simulating a mobile device width) with a neutral background (#F2F2F2) on either side. This maintains the intended proportions and prevents wide-screen layout issues. The digital form (public-facing) should follow the same pattern. Dashboard screens (L1-L16) may eventually need wider desktop layouts, but that is a Phase 8 concern.

### 2.3 Flexbox Layout System

All layouts observed use simple flexbox patterns. No CSS Grid is required for the core interface. The complete layout vocabulary consists of:

**Vertical stacks (column direction):**
- Form fields stacked vertically
- Card content stacked vertically
- List items stacked vertically
- Bottom sheet content stacked vertically
- Page content stacked vertically

**Horizontal rows (row direction):**
- Navigation header (back, title, actions)
- List row (icon, text, right element)
- Sticky bottom bar (info, CTA)
- Stepper control (minus, value, plus)
- Tab bar items (evenly spaced)
- Chip/pill scroll row

**Two-column grid (the one exception):**
- Image gallery thumbnails
- Type selection cards (event types, property types)
- This can be achieved with `display: grid; grid-template-columns: 1fr 1fr; gap: 12px` or flexbox with `flex-wrap: wrap` and `width: calc(50% - 6px)`.

### 2.4 Scroll Behaviors

| Pattern | Implementation |
|---|---|
| Vertical page scroll | Default overflow-y: auto on content area |
| Horizontal chip scroll | overflow-x: auto, scrollbar hidden, -webkit-overflow-scrolling: touch |
| Scroll behind fixed bars | Content area height: calc(100vh - header - tabbar), overflow scroll |
| Sticky header on scroll | Navigation header transitions from transparent to white background on scroll (IntersectionObserver or scroll listener) |
| Pull-to-refresh | Optional for list screens, implemented via a library or custom gesture handler |

### 2.5 Safe Area Handling

For mobile browser rendering, safe areas must be respected:

```css
/* Root layout */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);

/* Tab bar specifically */
padding-bottom: calc(12px + env(safe-area-inset-bottom));
```

Add the viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

---

## 3. Interaction Patterns

### 3.1 Form Interactions

**Field validation timing:**
- Do not validate on initial render.
- Validate on blur (when user leaves the field) for the first interaction.
- After first blur validation, switch to real-time validation (on every keystroke) so the user sees immediate feedback as they correct errors.
- Display green checkmark icon inside the field (right-aligned) when valid.
- Display red X icon inside the field (right-aligned) and error message below when invalid.
- Error message replaces helper text (do not show both simultaneously).

**Form submission:**
- Primary CTA at the bottom of the form.
- Disable CTA until all required fields are valid (use disabled button state).
- On submit, replace CTA text with a loading spinner (16px, white, centered in button).
- If submission fails, re-enable the CTA and show an error message above it or as a toast.

**Multi-step forms (progressive disclosure in digital form):**
- Mobile: Split into discrete steps with "Next" CTA at the bottom of each step.
- Desktop: Render all steps on a single page as stacked sections.
- Step indicator: Simple text "Step 1 of 3" in the navigation header, or a horizontal progress bar below the header.
- Transitions between steps: Slide left (forward) or slide right (backward), 250ms ease-in-out.
- Each step validates independently before allowing progression.

### 3.2 List Interactions

**Tapping a list row:**
- Navigates to a detail screen (push transition).
- The row should have a subtle highlight state on press: background shifts to #F7F7F7 for the duration of the press, 100ms transition.
- Rows with chevrons (>) indicate navigation. Rows without chevrons perform in-place actions (toggle, select).

**Pull-to-refresh:**
- Available on all list screens (events, records, email sequences, scan batches).
- Show a loading indicator at the top of the list during refresh.
- Refresh should fetch fresh data from the server.

**Infinite scroll / pagination:**
- For long lists (records, emails), load more items as the user scrolls near the bottom.
- Show a small loading spinner (24px) centered below the last item during load.
- If no more items, show a subtle "No more records" text at the bottom.

### 3.3 Selection Patterns

**Single selection (radio pattern):**
- Used in filter sheets for mutually exclusive options (e.g., event status: active, closed, archived).
- Tapping a row selects it and deselects the previously selected row.
- Selected row shows filled radio button on the left or a checkmark on the right.
- No CTA needed -- selection is immediate.

**Multi-selection (checkbox pattern):**
- Used in filter sheets for non-exclusive options (e.g., field types, amenities, languages).
- Tapping a row toggles its checkbox.
- A "Show N results" CTA at the bottom reflects the current filter state.
- A "Clear all" text button resets all selections.

**Chip selection (horizontal scroll):**
- Used for category filtering on dashboard and list screens.
- Only one chip active at a time (radio behavior).
- Tapping a chip selects it (fills with near-black) and deselects others.
- The selected chip should scroll into view if it is off-screen.

### 3.4 Navigation Patterns

**Tab navigation (bottom bar):**
- Tapping a tab replaces the entire content area.
- Use crossfade transition (not slide) between tabs: 200ms opacity transition.
- Each tab maintains its own scroll position (do not reset scroll when switching tabs).
- Double-tapping the active tab scrolls to the top of the content.

**Push navigation (detail screens):**
- Tapping a card or list row pushes a new screen from the right.
- Back chevron (<) in the top-left pops back to the previous screen.
- Swipe-from-left-edge gesture also pops back (if using a router that supports it).

**Modal navigation (bottom sheets and full-screen modals):**
- Bottom sheets slide up from the bottom.
- Full-screen modals slide up and have an X (close) button in the top-left.
- Tapping the overlay behind a bottom sheet dismisses it.
- Swipe-down gesture on the bottom sheet also dismisses it (grab the grabber handle or swipe from the sheet body).

### 3.5 Confirmation and Destructive Actions

**1-hour email countdown (Fold-specific):**
- After scheduling an email sequence, a countdown timer appears.
- Timer displays hours and minutes until the last 5 minutes, then switches to minutes and seconds.
- Timer is rendered in the accent color during the final 5 minutes.
- A "Cancel Send" secondary button is visible throughout the countdown.
- Modifying any template or sequence parameter resets the countdown (with a confirmation dialog first).

**Destructive actions (delete, archive, hibernate):**
- Always require a confirmation step.
- Present confirmation in a bottom sheet (not a browser alert dialog).
- Confirmation sheet: Warning icon + heading ("Are you sure?") + description of consequences + primary destructive button (red background, white text) + secondary cancel button.
- The destructive button should require a deliberate tap (no accidental trigger from scroll momentum).

### 3.6 Camera and Scanning Interaction

This is unique to Fold and has no direct analog in the inspiration app. Specifications based on the feature requirements:

**Camera viewfinder:**
- Full-screen camera feed as background.
- Semi-transparent overlay with a clear rectangular cutout (card alignment guide).
- Corner markers at the cutout edges (4 L-shaped white lines, 3px stroke, 24px arm length).
- Capture button: Large circle (72px), white border (4px), centered at bottom, 80px from bottom edge.
- Flash toggle: Top-right, icon button.
- Close (X): Top-left, icon button.
- Card count: Badge in the top-right area showing "N scanned" with a small card icon.

**Post-capture:**
- Brief flash animation (white overlay, 100ms, opacity 0 to 0.3 to 0, simulating shutter).
- Thumbnail of captured image slides into a small preview strip at the bottom.
- Haptic feedback on capture (if available via the Vibration API).

---

## 4. Component Architecture

### 4.1 Component File Structure

Recommended structure within `src/components/`:

```
src/components/
  ui/                          # Atomic/primitive components
    button.tsx                 # Primary, Secondary, Tertiary, Destructive variants
    input.tsx                  # Text, Search, Textarea variants
    checkbox.tsx
    radio.tsx
    toggle.tsx
    stepper.tsx
    chip.tsx
    badge.tsx
    divider.tsx
    avatar.tsx
    icon.tsx                   # Wrapper for icon library (Lucide)
    spinner.tsx
    skeleton.tsx

  composed/                    # Molecule-level components
    card.tsx                   # Standard card wrapper
    list-row.tsx               # Configurable list row with slots
    form-field.tsx             # Label + input + helper/error wrapper
    expandable-section.tsx     # Accordion pattern
    sticky-bottom-bar.tsx      # Bottom CTA bar
    empty-state.tsx            # Heading + description + optional CTA
    progress-bar.tsx           # Horizontal progress indicator
    countdown-timer.tsx        # Fold-specific: email send countdown

  overlays/                    # Overlay components
    bottom-sheet.tsx           # Slide-up sheet with grabber
    modal.tsx                  # Full-screen modal with close
    confirmation-sheet.tsx     # Destructive action confirmation
    toast.tsx                  # Notification toast

  navigation/                  # Navigation components
    tab-bar.tsx                # Bottom 5-tab navigation
    nav-header.tsx             # Top navigation with back/title/actions
    tab-underline.tsx          # Text tabs with underline for bottom sheets

  layout/                      # Layout components
    page-layout.tsx            # Standard page wrapper (header + content + bottom)
    scroll-area.tsx            # Scrollable content container
    section.tsx                # Section wrapper with optional heading
    two-column-grid.tsx        # 2-col grid for galleries/selections

  domain/                      # Domain-specific composed components
    event-card.tsx
    record-card.tsx
    email-sequence-card.tsx
    scan-batch-card.tsx
    defective-record-card.tsx
    field-config-row.tsx
    team-member-row.tsx
    camera-viewfinder.tsx
    digital-form-step.tsx
```

### 4.2 Component API Principles

**Variant-driven, not prop-heavy:**
- Use a `variant` prop for visual variations (e.g., `<Button variant="primary" />`, `<Button variant="secondary" />`).
- Avoid boolean props that combine in confusing ways (no `<Button primary bordered disabled loading />`).

**Composable slots over rigid structures:**
- List rows, cards, and the sticky bottom bar should accept `children` or named slots (`left`, `right`, `header`, `footer`) rather than a fixed set of content props.
- This allows domain-specific components (event-card, record-card) to compose the base components without the base needing to know about domain logic.

**Controlled form components:**
- All form inputs should be controlled (value + onChange).
- Validation state passed via `error?: string` prop.
- Never store validation state inside the input component itself.

**Forwarded refs:**
- All interactive components should forward refs for focus management and programmatic control.
- This is critical for accessibility (focus trapping in modals, focus return on sheet close).

### 4.3 Tailwind CSS Token Mapping

Assuming Tailwind CSS is used (standard for modern Next.js projects), the design tokens from Agent 1's analysis map to the Tailwind config as follows:

```typescript
// tailwind.config.ts (relevant extensions)
{
  theme: {
    extend: {
      colors: {
        surface: {
          primary: '#FFFFFF',
          secondary: '#F7F7F7',
        },
        content: {
          primary: '#222222',
          secondary: '#888888',
          disabled: '#CCCCCC',
        },
        accent: {
          DEFAULT: '#E8705A',  // warm coral, final value TBD
        },
        border: {
          DEFAULT: '#E8E8E8',
          focus: '#222222',
        },
        status: {
          success: '#2E7D4F',
          warning: '#C68A1D',
          error: '#C0392B',
          info: '#4A7FB5',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        sheet: '20px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.04)',
        elevated: '0 2px 8px rgba(0, 0, 0, 0.06)',
        sheet: '0 -4px 16px rgba(0, 0, 0, 0.08)',
        'sticky-bar': '0 -1px 3px rgba(0, 0, 0, 0.06)',
      },
      spacing: {
        // extends default Tailwind scale
        'page': '20px',  // horizontal page padding
      },
      fontSize: {
        display: ['30px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        heading: ['21px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      height: {
        input: '52px',
        'input-public': '56px',
        'tab-bar': '84px',
      },
      transitionDuration: {
        press: '100ms',
        release: '150ms',
        expand: '225ms',
        'sheet-open': '300ms',
        'sheet-close': '200ms',
      },
    },
  },
}
```

---

## 5. Accessibility Implementation

### 5.1 ARIA Patterns Required

| Component | ARIA Pattern |
|---|---|
| Bottom sheet | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to sheet title |
| Bottom tab bar | `role="tablist"`, each tab `role="tab"`, content `role="tabpanel"` |
| Expandable section | `aria-expanded="true/false"` on trigger, `aria-controls` pointing to content |
| Toggle switch | `role="switch"`, `aria-checked="true/false"` |
| Chip filter | `role="radiogroup"` on container, `role="radio"` + `aria-checked` on each chip |
| Toast notification | `role="alert"`, `aria-live="polite"` |
| Loading states | `aria-busy="true"` on the loading container, `aria-label` on spinner |
| Progress bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Form errors | `aria-invalid="true"` on input, `aria-describedby` pointing to error message |

### 5.2 Focus Management

| Interaction | Focus Behavior |
|---|---|
| Bottom sheet opens | Focus moves to the first focusable element inside the sheet |
| Bottom sheet closes | Focus returns to the element that triggered the sheet |
| Modal opens | Focus trapped inside the modal (Tab cycles within, Escape closes) |
| Tab navigation | Focus follows active tab panel |
| Form validation error | Focus moves to the first invalid field |
| Toast appears | Announced by screen reader, but focus does not move |

### 5.3 Keyboard Support

| Key | Action |
|---|---|
| Enter / Space | Activate buttons, toggles, checkboxes, radio buttons |
| Escape | Close bottom sheet, close modal, clear search input |
| Tab | Move focus forward through interactive elements |
| Shift + Tab | Move focus backward |
| Arrow keys (left/right) | Navigate between tabs, navigate between chips |
| Arrow keys (up/down) | Navigate between list rows (when list has focus) |

### 5.4 Touch Target Compliance

Every interactive element must have a minimum touch target of 44x44px (WCAG 2.5.5). Where the visual element is smaller (e.g., a 24px checkbox), the touch target is expanded via padding on the parent row or an invisible hit area extension.

---

## 6. Performance Considerations

### 6.1 Skeleton Loading Strategy

Every data-dependent screen should render immediately with skeleton placeholders, then hydrate with real data.

Skeleton components needed:
- `SkeletonCard`: Matches card dimensions with animated gradient shimmer
- `SkeletonRow`: Matches list row with avatar circle + text lines
- `SkeletonText`: Single line at various widths (60%, 80%, 100%) for text blocks
- `SkeletonImage`: Matches image aspect ratio

Shimmer animation: A diagonal gradient that sweeps left-to-right over 1.5 seconds, linear, infinite loop. Colors: base #E8E8E8, shimmer peak #F5F5F5.

### 6.2 Image Optimization

- Scanned card images: Use Next.js `<Image>` with `loading="lazy"`, appropriate `sizes` attribute, and WebP format.
- Avatars: Preload only the visible avatars in the initial viewport. Lazy-load the rest.
- QR codes: Generate as SVG (not raster) for crisp rendering at any size.
- Thumbnail previews: Serve at 200px width maximum for list views. Full-resolution only on detail/zoom.

### 6.3 Component Lazy Loading

| Component | Loading Strategy |
|---|---|
| Camera viewfinder | Dynamic import (`next/dynamic`) -- never loaded until scanning is initiated |
| TipTap rich text editor | Dynamic import -- only loaded on email template creation/editing |
| Bottom sheets | Can be statically imported (small, used frequently) |
| Chart/reporting components | Dynamic import -- only loaded on dashboard screens |
| PDF export | Dynamic import -- only loaded on demand |

### 6.4 Bundle Size Targets

| Concern | Recommendation |
|---|---|
| Icon library | Import individual icons, not the entire library. Lucide supports tree-shaking. |
| Fonts | Use `next/font` to self-host Inter. Avoid Google Fonts CDN for privacy and performance. |
| CSS | Tailwind with purging eliminates unused styles. Target < 15KB compressed CSS. |
| Component library | No external UI library (no shadcn, no Radix, no MUI). Build all components from scratch to match the exact specifications. |

---

## 7. State Management for Interactive Patterns

### 7.1 Form State

Use React Hook Form or a similar lightweight form library for:
- Field-level validation with custom rules
- Touched/dirty state tracking (for "validate on blur, then real-time" pattern)
- Multi-step form state persistence (digital form steps)
- Submit handling with loading state

### 7.2 Filter State

Filter state (in bottom sheets) should be:
- Stored as URL search parameters (not component state) so that filter state survives page refresh and can be shared via URL.
- Updated optimistically: the filter UI updates immediately, and the API request fires in the background.
- The "Show N results" count in the filter sheet footer should be fetched via a lightweight API endpoint that returns only the count, not the full result set.

### 7.3 Real-time State (WebSocket)

For collaborative scanning (feature domain E):
- Scan counter: Updated via WebSocket message, triggers the number-roll animation (150ms).
- Scanner list: Updated via WebSocket, shows connected scanners with activity indicators.
- Session status: Updated via WebSocket, handles session expiry and inactivity timeout.

### 7.4 Offline State (IndexedDB)

For offline scanning resilience (feature D6):
- Captured images stored in IndexedDB when offline.
- A sync queue processes stored images when connectivity returns.
- A visual indicator (subtle banner below the nav header) shows "Offline -- N scans pending upload".
- The banner uses the warning status color as a left-border accent.

---

## 8. Responsive Behavior Summary

Fold is designed mobile-first, accessed via mobile browser. However, as a Next.js web app, it will be accessed from various devices.

| Breakpoint | Behavior |
|---|---|
| < 480px | Standard mobile layout. Full-width content. Tab bar visible. |
| 480px - 768px | Same as mobile but with slightly increased horizontal padding (24px). |
| 768px - 1024px | Content centered at 480px max-width. Tab bar converts to side navigation (optional, can defer to later phase). |
| > 1024px | Content centered at 480px max-width within a neutral background. Side navigation visible. Multiple panels possible for dashboard (Phase 8). |

For the initial build (Phases 1-7), treat everything as mobile layout at max 480px centered. Desktop optimization is a Phase 9 concern.

---

## 9. Component Priority for Implementation

Based on the Fold feature phases, the components should be built in this order:

### Phase 1 (Foundation) -- Build These First
1. `button.tsx` (Primary, Secondary, Tertiary)
2. `input.tsx` (Text, Search)
3. `form-field.tsx` (Label + Input + Error wrapper)
4. `page-layout.tsx` (Header + Content + Bottom)
5. `nav-header.tsx` (Back, Title, Actions)
6. `tab-bar.tsx` (5-tab bottom navigation)
7. `card.tsx` (Base card wrapper)
8. `event-card.tsx` (Domain-specific)
9. `list-row.tsx` (Configurable row)
10. `badge.tsx` (Status indicators)
11. `empty-state.tsx` (First-time states)
12. `divider.tsx`
13. `skeleton.tsx` (Loading states)
14. `spinner.tsx`

### Phase 2 (Capture Engine)
15. `camera-viewfinder.tsx` (Custom scanning UI)
16. `sticky-bottom-bar.tsx` (Scan counter + CTA)
17. `stepper.tsx` (Card count input)
18. `toast.tsx` (Scan confirmation feedback)

### Phase 3 (Processing)
19. `progress-bar.tsx` (AI extraction progress)
20. `defective-record-card.tsx`
21. `record-card.tsx`

### Phase 4 (Digital Forms)
22. `digital-form-step.tsx` (Progressive disclosure)
23. `radio.tsx`
24. `checkbox.tsx`
25. `toggle.tsx`
26. `chip.tsx` (Language/category selection)

### Phase 5 (Collaborative Scanning)
27. Real-time counter component (extends scan counter with WebSocket)

### Phase 6 (Email System)
28. `email-sequence-card.tsx`
29. `countdown-timer.tsx` (1-hour mandatory countdown)
30. TipTap editor integration wrapper

### Phase 7 (Team and Permissions)
31. `team-member-row.tsx`
32. `bottom-sheet.tsx` (Permission configuration)
33. `confirmation-sheet.tsx` (Delegation confirmation)

### Phase 8 (Dashboard)
34. Chart/reporting components (dynamic import)
35. `two-column-grid.tsx` (Dashboard panels)

---

## 10. What This Analysis Does Not Cover

- **Specific CSS class names or Tailwind utility strings** -- those are implementation details that depend on the final Tailwind config and naming conventions chosen during scaffolding.
- **Server Components vs. Client Components boundary** -- this depends on data fetching patterns that will be determined during Phase 1 architecture.
- **Animation library selection** -- the motion specs from Agent 1 can be implemented with CSS transitions alone. Framer Motion or similar libraries may be considered if gesture support (swipe-to-dismiss sheets, drag-to-reorder fields) proves complex with CSS alone.
- **Testing strategy** -- component unit tests, integration tests, and visual regression tests should be planned separately.
- **Dark mode** -- the inspiration app is light-mode only. Dark mode is not specified in the 108 features and should not be considered for v1.
- **Internationalization (RTL layout)** -- Fold supports EN and DE, both LTR languages. RTL support is not needed for v1.

---

*End of Agent 2 analysis. This document should be read alongside Agent 1 (Visual Design Analysis), Agent 3 (Information Architecture Analysis), and Agent 4 (Synthesis and Recommendation) to form the complete design foundation for Fold.*
