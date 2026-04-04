# Agent 1: UI Visual Design Analysis

> **Source:** 66 iOS app screenshots from the inspiration folder
> **Purpose:** Extract reusable visual design patterns and principles for the Fold design system
> **Date:** 2026-04-03
> **Scope:** Color, Typography, Iconography, Spacing/Layout, Motion/Micro-interaction

---

## 1. Color System

### 1.1 Foundation Palette

The inspiration screens operate on an almost monochromatic base. The dominant surfaces are near-black and near-white -- not pure extremes, but softened values that reduce eye strain and project quiet sophistication.

| Role | Observed Value | Fold Recommendation |
|---|---|---|
| Primary Background | `#FFFFFF` (pure white) | Keep as-is. White conveys openness and trust. |
| Secondary Background | `#F7F7F7` (warm gray) | Adopt. Use for card insets, input fields, section separators. A subtle warmth is appropriate for a church-oriented tool. |
| Primary Text | `#222222` (near-black) | Adopt. Softer than pure `#000000`, easier on the eye at all sizes, and carries authority without harshness. |
| Secondary Text | `#888888` to `#999999` (mid-gray) | Adopt for captions, helper text, timestamps, and de-emphasized metadata. |
| Disabled / Inactive | `#CCCCCC` to `#D5D5D5` | Use for inactive tab icons, disabled buttons, placeholder text. |
| Divider Lines | `#E8E8E8` to `#EEEEEE` | Use at 0.5px weight for hairline separators (see Spacing section). |

### 1.2 Accent Color Strategy

The inspiration apps use a single warm accent color -- a rose or coral tone -- applied with extreme discipline. It appears only on:

- Primary call-to-action buttons
- Key interactive toggles in their active state
- Occasionally, a selected navigation item

It never appears as a background fill, decorative stripe, or illustration tint. This restraint is critical. It means the accent color always signals "take action here."

**Fold Adaptation:**
- Select a single warm accent. A muted coral (approximately `#E8705A`) or warm rose (approximately `#D4636B`) communicates warmth and care without the intensity of pure red, which can feel urgent or alarming in a church context.
- Reserve this accent exclusively for: primary CTA buttons, active toggles, and progress indicators.
- Never use the accent color for decorative purposes, backgrounds, or illustrations.
- All secondary actions (cancel, back, secondary navigation) should remain in the grayscale palette.

### 1.3 Functional / Status Colors

The inspiration apps are notably restrained with status colors. Rather than a full traffic-light system, they rely on:

- **Active state:** Primary text color (near-black) or filled icon
- **Inactive state:** Mid-gray text or outlined icon
- **Error / Defective:** A controlled red, used only inline next to the problem field -- never as a background wash

**Fold Adaptation:**
- Success: `#2E7D4F` (muted forest green) -- for completed scans, successful email sends, resolved records
- Warning: `#C68A1D` (warm amber) -- for pending reviews, approaching deadlines, rate limit warnings
- Error: `#C0392B` (controlled red) -- for defective records, failed extractions, validation errors
- Info: `#4A7FB5` (calm blue) -- for processing states, informational badges, neutral notifications

These should appear only as small indicators (badges, inline text, icon tints) -- never as large background fills.

### 1.4 No Gradients

The inspiration screens use absolutely no gradients. Every surface is a flat, solid fill. This conveys confidence and modernity.

**Fold Principle:** No gradients anywhere in the UI. Flat fills only. Depth is communicated through elevation (subtle shadows) and layering (background tiers), never through color transitions.

---

## 2. Typography

### 2.1 Type Scale

The inspiration apps use a compact type scale with clear hierarchical separation. The system relies on only 4-5 distinct sizes, creating rhythm without complexity.

| Level | Observed Size | Weight | Use Case in Fold |
|---|---|---|---|
| Display / Hero | 28-34px | Bold (700) | Screen titles on action screens: "Scan Cards", "Create Event", onboarding prompts |
| Section Heading | 20-22px | Semibold (600) | Dashboard section headers, modal titles, settings group labels |
| Body / Default | 15-17px | Regular (400) | All primary content: form labels, list items, descriptions, email template body |
| Body Emphasis | 15-17px | Semibold (600) | Inline emphasis within body text, selected states, key data points in lists |
| Caption / Helper | 15-17px (same size) | Regular (400), lighter color | Timestamps, helper text below inputs, secondary metadata |

