# Font & Typography Extraction
## Observed from 66 Inspiration Screenshots

---

## Observed Font Family

The inspiration app uses the platform's system font throughout — no custom web fonts, no serif, no decorative typefaces.

**On iOS:** SF Pro Display / SF Pro Text (Apple's system font)
**Characteristics:** Geometric sans-serif, clean, highly legible at all sizes, excellent weight range, built-in tabular figures support.

### Fold Adaptation
```css
font-family: -apple-system, "Inter", "SF Pro Display", system-ui, sans-serif;
```
- On Apple devices: renders as SF Pro (native feel)
- On Android/Windows: falls back to Inter (closest geometric sans-serif)
- System-ui as final fallback

---

## Observed Type Scale

| Level | Observed Size | Weight | Line Height | Letter Spacing | Where Used |
|---|---|---|---|---|---|
| Large Title | 34px | Bold (700) | ~1.1 | -0.03em | Tab screen titles ("Trips", "Wishlists", "Profile") |
| Title 1 | 28px | Bold (700) | ~1.15 | -0.03em | Action screen headings ("Where to?", "Turn on notifications?") |
| Title 2 | 22px | Bold (700) | ~1.2 | -0.02em | Section headings within pages ("Who's coming?", "Cancellation policy") |
| Title 3 | 20px | Semibold (600) | ~1.25 | -0.02em | Modal/sheet titles ("Filters", "Request to book") |
| Headline | 17px | Semibold (600) | ~1.35 | -0.01em | List row primary text, card titles, bold inline text |
| Body | 17px | Regular (400) | ~1.5 | 0 | Default content, descriptions, form labels, paragraphs |
| Callout | 16px | Regular (400) | ~1.5 | 0 | Secondary body text, helper descriptions |
| Subhead | 15px | Regular (400) | ~1.45 | 0 | Input placeholder text, secondary metadata |
| Footnote | 13px | Regular (400) | ~1.4 | 0.01em | Timestamps, captions, category labels, legal text |
| Caption 1 | 12px | Regular (400) | ~1.35 | 0.01em | Bottom tab labels, badge text, very small metadata |

### Key Observations

**Only 2 weights used:** Regular (400) and Semibold/Bold (600-700). No Light (300), no Medium (500), no Extra-Bold (800). This extreme restraint prevents "weight soup."

**Hierarchy through color, not size:** Caption/helper text is often the SAME size as body text (17px) but rendered in a lighter gray (`#717171` instead of `#222222`). This preserves readability for all users — shrinking text to 11-12px creates accessibility problems.

**Headings are conversational:** Display headings use plain language questions ("Who's coming?", "When's your trip?") rather than labels ("Guest Count", "Date Selection"). This feels human and warm.

**No ALL CAPS anywhere:** Section labels, buttons, navigation — nothing uses uppercase. Text is written in natural sentence case. This is warmer and less clinical than uppercase section headers.

**Tight letter-spacing on large text:** Headings at 20px+ use negative letter-spacing (-0.02em to -0.03em). This makes large text feel cohesive and intentional. Body text uses default spacing (0).

**Generous line-height on body:** Body text uses ~1.5 line-height — significantly more than the default ~1.2. This creates breathing room between lines that makes long descriptions comfortable to read.

---

## Font Weight Usage Rules

| Weight | When Used | When NOT Used |
|---|---|---|
| **Bold (700)** | Display headings (28-34px), screen titles | Body text, buttons, captions |
| **Semibold (600)** | Card titles, list primary text, button text, section headings (20-22px) | Helper text, descriptions, metadata |
| **Regular (400)** | Body text, descriptions, helper text, placeholders, legal text | Headings, titles, primary labels |

**Rule:** If you need emphasis within body text, use Semibold (600) — never Bold (700) inline. Bold is reserved for headings only.

---

## Number Typography

| Context | Treatment |
|---|---|
| Prices / Stats | Tabular figures (monospaced digits), same font as body |
| Ratings (4.95) | Regular weight, paired with star icon |
| Counts (22 reviews) | Regular weight, secondary color |
| Dates (Aug 1-2) | Regular weight, natural formatting |
| Stat displays (large) | Title 2 size (22px), Bold weight, tabular figures |

**Tabular figures:** Numbers that appear in columns or counters should use `font-variant-numeric: tabular-nums` so digits are equal width and align vertically.

---

## Button Text

| Button Type | Font Size | Weight | Case | Letter Spacing |
|---|---|---|---|---|
| Primary CTA | 16-17px | Semibold (600) | Sentence case | 0 |
| Secondary CTA | 16-17px | Semibold (600) | Sentence case | 0 |
| Text/Tertiary | 16-17px | Semibold (600) | Sentence case | 0 |
| Small action | 15px | Semibold (600) | Sentence case | 0 |

**All buttons use the same weight and case.** Differentiation is through fill/border treatment, never through font changes.

---

## Input Text

| Element | Font Size | Weight | Color |
|---|---|---|---|
| Input value (typed) | 17px | Regular (400) | `#222222` |
| Placeholder | 17px | Regular (400) | `#B0B0B0` |
| Floating label | 12px | Regular (400) | `#717171` |
| Caption label (above) | 13px | Regular (400) | `#717171` |
| Error message | 14px | Regular (400) | `#C13515` |
| Helper text | 14-15px | Regular (400) | `#717171` |

**Critical: Input font size must be 16px+** to prevent iOS Safari from auto-zooming into the field on focus.

---

## Fold CSS Custom Properties

```css
:root {
  /* Font family */
  --fold-font: -apple-system, "Inter", "SF Pro Display", system-ui, sans-serif;

  /* Type scale */
  --fold-type-large-title: 34px;
  --fold-type-title1: 28px;
  --fold-type-title2: 22px;
  --fold-type-title3: 20px;
  --fold-type-headline: 17px;
  --fold-type-body: 17px;
  --fold-type-callout: 16px;
  --fold-type-subhead: 15px;
  --fold-type-footnote: 13px;
  --fold-type-caption: 12px;

  /* Weights */
  --fold-weight-regular: 400;
  --fold-weight-semibold: 600;
  --fold-weight-bold: 700;

  /* Line heights */
  --fold-leading-tight: 1.15;
  --fold-leading-snug: 1.25;
  --fold-leading-normal: 1.4;
  --fold-leading-relaxed: 1.5;

  /* Letter spacing */
  --fold-tracking-tight: -0.03em;
  --fold-tracking-snug: -0.02em;
  --fold-tracking-normal: 0;
  --fold-tracking-wide: 0.01em;
}
```

---

## Typography Principles for Fold

1. **Never go below 14px** for any rendered text. If something feels secondary, make it lighter gray — not smaller.

2. **Two weights only.** Regular (400) for content, Semibold (600) for emphasis. Bold (700) only for display headings 20px+.

3. **No uppercase.** Use sentence case everywhere, including section headers, buttons, and navigation labels.

4. **Heading letter-spacing gets tighter as size increases.** 20px = -0.02em, 28px+ = -0.03em. Body text = 0.

5. **Line-height 1.5 for body text.** This is non-negotiable for readability during extended use (reviewing records, reading email templates).

6. **Tabular figures for data.** Any number that appears in a counter, stat, or table uses `tabular-nums`.

7. **Input text at 16px+.** Prevents iOS auto-zoom. This is a hard accessibility requirement.

8. **Conversational headings.** Write headings as questions or statements, not as labels. "How many cards?" not "Card Count".
