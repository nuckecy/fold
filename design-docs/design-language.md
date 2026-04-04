# Design Language: Fold
## Derived from Inspiration Analysis (66 iOS Screenshots)

---

### 1. Design Philosophy

**Core Principles:**

1. **Restrained Confidence** — Use the minimum visual elements needed. No gradients, no decorative illustrations, no color for its own sake. Every pixel earns its place.

2. **Warmth Through Space** — Generous padding and breathing room communicate calm and trust. Fold serves church communities where warmth matters — achieve it through spacious layouts, not decorative elements.

3. **One Task Per Screen** — Each screen does one thing. No dashboards with competing panels. Users complete a single focused action, then move forward.

4. **Accessibility as Default** — Never go below 14px text. Use color AND text for all status indicators. 50px touch targets. Hierarchy through color weight, not size reduction.

5. **Invisible Interface** — The design should not draw attention to itself. Content, data, and actions are the heroes. The UI is the stage, not the performer.

**Personality:** Calm, Clear, Trustworthy

**Design Priorities (ranked):**
1. Clarity > Density
2. Warmth > Neutrality
3. Consistency > Novelty
4. Accessibility > Aesthetics
5. Speed > Polish

---

### 2. Color System

```css
:root {
  /* Foundation */
  --color-bg: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F7F7F7;
  --color-surface-grouped: #F2F2F7;

  /* Text */
  --color-text-primary: #222222;
  --color-text-secondary: #888888;
  --color-text-tertiary: #BBBBBB;
  --color-text-inverse: #FFFFFF;

  /* Accent — single warm accent, used ONLY for primary CTAs */
  --color-accent: #1E3A5F;       /* Fold brand navy */
  --color-accent-hover: #162D4A;
  --color-accent-light: #EEF2F7;

  /* Semantic */
  --color-success: #2E7D4F;
  --color-success-light: rgba(46, 125, 79, 0.1);
  --color-warning: #C68A1D;
  --color-warning-light: rgba(198, 138, 29, 0.1);
  --color-error: #C0392B;
  --color-error-light: rgba(192, 57, 43, 0.1);
  --color-info: #4A7FB5;
  --color-info-light: rgba(74, 127, 181, 0.1);

  /* Borders & Dividers */
  --color-divider: #EEEEEE;
  --color-border: #E0E0E0;
  --color-border-focus: #4A7FB5;

  /* Disabled */
  --color-disabled: #D5D5D5;
}
```

**Rules:**
- No gradients anywhere. Flat fills only.
- Accent color appears ONLY on: primary CTA buttons, active toggles, progress indicators.
- Status colors appear as small indicators (badges, inline text) — never as large background fills.
- Depth through subtle shadows, not border weight.

---

### 3. Typography System

**Font Stack:** `-apple-system, "Inter", system-ui, sans-serif`

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `--type-display` | 28px | 700 | 1.15 | -0.03em | Screen titles: "Scan Cards", "Create Event" |
| `--type-title` | 22px | 600 | 1.2 | -0.02em | Section headings, modal titles |
| `--type-headline` | 17px | 600 | 1.4 | -0.01em | Card titles, list item primary text |
| `--type-body` | 16px | 400 | 1.5 | 0 | All default content, form labels, descriptions |
| `--type-callout` | 15px | 400 | 1.5 | 0 | Secondary body, helper text |
| `--type-caption` | 13px | 400 | 1.4 | 0.01em | Timestamps, metadata, badge text |
| `--type-label` | 11px | 600 | 1.3 | 0.05em | Uppercase section headers only |

**Rules:**
- Hierarchy through color and weight — NOT size reduction. Caption text uses same size as body but lighter color.
- Only 2 weights: Regular (400) and Semibold/Bold (600-700). No Light, no Extra-Bold.
- No ALL CAPS except for section labels (`--type-label`).
- Minimum rendered size: 14px. Below that is a violation.
- Tabular figures for numbers in counters, stats, and tables.

---

### 4. Spacing & Layout

**Base unit: 8px**

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Icon-to-text gap, badge internal padding |
| `--space-2` | 8px | Tight gaps between related items |
| `--space-3` | 12px | Gap between form fields, button stack gap |
| `--space-4` | 16px | Card internal padding, list item padding |
| `--space-5` | 20px | Page horizontal margin (both sides) |
| `--space-6` | 24px | Gap between major sections |
| `--space-8` | 32px | Large section gaps, top-of-screen breathing room |
| `--space-10` | 40px | Pre-footer, onboarding hero spacing |

**Page Layout:**
- Horizontal padding: 20px (both sides), consistent on every screen
- Content fills available width minus padding
- Single column on mobile — no multi-column layouts
- Bottom tab bar clearance: 80px

**Card System:**