### 2.2 Key Typographic Observations

**Hierarchy through color, not size reduction.** The inspiration apps avoid making caption text physically smaller. Instead, they keep it at the same body size but shift to a lighter gray. This is an important accessibility pattern -- smaller text creates readability problems, especially for older users who are common in church communities.

**Tight letter-spacing on headings.** Display headings use negative letter-spacing (approximately -0.02em to -0.03em), which makes large text feel cohesive and intentional rather than loose. Body text uses default or slightly positive letter-spacing for readability.

**Generous line-height on body text.** Body text sits at approximately 1.5 line-height, giving each line room to breathe. Headings are tighter at approximately 1.15, which keeps multi-line headings compact and visually unified.

**Only 2-3 weights.** The entire system operates on Regular (400) and Semibold/Bold (600-700). There is no Light, no Thin, no Extra-Bold. This constraint ensures the hierarchy remains clean and prevents "weight soup" across screens.

### 2.3 Fold Typographic Recommendations

- **Font family:** Use a system font stack (Inter, SF Pro, or similar geometric sans-serif) for clarity and fast loading. Do not use serif fonts or decorative typefaces.
- **Heading letter-spacing:** Apply `-0.02em` to all headings at 20px and above.
- **Body line-height:** Set to `1.5` for all body text. Set to `1.15` for display headings.
- **No all-caps.** The inspiration apps avoid uppercase text entirely. Section labels use the same case as body text but with heavier weight. This is warmer and less clinical.
- **Minimum size:** Never go below 14px for any rendered text. Helper text should be 15px in a lighter color, not 12px in the same color.
- **Number formatting:** Use tabular (monospaced) figures for scan counters, email statistics, and dashboard numbers so columns align.

---

## 3. Iconography and Imagery

### 3.1 Icon Style

The inspiration apps use a consistent outlined icon style throughout:

| Property | Observed Value |
|---|---|
| Stroke weight | 1.5px (thin, refined) |
| Style | Outlined / line-art |
| Size (inline) | 20-24px |
| Size (category/feature) | 28-32px with label below |
| Corner treatment | Rounded joins and caps |
| Color | Primary text color (near-black) when active; mid-gray when inactive |

The icons are subordinate to text. They support understanding but never dominate visual weight. No filled icons appear in content areas -- only in the bottom navigation bar for active state.

### 3.2 Navigation Icon Pattern

- **Inactive tab:** Outlined icon, mid-gray color
- **Active tab:** Filled version of the same icon, primary text color (near-black)

This binary state change (outline to fill) is the primary affordance for selected navigation. No color accent is used on navigation icons.

### 3.3 Avatars and Profile Images

- Circular crop, no border or ring
- Consistent size within a given context (list view: 40px diameter, detail view: 56-64px)
- Fallback: a neutral gray circle with initials in the primary text color

### 3.4 Fold Icon Recommendations

- Adopt a single outlined icon library (Lucide, Phosphor, or Heroicons Outline) at 1.5px stroke weight.
- Lock icon size to 20px for inline use and 24px for standalone/category use.
- For the scanning feature, use slightly larger icons (28-32px) within the camera viewfinder UI, but keep the same stroke weight for visual consistency.
- Do not use emoji as icons. Do not use multi-color icons.
- For the bottom navigation: Events, Scan, Records, Emails, Settings -- use outline/fill pairs.
- Avatar fallback should use the user's initials on a soft warm-gray background (`#E8E0DA`), reflecting Fold's warm tone.

### 3.5 Imagery Philosophy

The inspiration apps use almost no photographic imagery within the functional UI. Screens are driven by typography, whitespace, and structure. Where images appear (avatars, scanned cards), they are contained within well-defined frames.

