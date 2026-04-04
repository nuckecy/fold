# Design Application Report — Screen-by-Screen

---

### Screen: Capture Home
**File(s):** `src/app/capture/page.tsx`

**Keep**
- Event card layout with title + badges + date
- ChevronRight for navigation affordance
- "Join a session" FAB positioning
- Greeting bar with first name

**Evolve**
- Cards use inline styles → Move to `.card` CSS class with consistent shadow/radius
- Status pills use `brand` class for all → Use `success` for Active, `muted` for Closed
- Date shown as raw ISO string → Format as "Apr 5, 2026"
- No tap feedback on cards → Add `transform: scale(0.98)` on `:active`
- Text `#000000` → Soften to `#222222`

**Introduce**
- Greeting should include event count: "You have 3 active events"
- Add skeleton loading state while events load
- Add search/filter if more than 5 events

**Priority: High**

---

### Screen: Scan List
**File(s):** `src/app/capture/scan/page.tsx`

**Keep**
- Event list with camera icon for scanning context
- "Join someone else's session" link

**Evolve**
- Cards are basic `.card` → Add Camera icon in a tinted background circle (brand-light)
- No empty state icon → Add Camera icon + descriptive text

**Introduce**
- Show scan count per event in the card (e.g., "12 scans")
- Add last scanned timestamp

**Priority: Medium**

---

### Screen: Event Detail
**File(s):** `src/app/capture/events/[eventId]/page.tsx`

**Keep**
- Metric cards (records/scan+digital/flagged) layout
- Action rows with icons and chevrons
- Page header with back arrow

**Evolve**
- Action rows use inline styles → Wrap in `.action-group` container with `.action-row` items and hairline dividers
- Metric cards use inline styles → Use `.metric-card` CSS class
- Back arrow is Lucide ArrowLeft → Use text chevron `<` or `←` matching iOS pattern
- Info color for back arrow → Use `#222222` text color

**Introduce**
- Event date formatted nicely below title
- "Active" status badge next to title
- Divider between metrics section and actions section

**Priority: High**

---

### Screen: Scanner Viewfinder
**File(s):** `src/app/capture/events/[eventId]/scan/page.tsx`

**Keep**
- Dark background viewfinder concept
- Card alignment rectangle overlay
- Capture button ring design (outer ring + inner circle)
- Scan counter in top-right
- Upload shortcut in bottom-left

**Evolve**
- Camera `startCamera` silently fails → Show user-friendly error with instructions
- Viewfinder rectangle is hardcoded position → Use relative positioning (centered, 70% width)
- Upload icon button has no label → Add "Upload" text below icon
- "Done" button is plain text → Make it more visible (semibold, larger touch target)

**Introduce**
- Scanner count indicator ("2 scanners" with green dot)
- Haptic-style visual flash on successful capture (brief white overlay)
- Scan counter animates when number changes

**Priority: Medium**

---

### Screen: Flagged Records
**File(s):** `src/app/capture/events/[eventId]/records/page.tsx`

**Keep**
- Filter pills at top
- Record rows with name + email status + phone
- Status indicators (check/x icons)

**Evolve**
- Filter pills use Link + `.status-pill` → Add active state styling (filled vs outlined)
- Record rows use inline styles → Use `.action-row` or custom list component
- No dividers between records → Add hairline inset dividers
- "Valid" text on right side → Use status badge component

**Introduce**
- Defective count badge in page header
- Swipe-to-resolve gesture (stretch goal)
- Batch resolve button at bottom

**Priority: Medium**

---

### Screen: Record Detail
**File(s):** `src/app/capture/events/[eventId]/records/[recordId]/page.tsx`

**Keep**
- Side-by-side layout concept (image + fields)
- Confidence labels (High/Low) on fields
- Error state with red border on inputs
- "Save and resolve" primary CTA
- "Skip for now" text link below

**Evolve**
- Image preview is placeholder only → Show actual scan image when available
- Input fields use inline styles → Use `.input-field` CSS class
- Confidence labels are inline text → Use small status badges
- Info callout uses inline styles → Use reusable callout component

**Introduce**
- Field-level edit indicators (green dot for edited fields)
- Keyboard-aware layout (fields scroll above keyboard on mobile)
- Success toast after resolving

**Priority: High**

---

### Screen: Sign In
**File(s):** `src/app/auth/signin/page.tsx`

**Keep**
- "Fold" wordmark in brand color
- Email + password fields
- Eye toggle for password visibility
- "Log in" primary CTA + "Continue with Google" secondary
- Links for forgot password and register

**Evolve**
- Input fields use `.input-field` class → Align with design language (gray bg, no border, 10px radius)
- Button spacing → Standardize to 12px gap between primary and secondary
- Helper text below fields → Same size as body, lighter color
- Overall spacing feels slightly cramped → Add more vertical breathing room (32px between sections)

**Introduce**
- Password strength indicator on register page
- Inline validation (check/x icons) for email format
- Loading state on buttons (spinner replaces text)

**Priority: Medium**

---

### Screen: Register
**File(s):** `src/app/auth/register/page.tsx`

**Keep**
- All required fields present (name, email, org, country, password)
- Country dropdown with chevron
- "Continue with Google" option
- Helper text at bottom

**Evolve**
- Field spacing → Increase gap from 16px to 20px between fields
- Password eye toggle → Match sign-in page styling
- Dropdown select styling → More iOS-native appearance
- "We will send a verification email" → Move above the CTA button, not below

**Introduce**
- Step indicator if registration becomes multi-step
- Inline validation as user types (after first blur)
- Terms/privacy links above the CTA

**Priority: Low**
