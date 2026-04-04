# Implementation Roadmap

---

## Phase 1: Foundation (do first)
*Token and config changes that cascade across the entire app.*

### 1.1 Update CSS Custom Properties
**File:** `src/app/globals.css`
- Replace current color tokens with design language palette (`#222222` text, `#888888` secondary, muted status colors)
- Add spacing scale tokens (`--space-1` through `--space-10`)
- Add typography tokens (`--type-display` through `--type-label`)
- Add shadow tokens (`--shadow-card`, `--shadow-elevated`)
- Add radius tokens (`--radius-sm` 8px, `--radius-md` 12px, `--radius-lg` 16px)
- Remove iOS-specific rgba colors, replace with opaque hex values

### 1.2 Update Utility Classes
**File:** `src/app/globals.css`
- `.btn-primary` — 50px height, 12px radius, `#1E3A5F` fill, `:active { transform: scale(0.97) }`
- `.btn-secondary` — 50px height, 12px radius, 1px border, no fill, same active state
- `.btn-text` — 44px min-height, no border, accent or black text
- `.input-field` — 52px height, 10px radius, `#F7F7F7` bg, no border, focus ring
- `.card` — 12px radius, subtle shadow, 16px padding, `:active { scale(0.98) }`
- `.metric-card` — centered content, card base
- `.action-row` — 52px min-height, 16px gap, divider below within group
- `.action-group` — 12px radius container, hairline dividers between rows
- `.status-badge` — variants for success/warning/error/info/neutral
- `.divider` — 0.5px hairline, 20px horizontal inset
- `.glass` — frosted glass backdrop-filter

### 1.3 Font Stack
**File:** `src/app/layout.tsx`
- Keep Inter from Google Fonts
- Update font-family to: `-apple-system, "Inter", system-ui, sans-serif`

---

## Phase 2: Core Components (build second)
*Reusable React components to replace inline styles across all pages.*

### 2.1 Create `src/components/ui/button.tsx`
- Props: `variant` (primary/secondary/text/destructive), `size` (default/small), `loading`, `disabled`
- Press animation via CSS `:active` state
- Loading state: spinner replaces text

### 2.2 Create `src/components/ui/input.tsx`
- Props: `label`, `error`, `helper`, `type`
- Gray background, no border, focus ring
- Error state: red ring + error message below
- 16px font size (prevents iOS zoom)

### 2.3 Create `src/components/ui/card.tsx`
- Props: `as` (div/link), `pressable`
- Shadow, radius, padding from tokens
- Active state scale animation

### 2.4 Create `src/components/ui/badge.tsx`
- Props: `variant` (success/warning/error/info/neutral/brand)
- Pill shape with icon + text

### 2.5 Create `src/components/ui/list-group.tsx`
- Container with rounded corners + shadow
- Auto-inserts hairline dividers between children
- Each row: icon + text + chevron/value

### 2.6 Create `src/components/ui/page-header.tsx`
- Props: `title`, `back` (href), `badge` (count), `action`
- Consistent sizing and spacing

### 2.7 Create `src/components/ui/empty-state.tsx`
- Props: `icon`, `title`, `description`, `action` (label + href)
- Centered layout with proper spacing

### 2.8 Create `src/components/ui/skeleton.tsx`
- Props: `width`, `height`, `radius`
- Pulsing gray animation
- Compose into page-specific skeleton layouts

---

## Phase 3: Screen-Level Polish (page by page)
*Apply components and design language to each capture page.*

### 3.1 Capture Home (`src/app/capture/page.tsx`) — Priority: High
- Replace inline styles with component imports (Card, Badge)
- Add tap feedback to event cards
- Format dates properly
- Add event count to greeting
- Add skeleton loading state

### 3.2 Event Detail (`src/app/capture/events/[eventId]/page.tsx`) — Priority: High
- Replace inline metric cards with MetricCard component
- Replace inline action rows with ListGroup component
- Add status badge next to title
- Format date nicely

### 3.3 Record Detail (`src/app/capture/events/[eventId]/records/[recordId]/page.tsx`) — Priority: High
- Replace inline inputs with Input component (with error states)
- Replace inline confidence labels with Badge component
- Add success feedback after resolving

### 3.4 Scanner Viewfinder (`src/app/capture/events/[eventId]/scan/page.tsx`) — Priority: Medium
- Center viewfinder rectangle with relative positioning
- Add visual flash on capture
- Improve camera error messaging

### 3.5 Flagged Records (`src/app/capture/events/[eventId]/records/page.tsx`) — Priority: Medium
- Replace inline filter pills with Chip component
- Replace inline record rows with ListGroup
- Add defective count badge in header

### 3.6 Auth Pages (`src/app/auth/signin/page.tsx`, `register/page.tsx`) — Priority: Low
- Replace inline inputs with Input component
- Standardize button spacing
- Add inline validation

### 3.7 Other Capture Pages — Priority: Low
- Fields page, Form page, Scan list, Events list, Profile
- Apply same component replacements

---

## Phase 4: Refinement
*Micro-interactions, transitions, edge states.*

### 4.1 Page Transitions
**File:** `src/app/capture/layout.tsx` or a transition component
- Slide-from-right for push navigation
- Slide-from-bottom for modals

### 4.2 Skeleton Loading
- Create skeleton variants for: event card, metric card, list row, record card
- Add to all server-component pages that fetch data

### 4.3 Pull-to-Refresh
- Add to event list, records list, scan list
- Using native browser pull-to-refresh or custom implementation

### 4.4 Toast/Snackbar Notifications
- "Record resolved" success toast
- "Scan captured" confirmation
- "Offline — saved locally" info toast

### 4.5 Haptic-Style Feedback
- Brief visual flash on camera capture
- Scale animation on successful actions

### 4.6 Reduced Motion Support
- Wrap all animations in `prefers-reduced-motion` media query
- Provide static alternatives

---

## Summary

| Phase | Effort | Impact | Files |
|---|---|---|---|
| Phase 1 | 1-2 hours | Cascading — affects everything | `globals.css`, `layout.tsx` |
| Phase 2 | 3-4 hours | High — enables Phase 3 | 8 new files in `components/ui/` |
| Phase 3 | 4-6 hours | High — visible polish | 7+ capture page files |
| Phase 4 | 2-3 hours | Medium — delight layer | Various |

**Total estimated effort: 10-15 hours**

Start with Phase 1 — it takes the least time but has the broadest impact since every page inherits the updated tokens.