**Fold Principle:** The app should feel like a tool, not a magazine. Use photography only for: scanned card previews (contained in rounded-rectangle frames), user avatars, and the onboarding flow. All other visual communication should be typographic and structural.

---

## 4. Spacing and Layout

### 4.1 Spacing Scale

The inspiration apps use a generous, consistent spacing system. Nothing feels cramped. The spacing scale appears to follow an 8px base grid:

| Token | Value | Application |
|---|---|---|
| `space-xs` | 4px | Inline icon-to-text gap, badge padding |
| `space-sm` | 8px | Tight internal padding, gap between related items |
| `space-md` | 12px | Standard internal card padding, gap between form fields |
| `space-lg` | 16px | Standard padding within cards and containers |
| `space-xl` | 20-24px | Horizontal page margin (both sides), section internal padding |
| `space-2xl` | 24-32px | Vertical gap between major sections |
| `space-3xl` | 40-48px | Top-of-screen breathing room, pre-footer spacing |

### 4.2 Page-Level Layout

- **Horizontal page padding:** 20-24px on each side, consistent across all screens. This is wider than many apps, creating a calm, uncluttered feel.
- **Content width:** Content fills the available width minus padding. No narrow centered columns on mobile.
- **Vertical scroll:** Screens scroll vertically. No horizontal scrolling for content (only for category/filter carousels).
- **Safe areas:** Bottom content leaves space for the tab bar (approximately 80-88px). Scrollable content fades or clips cleanly at the bottom edge.

### 4.3 Card Design

Cards are the primary container for grouped information. Their treatment is minimal:

| Property | Observed Value |
|---|---|
| Border radius | 12-16px (large, soft corners) |
| Border | None, or 0.5px in `#EEEEEE` (barely visible) |
| Shadow | Very subtle: `0 1px 3px rgba(0,0,0,0.04)` to `0 2px 8px rgba(0,0,0,0.06)` |
| Internal padding | 16-20px |
| Background | `#FFFFFF` on `#F7F7F7` backgrounds; `#F7F7F7` on `#FFFFFF` backgrounds |
| Card gap (in lists) | 12-16px vertical |

**Fold Card Application:**
- Event cards, record cards, email sequence cards, and scan batch cards should all follow this pattern.
- Defective record cards can use a subtle left-border accent (2px, error color) rather than changing the entire card background.
- Expandable cards (for progressive disclosure in settings or record detail) should use the same radius and padding, with content collapsing/expanding within.

### 4.4 Dividers

Section dividers are deliberately understated:

- Weight: 0.5px (hairline)
- Color: `#E8E8E8` to `#EEEEEE`
- Horizontal inset: They do not span full width. They begin at the left content edge (after the page padding) and may also inset from list item icons/avatars.
- Usage: Between list items, between form sections. Never between cards (the gap between cards is sufficient).

### 4.5 Input Fields

Form inputs are designed for comfortable touch interaction:

| Property | Observed Value |
|---|---|
| Height | 50-56px (generous tap target) |
| Border radius | 8-12px |
| Border | 1px `#E0E0E0`, darkens to `#222222` on focus |
| Background | `#F7F7F7` or `#FFFFFF` depending on page background |
| Label position | Above the field, in body weight or semibold |
| Placeholder text | Mid-gray, same size as input text |
| Internal horizontal padding | 16px |

**Fold Input Recommendations:**
- All form fields (event creation, field configuration, email template editing, digital form builder) should use 52px height minimum.
- Labels above, never inside (floating labels create accessibility issues).
- Validation errors appear below the field in the error color, at caption size, with an inline error icon.
- For the digital public form (attendee-facing), increase input height to 56px and font size to 17px for maximum accessibility.

### 4.6 Bottom Sheets and Modals

- Top border-radius: 16-20px (distinctly larger than card radius, signaling a different elevation level)
- Background: `#FFFFFF`
- Overlay: Semi-transparent black (`rgba(0,0,0,0.3)` to `rgba(0,0,0,0.5)`)
- Handle indicator: A small pill-shaped grabber (36px wide, 4px tall, `#D5D5D5`) centered at the top
- Internal padding: Same as page padding (20-24px horizontal)
- Content starts 16-20px below the grabber

