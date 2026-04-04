# Current Design Audit

## Global Styles (`src/app/globals.css`)

**Current approach:** CSS custom properties with utility classes (btn-primary, btn-secondary, input-field, card, etc.)

### Colors — Current State
- Brand: `#1E3A5F` (navy) — used for primary buttons, avatar, wordmark
- Backgrounds: `#FFFFFF` (white), `#F2F2F7` (iOS gray), `rgba(255,255,255,0.72)` (frosted glass)
- Text: `#000000` primary, `rgba(60,60,67,0.6)` secondary, `rgba(60,60,67,0.3)` tertiary
- Status: iOS system colors (`#34C759` green, `#FF3B30` red, `#FF9500` orange, `#007AFF` blue)
- Separators: `rgba(60,60,67,0.12)` — iOS system separator

### Typography — Current State
- Font stack: `-apple-system, "SF Pro Display", "Inter", system-ui, sans-serif`
- Sizes: 34/28/22/20/17/16/15/13/12/11px (iOS scale)
- Weights: 400, 600, 700
- Letter spacing used on headings (-0.02em to -0.03em)

### Spacing — Current State
- Radii: 8/12/16/20px and 9999px
- Shadows: 4 levels (sm, card, elevated, float)
- Page padding: 20px horizontal
- Card padding: 16px

### Components — Current State
Files in `src/components/`:
- `capture-shell.tsx` — viewport detection, iPhone frame or full-screen layout
- `capture-nav.tsx` — bottom tab bar (Home, Scan, Events, Profile)
- `dashboard-nav.tsx` — sidebar nav for desktop dashboard
- `admin-nav.tsx` — sidebar nav for admin panel
- `mobile-nav.tsx` — hamburger menu for dashboard mobile
- `event-actions.tsx` — lifecycle action buttons
- `activity-timeline.tsx` — event activity feed
- `tiptap-editor.tsx` — rich text editor for email templates
- `providers.tsx` — NextAuth session provider

### Layout — Current State
- Three entry points: `/capture` (mobile), `/dashboard` (desktop), `/admin` (desktop)
- Capture uses client-side viewport detection to render iPhone frame on desktop
- Frosted glass header with backdrop-filter blur
- Bottom tab nav with outline/fill icon states
- Pages use inline styles (not Tailwind classes) for most styling

---

## Key Observations

1. **Inline styles dominate** — Most pages use `style={{}}` objects instead of CSS classes or Tailwind
2. **No reusable UI components** — Each page builds its own buttons, inputs, cards from scratch
3. **iOS colors partially adopted** — Some screens use iOS system colors, others use the original brand palette
4. **Typography is inconsistent** — Some pages use design tokens, others hardcode pixel values
5. **Spacing varies** — No consistent spacing scale applied across pages
6. **No press/tap states** — Buttons and cards lack interactive feedback
7. **Cards use different radius/shadow** on different pages
