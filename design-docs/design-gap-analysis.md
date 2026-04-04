# Design Gap Analysis

## Where Current Implementation Aligns

1. **Frosted glass header** — Already using backdrop-filter blur, matches inspiration
2. **Bottom tab bar** — Icon + label pattern with outline/fill states is correct
3. **iOS-like grouped background** — `#F2F2F7` matches iOS system gray
4. **Card containers** — White surface with subtle shadow exists
5. **Page horizontal padding** — 20px matches the recommendation
6. **iPhone device frame** — Desktop preview is a nice touch
7. **Status badges** — Pill-shaped with color coding exists
8. **Single-column layout** — No multi-column complexity on mobile

## Where It Diverges

| Area | Current | Recommended | Impact |
|---|---|---|---|
| **Text color** | `#000000` pure black | `#222222` softened near-black | Medium — pure black is harsh |
| **Secondary text** | `rgba(60,60,67,0.6)` | `#888888` opaque | Low — visual is similar |
| **Button radius** | `12px` | `12px` | Aligned |
| **Button height** | `50px` | `50px` | Aligned |
| **Input style** | Gray bg, no border | Gray bg, no border | Aligned |
| **Card radius** | `12px` | `12px` | Aligned |
| **Card shadow** | Exists but varies per page | Standardize to one shadow value | High |
| **Typography scale** | iOS sizes (34-11px) | Simplify to 5 levels max | Medium |
| **Status colors** | iOS system colors (#34C759 etc) | Muted church-appropriate tones (#2E7D4F etc) | Medium — current is too vibrant |
| **Inline styles** | Used everywhere | Should be CSS classes / Tailwind | High — maintenance nightmare |
| **Interactive states** | Missing on most elements | Scale 0.97 on press for all tappables | High — feels dead without feedback |
| **Dividers** | `0.5px solid var(--separator)` on some pages | Consistent inset hairlines everywhere | Medium |
| **Helper text** | Sometimes smaller font | Same size as body, lighter color | High — accessibility |
| **Loading states** | None implemented | Skeleton screens needed | Medium |
| **Empty states** | Basic text only | Icon + heading + description + CTA | Medium |

## What Is Missing Entirely

1. **Reusable UI component library** — No shared Button, Input, Card, ListRow components
2. **Press/tap feedback** — No scale animation on interactive elements
3. **Skeleton loading screens** — Content appears with no loading state
4. **Consistent divider system** — Some pages use dividers, others do not
5. **Form validation styling** — No inline error states with colored borders
6. **Progressive disclosure** — "Show all N items" pattern not implemented
7. **Expandable/accordion sections** — Not present
8. **Bottom sheet/modal pattern** — Not implemented
9. **Stepper control** — Needed for card count, attendee range
10. **Search input** — Not present on list screens
11. **Pull-to-refresh** — Expected on mobile list screens
12. **Transition animations** — No page transitions or element animations
13. **Skeleton loading** — No loading state patterns
14. **Error state styling** — No red-bordered inputs with inline error messages