---

## 5. Motion and Micro-interactions

### 5.1 Observed Motion Patterns

While static screenshots cannot directly capture motion, several structural cues reveal the motion design philosophy:

**Skeleton / Loading States:**
The layouts include placeholder regions sized identically to their content counterparts. This implies shimmer or skeleton loading patterns rather than spinners. Content slots maintain their dimensions during load, preventing layout shift.

**Progressive Disclosure (Expand/Collapse):**
Cards appear in both collapsed and expanded states across different screens, suggesting smooth height-animation transitions. Collapsed cards show a summary line; expanded cards reveal full content with additional actions.

**State Transitions on Interactive Elements:**
- Radio buttons: Large circular targets (24px diameter) with a solid fill animation on selection
- Checkboxes: Rounded squares (4px radius) with a fill + checkmark animation
- Toggle switches: Pill-shaped with a sliding circle indicator
- Buttons: Slightly increased padding and rounded corners suggest a subtle scale-down on press (active state)

**Navigation:**
The bottom navigation bar has no top border -- it sits on the same white background as the content above, separated only by the implicit shadow of content scrolling behind it. Tab switches likely use a crossfade rather than a slide.

### 5.2 Fold Motion Recommendations

All motion should be purposeful, subtle, and fast. The goal is to feel responsive without feeling animated.

**Timing:**
| Interaction | Duration | Easing |
|---|---|---|
| Button press (scale down) | 100ms | ease-out |
| Button release (scale up) | 150ms | ease-out |
| Card expand / collapse | 200-250ms | ease-in-out |
| Bottom sheet open | 300ms | ease-out (decelerate) |
| Bottom sheet close | 200ms | ease-in (accelerate) |
| Page transition | 250ms | ease-in-out |
| Skeleton shimmer cycle | 1.5s | linear, infinite |
| Toast notification enter | 200ms | ease-out + slide up |
| Toast notification exit | 150ms | ease-in + fade |

**Button Micro-interaction:**
- On press: scale to `0.97`, no color change
- On release: scale back to `1.0`
- Do not change the background color on press. The physical feedback of the scale is sufficient.

**Loading Strategy:**
- Use skeleton screens for all data-dependent views (event list, record list, dashboard).
- Skeleton shapes should match the exact dimensions of the content they replace.
- Use a subtle shimmer animation (left-to-right gradient sweep) on skeleton elements.
- For AI processing (card extraction), use a progress bar with estimated time rather than a skeleton, since the wait may be extended.

**Scan Counter Animation:**
When a new card is scanned, the live counter should increment with a brief number-roll animation (150ms, ease-out). This provides satisfying feedback during high-volume scanning sessions.

**Email Countdown Timer:**
The mandatory 1-hour countdown should use a steady tick (updating every second in the final 5 minutes, every minute otherwise). No pulsing or color changes until the final 5 minutes, when the timer text can shift to the accent color.

**Transition Philosophy:**
- Prefer crossfade over slide for tab changes.
- Prefer slide-up for bottom sheets and modals.
- Prefer expand-in-place for progressive disclosure.
- Avoid bounce, overshoot, or spring physics. The tone should be calm and precise, matching the trust and reliability Fold needs to convey.

---

## 6. Overarching Design Principles for Fold

Drawing from all observed patterns, these are the governing principles:

### 6.1 Restrained Confidence

The inspiration apps succeed by doing less. Few colors, few weights, few sizes, few decorative elements. Every pixel serves a purpose. Fold should resist the temptation to add visual interest through decoration. The content -- events, records, emails, scans -- is the visual interest.

### 6.2 Warmth Through Space, Not Ornament

Church communities value warmth and welcome. In visual design, warmth is not achieved through illustrations of people holding hands or sunset gradients. It is achieved through generous spacing, comfortable touch targets, readable text, and a color palette that feels soft rather than clinical. The slightly warm gray (`#F7F7F7`), the softened near-black (`#222222`), and the coral accent all contribute to this warmth without a single decorative element.

