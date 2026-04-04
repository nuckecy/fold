# Color Extraction
## Observed Colors from 66 Inspiration Screenshots

**Rule:** These are observed color patterns and relationships, not copied brand colors. Fold will adapt these into its own palette while preserving the principles.

---

## Observed Color Palette

### Neutrals (95% of the UI)

| Role | Observed Hex | Where Used |
|---|---|---|
| Primary text | `#222222` | Headlines, body text, button text, input values |
| Secondary text | `#717171` | Helper text, captions, timestamps, metadata |
| Tertiary text | `#B0B0B0` | Placeholder text, disabled states |
| Divider / Hairline | `#EBEBEB` | 0.5px separators between list rows |
| Input background | `#F7F7F7` | Form field fills (no border) |
| Page background | `#FFFFFF` | Primary surface |
| Grouped background | `#F7F7F7` | Behind card groups, settings sections |
| Card surface | `#FFFFFF` | Card fills, modal fills, bottom sheet fills |
| Inactive icon | `#B0B0B0` | Bottom nav unselected icons |
| Border (rare) | `#DDDDDD` | Secondary button border, input border on focus |

### Accent Color (Single, Used Sparingly)

| Role | Observed Hex | Where Used |
|---|---|---|
| Primary CTA fill | `#FF385C` | Primary buttons only ("Continue", "Request to book", "Search") |
| Primary CTA text | `#FFFFFF` | White text on accent button |
| Active nav label | `#FF385C` | Bottom tab bar active label text |
| Link text | `#222222` underlined | Inline text links use black with underline, NOT the accent |

**Critical observation:** The accent color appears on fewer than 10% of UI elements. It is reserved exclusively for the single most important action on any given screen. Everything else is black, gray, or white.

### Validation / Status Colors

| Role | Observed Hex | Where Used |
|---|---|---|
| Success (valid) | `#008A05` | Checkmark icon next to valid password rules |
| Error (invalid) | `#C13515` | X icon next to failed rules, error input border |
| Error text | `#C13515` | "Password strength: weak" text |
| Error input border | `#C13515` | Red bottom border on invalid fields |
| Warning (info icon) | `#E31C5F` | Outlined icon for notices (pink-red tone) |
| Star rating | `#222222` | Star icon + rating number use primary text color, not yellow |

**Critical observation:** Status colors are used ONLY inline next to the specific element they reference. Never as background fills, never as banners, never as page-level indicators. The field itself gets a colored border + the message below gets the color. Nothing else changes.

### Background Tints (Very Subtle)

| Role | Observed Hex | Where Used |
|---|---|---|
| Selected chip fill | `#222222` | Filled black chip for selected filter option |
| Unselected chip | `#FFFFFF` + `#DDDDDD` border | White chip with gray border |
| Disabled button fill | `#DDDDDD` | Grayed-out CTA when conditions not met |
| Badge / tag background | `#F7F7F7` | Subtle gray badge behind status text |
| Sticky bottom bar bg | `#FFFFFF` | White with subtle top shadow for elevation |
| Toast background | `#222222` | Dark near-black toast with white text |

---

## Color Relationships & Principles

### Principle 1: Two-Tone Foundation
The entire UI operates on just two colors: near-black (`#222222`) and white (`#FFFFFF`). Every other color is either:
- A gray between those two extremes (for hierarchy)
- The single accent (for primary actions)
- A status indicator (used inline only)

### Principle 2: Accent Scarcity Creates Impact
The accent color gets its power from scarcity. On a screen of 50+ elements, only 1-2 use the accent. This makes the primary action unmissable without shouting.

### Principle 3: Status Colors Are Inline, Never Ambient
Validation colors appear directly next to the element they describe — never as a banner, background tint, or separate notification. The user's eye goes to the field, sees the issue, fixes it. No hunting.

### Principle 4: No Decorative Color
There is zero decorative use of color. No colored headers, no tinted sections, no gradient backgrounds, no colored dividers. Color is purely functional: either it means something (action, status) or it is neutral.

### Principle 5: Elevation Through Shadow, Not Color
Depth is communicated through subtle box-shadows, not colored backgrounds. Cards sit on white, bottom bars sit on white, sheets sit on white — all differentiated by shadow, not fill color.

---

## Fold Color Adaptation

Based on these observations, here is the recommended Fold palette:

```css
:root {
  /* ─── Neutrals ─── */
  --fold-text-primary: #222222;
  --fold-text-secondary: #717171;
  --fold-text-tertiary: #B0B0B0;
  --fold-text-inverse: #FFFFFF;

  --fold-bg: #FFFFFF;
  --fold-bg-secondary: #F7F7F7;
  --fold-bg-grouped: #F2F2F7;  /* iOS system grouped bg */

  --fold-divider: #EBEBEB;
  --fold-border: #DDDDDD;
  --fold-disabled: #DDDDDD;

  /* ─── Brand Accent ─── */
  --fold-accent: #1E3A5F;         /* Fold's navy — replaces the coral accent */
  --fold-accent-hover: #162D4A;
  --fold-accent-light: #EEF2F7;   /* Very light tint for selected states */

  /* ─── Status (inline only, never as backgrounds) ─── */
  --fold-success: #2E7D4F;        /* Muted green — resolved records, sent emails */
  --fold-error: #C0392B;          /* Controlled red — defective records, validation */
  --fold-warning: #C68A1D;        /* Warm amber — pending review, approaching limits */
  --fold-info: #4A7FB5;           /* Calm blue — processing, informational */

  /* ─── Interactive States ─── */
  --fold-focus-ring: rgba(74, 127, 181, 0.3);  /* Blue translucent ring on focus */
  --fold-press-overlay: rgba(0, 0, 0, 0.04);   /* Subtle gray flash on tap */

  /* ─── Elevation ─── */
  --fold-shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
  --fold-shadow-elevated: 0 4px 12px rgba(0,0,0,0.08);
  --fold-shadow-float: 0 8px 24px rgba(0,0,0,0.12);

  /* ─── Toast ─── */
  --fold-toast-bg: #222222;
  --fold-toast-text: #FFFFFF;
}
```

### What Changes from the Inspiration

| Inspiration | Fold Adaptation | Why |
|---|---|---|
| Coral/rose accent `#FF385C` | Navy `#1E3A5F` | Fold's established brand identity. Navy conveys trust and authority appropriate for church tools. |
| Star ratings in black | Not applicable | Fold has no star ratings |
| Pink warning icon `#E31C5F` | Amber `#C68A1D` | Warmer, less alarming tone for church context |
| Pure black toasts `#000000` | Near-black `#222222` | Softer, consistent with text color |

### What Stays the Same

| Pattern | Kept As-Is | Why |
|---|---|---|
| Two-tone foundation | Yes | Maximum clarity, minimum distraction |
| Accent scarcity | Yes | Fold CTAs should pop the same way |
| Inline-only status colors | Yes | Church users should not be overwhelmed by color |
| No decorative color | Yes | Tool-like clarity over magazine aesthetics |
| Shadow-based elevation | Yes | Clean depth without color complexity |
| `#222222` over `#000000` | Yes | Softer on eyes, especially for extended use during events |
| `#F7F7F7` input backgrounds | Yes | Distinguishes inputs without harsh borders |
| `#EBEBEB` hairline dividers | Yes | Subtle structure without visual weight |