| Property | Value |
|---|---|
| Border radius | `12px` |
| Border | None or `0.5px solid #EEEEEE` |
| Shadow | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)` |
| Internal padding | `16px` |
| Gap between cards | `12px` |

**Dividers:**
- Hairline: `0.5px solid #EEEEEE`
- Inset from edges by 20px (match page padding) — never full-bleed
- Between list items within a group — not between sections (use whitespace for sections)

---

### 5. Component Library Priorities

**Tier 1 — Build First (highest frequency):**

| Component | Height | Radius | Key States |
|---|---|---|---|
| Button Primary | 50px | 12px | Default, Pressed (scale 0.97), Disabled (40% opacity), Loading |
| Button Secondary | 50px | 12px | Default, Pressed, Disabled — 1px border, no fill |
| Button Text | 44px min | none | Accent or black text, no border |
| Input Field | 52px | 10px | Default (gray bg, no border), Focused (blue ring), Error (red ring) |
| Card | auto | 12px | Default, Pressed (scale 0.98) |
| List Row | 52px min | 0 | Default, Pressed highlight, with divider below |
| Status Badge | 24px | 9999px | Success, Warning, Error, Info, Neutral |
| Bottom Tab Bar | 52px | 0 | Outline (inactive) → Fill (active), no border on bar |
| Page Header | 44px | 0 | Back arrow + title + optional badge |

**Tier 2 — Build Second:**
- Search Input (pill shape, gray bg, icon + placeholder)
- Stepper Control (- value + for numeric input)
- Toggle Switch (iOS-style oval)
- Expandable Section (chevron rotation)
- Bottom Sheet / Modal (16px top radius, handle bar)
- Empty State (icon + heading + description + optional CTA)
- Chip / Filter Pill (9999px radius, border variant + filled variant)

**Tier 3 — Build Later:**
- Skeleton Loading (pulsing gray rectangles)
- Toast / Snackbar (bottom-floating notification)
- Progress Ring (circular for processing)
- Date Picker
- Radio Button Group (large 24px circles)
- Checkbox (rounded square, filled + checkmark)

---

### 6. Interaction & Motion Principles

| Interaction | Duration | Easing | Effect |
|---|---|---|---|
| Button press | 100ms | ease-out | `scale(0.97)` |
| Card tap | 150ms | ease-out | `scale(0.98)`, shadow reduces |
| Page transition | 250ms | ease-in-out | Slide from right (push) |
| Bottom sheet open | 300ms | ease-out | Slide up from bottom |
| Toggle switch | 200ms | ease | Background color + knob position |
| Fade in content | 200ms | ease | Opacity 0 → 1 |
| Skeleton pulse | 1500ms | ease-in-out | Opacity cycle 0.4 → 0.7 → 0.4, infinite |

**Rules:**
- No bouncy/spring animations. Everything is clean and linear.
- No animation on first render — content appears instantly.
- Loading: Use skeleton screens (pulsing gray shapes), never spinners.
- Never animate layout shifts. Elements appear in their final position.

---

### 7. UX Patterns

**Navigation:** Bottom tab bar with 4-5 items. Icon (outline/fill) + label always visible. No gestures, no hidden nav.

**Information Hierarchy:**
1. Large display heading states the screen's purpose
2. Key data in bold at body size
3. Supporting metadata in secondary color (same size)
4. Actions at bottom of screen

**Progressive Disclosure:**
- Show summary first, expand with "Show all N items" button
- Accordion sections with chevron-down for optional details
- Multi-step flows show only the current step's fields
- Completed steps collapse into summary cards

**Empty States:**
- Centered vertically
- Icon (48px, secondary color) + heading (headline weight) + description (body, secondary color) + optional primary CTA
- Tone: helpful, not apologetic. "No events yet" not "Oops!"

**Error States:**
- Inline, next to the field — never a banner at the top
- Red indicator (icon + text) appears below the field
- Field border changes to error color
- Error text uses body size in error color — NOT smaller

**Loading States:**
- Skeleton shapes matching the expected content layout
- Gray pulsing rectangles (12px radius matching cards)
- Never a centered spinner

---

### 8. Accessibility Baseline

| Requirement | Minimum |
|---|---|
| Text contrast ratio | 4.5:1 for body, 3:1 for large text (18px+) |
| Touch target size | 44px x 44px minimum, 50px preferred |
| Font size minimum | 14px — nothing smaller renders |
| Input height | 52px minimum |
| Icon + label pairing | Every icon must have a visible text label |
| Color independence | Never convey meaning through color alone — always pair with text/icon |
| Focus indicators | 3px blue ring on focused inputs (`box-shadow: 0 0 0 3px rgba(74, 127, 181, 0.3)`) |
| Motion | Respect `prefers-reduced-motion` — disable all animations |
| Input zoom prevention | Inputs at 16px+ to prevent iOS auto-zoom |

**Fold-specific:** Church communities include elderly users and people with varying tech literacy. Every interaction must be obvious, every label must be descriptive, every action must be reversible or confirmable.