### 6.3 Accessibility as a Default

Many Fold users will be church volunteers, not tech professionals. Some will be older. Some will use the app in bright outdoor conditions. The design must account for this:

- Minimum contrast ratio of 4.5:1 for all text (WCAG AA)
- Minimum touch target of 44x44px for all interactive elements
- No information conveyed by color alone (always pair with icon or text)
- No small text -- hierarchy through color and weight, not size reduction
- Focus indicators visible for keyboard/assistive technology navigation

### 6.4 Content Density: Low

Fold handles complex data (108 features, 31 database tables), but the UI should never feel dense. Each screen should have a single primary purpose. Lists should show 4-6 items in the viewport, not 12. Cards should have generous internal padding. The user should never feel overwhelmed by the interface, even when the underlying data is complex.

### 6.5 Consistency Over Novelty

Every card, every input, every button, every icon should look like it belongs to the same family. Use the same radius, the same shadow, the same padding. Do not vary these values for "visual interest." The consistency itself builds trust -- the user learns the system once and can predict its behavior everywhere.

---

## 7. Design Token Summary

For implementation reference, here is a consolidated token set derived from this analysis:

```
/* Colors */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F7F7F7;
--color-text-primary: #222222;
--color-text-secondary: #888888;
--color-text-disabled: #CCCCCC;
--color-accent: #E8705A;           /* warm coral -- final value TBD */
--color-border: #E8E8E8;
--color-border-focus: #222222;
--color-status-success: #2E7D4F;
--color-status-warning: #C68A1D;
--color-status-error: #C0392B;
--color-status-info: #4A7FB5;
--color-overlay: rgba(0, 0, 0, 0.4);

/* Typography */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-size-display: 30px;
--font-size-heading: 21px;
--font-size-body: 16px;
--font-size-caption: 16px;         /* same as body -- hierarchy via color */
--font-weight-regular: 400;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--line-height-display: 1.15;
--line-height-body: 1.5;
--letter-spacing-display: -0.02em;
--letter-spacing-body: 0;

/* Spacing */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 20px;
--space-2xl: 28px;
--space-3xl: 44px;
--page-padding-horizontal: 20px;

/* Radii */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-sheet: 20px;

/* Shadows */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04);
--shadow-elevated: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-sheet: 0 -4px 16px rgba(0, 0, 0, 0.08);

/* Sizes */
--input-height: 52px;
--input-height-public: 56px;
--icon-size-inline: 20px;
--icon-size-standalone: 24px;
--icon-stroke: 1.5px;
--touch-target-min: 44px;
--tab-bar-height: 84px;
--divider-weight: 0.5px;
--grabber-width: 36px;
--grabber-height: 4px;

/* Motion */
--duration-press: 100ms;
--duration-release: 150ms;
--duration-expand: 225ms;
--duration-sheet-open: 300ms;
--duration-sheet-close: 200ms;
--duration-page: 250ms;
--duration-shimmer: 1.5s;
--ease-default: ease-in-out;
--ease-enter: ease-out;
--ease-exit: ease-in;
--scale-press: 0.97;
```

---

## 8. What This Analysis Does Not Cover

This document deliberately excludes:

- **Specific component blueprints.** Individual component specs (button variants, card types, form layouts) should be derived from this analysis but documented separately.
- **Dark mode.** The inspiration screens are exclusively light-mode. A dark mode strategy should be a separate design exercise.
- **Responsive breakpoints.** The screenshots are iOS mobile only. Desktop and tablet adaptations for the Next.js web app require separate analysis.
- **Brand identity.** Logo, wordmark, app icon, and marketing materials are outside the scope of UI pattern analysis.
- **Illustration and empty states.** The inspiration apps show minimal use of illustration. Fold's empty state strategy (first event, no records, no emails sent) should be designed separately with the same restrained philosophy.

---

*End of Agent 1 analysis. This document should be read alongside Agent 2 (Interaction Pattern Analysis), Agent 3 (Information Architecture Analysis), and Agent 4 (Synthesis and Recommendation) to form the complete design foundation for Fold.*
