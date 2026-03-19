# Responsive Layout Guidelines: All Screens
> Artifact type: Responsive Layout Guidelines
> Last updated: 2026-03-19

Covers all four primary screens: Log Entry (/log), Leaderboard (/), Admin Login (/admin), and Hike Log List (/admin/submissions).

---

## Breakpoints

| Name | Range | Primary use context |
|------|-------|---------------------|
| Mobile | < 640px | Student log entry, leaderboard viewing, sharing on phone |
| Tablet | 640–1024px | Log entry on iPad, admin dashboard on tablet |
| Desktop | > 1024px | Admin dashboard primary use, leaderboard on classroom display |

All breakpoints use **min-width** media queries (mobile-first). The base styles are mobile. Tablet and desktop styles layer on top.

---

## Screen 1: Log Entry (/log)

### Layout philosophy
Single-column form. Mobile is the primary context — a student submitting miles on a phone between classes. Desktop is secondary. The layout barely changes between sizes; the main difference is max-width containment and some spacing relaxation.

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile < 640px | Full-bleed. Horizontal padding 20px. Max-width: none (full viewport). Form fields full-width. |
| Tablet 640–1024px | Centered column. Max-width 480px. Horizontal padding 24px. Auto horizontal margins. |
| Desktop > 1024px | Same as tablet. Max-width 480px, centered. The form does not widen further. |

### Layout Shifts
- **Container:** At 640px, shifts from full-bleed to centered 480px column. Horizontal margin changes from `20px` to `auto`.
- **No column shifts** — the form is always single-column. There is no two-column or sidebar treatment at any size.
- **Vertical spacing:** Form field gap stays 24px at all sizes. Page heading top padding: 32px mobile / 48px desktop.
- **Header height:** 48px mobile / 52px desktop.

### Navigation
- **Mobile:** Header with wordmark left, "Map →" text link right. No hamburger, no drawer — there are only two routes in the public app.
- **Tablet/Desktop:** Same header. The "Map →" link scales to match slightly more comfortable tap/click target sizing.

### Touch Targets
- Minimum tap target for all interactive elements: **44 × 44px**
- Submit button: 52px height on all sizes. Full-width on mobile and tablet. Full-width up to 480px max on desktop.
- Miles/Steps toggle: 48px height per tab, full-width of the form column.
- Input fields: 48px height minimum. Font size: 16px minimum on all inputs (prevents iOS auto-zoom on tap focus).

### Typography
| Element | Mobile | Tablet+ |
|---------|--------|---------|
| Page heading | Oswald 700, 26px | Oswald 700, 28px |
| Field labels | Inter 500, 14px | Inter 500, 14px |
| Input values | Inter 400, 16px | Inter 400, 16px |
| Submit button | Oswald 700, 16px | Oswald 700, 16px |
| Hint text | Inter 400, 12px | Inter 400, 13px |
| Error messages | Inter 400, 13px | Inter 400, 13px |

Typography does not change significantly across breakpoints on this screen. The form is intentionally constrained — the 480px max-width means even desktop users see a mobile-proportioned form.

### Keyboard and Input Behavior (Mobile-specific)
- `input[type="number"]` on iOS/Android renders a numeric keypad. Do not use `inputmode="numeric"` — the native `type="number"` behavior is sufficient.
- `input[type="date"]` renders the native date picker on mobile. This is intentional — do not replace with a custom picker.
- `input[type="text"]` renders the standard keyboard. Capitalize the first letter via `autocapitalize="words"`.
- When the software keyboard opens, the browser resizes the viewport. Fixed-position elements in the form should be avoided — none are present by spec.
- On form submit success, the keyboard should dismiss. Handled by removing the input elements from the DOM (success state replaces form).

---

## Screen 2: Leaderboard (/)

### Layout philosophy
The map is the hero at all sizes. Stats and milestones sit below it. On mobile, a fixed bottom CTA is always reachable without scrolling. On desktop, the CTA is in the header and also repeated at the bottom of the page.

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile < 640px | Single column. Map full-width, 55vw height (min 300px). Stats stacked. Milestones list full-width. 3 activity rows. Fixed bottom Log CTA. |
| Tablet 640–1024px | Single column. Map full-width, 60vh. Stats 3-column row. Milestones full-width. 5 activity rows. Log CTA in header only. |
| Desktop > 1024px | Max-width 1200px centered. Map full-width within that container, 65vh min. Stats 3-column row. All sections full-width of container. 5 activity rows. Log CTA in header + bottom of page. |

### Layout Shifts

**Map:**
- Mobile: 55vw height, no margin. Fills the viewport edge-to-edge (no side padding on the map container).
- Tablet+: 60–65vh. Still full-width.
- The map is always the widest element — it breaks out of any padding container to be edge-to-edge. Content sections below have horizontal padding (20px mobile, 24px tablet, auto margins desktop).

**Stats row:**
- Mobile: Each stat block is full-width, stacked vertically. 24px gap. The miles stat comes first, then percentage, then next milestone.
- Tablet+: Three equal columns in a horizontal row. 16px gap. No borders or cards — blocks sit on the page background.
- The progress bar (below the percentage block) on mobile spans the full content width. On desktop it spans the percentage column only.

**Milestones list:**
- Layout does not change significantly across breakpoints. It is always full-width of the content container.
- Text sizing and row height compress slightly on mobile (see Typography table below).
- On mobile, milestone name text truncates more aggressively (see Truncation below).

**Recent activity feed:**
- Mobile: 3 rows. Name truncated to 18 chars.
- Tablet+: 5 rows. Name truncated to 24 chars.

**Log Activity CTA:**
- Mobile: Fixed to the bottom of the viewport. `position: fixed; bottom: 0; left: 0; right: 0`. Height: 52px. Adds `padding-bottom: env(safe-area-inset-bottom)` for iOS home bar. Page content has `padding-bottom: calc(52px + 16px)` so last content item doesn't hide behind it.
- Tablet+: Removed from fixed bottom position. Displayed in header and also as a full-width button at the bottom of the page content flow.

### Navigation
- **Mobile:** Wordmark left, "Log" text link right in header. Sticky.
- **Tablet/Desktop:** Wordmark left, "LOG ACTIVITY →" button right in header. Sticky.
- No hamburger. The public app has two routes: / and /log. Navigation is handled by the header link and the CTA button.

### Touch Targets
- Fixed bottom Log CTA: 52px height — thumb-reachable from the bottom of the viewport.
- Map markers (current position, milestone): tap targets minimum 44×44px. The visual marker may be smaller; pad the tap target using the Mapbox marker element's padding.
- All other tappable elements: 44×44px minimum.

### Map Controls
- **Mobile:** No visible zoom controls (+/- buttons). Pinch-to-zoom and double-tap-to-zoom still active (default Mapbox behavior). Removing the controls declutters the mobile map surface.
- **Tablet:** Zoom controls visible, bottom-right position.
- **Desktop:** Zoom controls visible, bottom-right position.

### Typography
| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Wordmark | Oswald 700, 18px | Oswald 700, 20px | Oswald 700, 20px |
| Stats number | Oswald 700, 36px | Oswald 700, 40px | Oswald 700, 40px |
| Stats label | Inter 400, 12px | Inter 400, 13px | Inter 400, 13px |
| Next milestone name | Oswald 700, 18px | Oswald 700, 22px | Oswald 700, 22px |
| Next milestone distance | Inter 400, 13px | Inter 400, 14px | Inter 400, 14px |
| Section headings | Oswald 700, 12px | Oswald 700, 12px | Oswald 700, 13px |
| Milestone name | Inter 400–600, 14px | Inter 400–600, 14px | Inter 400–600, 14px |
| Activity row — name | Inter 400, 13px | Inter 400, 14px | Inter 400, 14px |
| Activity row — miles | Inter 500, 13px | Inter 500, 14px | Inter 500, 14px |
| Log CTA | Oswald 700, 16px | Oswald 700, 18px | Oswald 700, 18px |

---

## Screen 3: Admin Login (/admin)

### Layout philosophy
A centered, minimal form. No complex layout concerns. Login is a one-time action — the admin does it once and stays logged in. Over-engineering this screen is not worth the effort.

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile < 640px | Centered single column. 20px horizontal padding. Form not contained in a card. Vertically centered with flexbox (`min-height: 100vh`). |
| Tablet 640–1024px | Same centering. Max-width 400px. Auto horizontal margins. |
| Desktop > 1024px | Same. Max-width 400px. The login form does not expand with the viewport. |

### Layout Shifts
- No significant layout shifts. This screen is always a single centered column at 400px max.
- On mobile, full-width form fields with 20px side padding. On tablet+, 400px max-width auto-centered.

### Navigation
No navigation on the login screen. Intentional — the admin URL is obscured. No links to the public site from this screen.

### Touch Targets
- Log In button: 52px height, full-width of the form column.
- Username and password inputs: 48px height. Font size: 16px minimum (prevents iOS auto-zoom).

### Typography
| Element | Mobile | Desktop |
|---------|--------|---------|
| Wordmark | Oswald 700, 22px | Oswald 700, 24px |
| "Admin Access" subhead | Inter 400, 14px | Inter 400, 14px |
| Field labels | Inter 500, 14px | Inter 500, 14px |
| Input values | Inter 400, 16px | Inter 400, 16px |
| Log In button | Oswald 700, 16px uppercase | Oswald 700, 16px uppercase |
| Error message | Inter 400, 14px | Inter 400, 14px |

---

## Screen 4: Hike Log List (/admin/submissions)

### Layout philosophy
Desktop-primary. This is a data management tool — it needs density, scannability, and precision. Mobile is tolerated but not designed. Tablet is the secondary context (admin reviewing on an iPad).

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile < 640px | Horizontal scroll enabled on the table. Soft notice banner shown above table: "Open on a larger screen for the best experience." No columns are hidden — the table is full-width with overflow-x: auto. Not optimized for phone. |
| Tablet 640–1024px | Table visible with reduced column set: Name, Date, Miles, Flag, Actions (5 visible columns). Type, Input, Source columns hidden but available in the inline edit row. Filter bar: search full-width on its own row, toggles on row below. Page horizontal padding: 16px. |
| Desktop > 1024px | All 8 columns visible. Page max-width 1200px, horizontal padding 24px. This is the designed experience. |

### Layout Shifts

**Table columns (by breakpoint):**
| Column | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Name | visible | visible | visible |
| Date | visible | visible | visible |
| Type | visible | hidden | visible |
| Input | visible | hidden | visible |
| Miles | visible | visible | visible |
| Source | visible | hidden | visible |
| Flag | visible | visible | visible |
| Actions | visible | visible | visible |

**Filter bar:**
- Desktop: All filters in one horizontal row. Search: ~60% width. Toggles: right-aligned in same row.
- Tablet: Search input full-width on top row. Flagged/Imported toggles on a second row below.
- Mobile: Same as tablet (stacked).

**Pagination:**
- No change across breakpoints — Prev/Next/page-indicator row below the table at all sizes.

### Navigation
- Admin header at all sizes: wordmark left, "← Map" link + "Log Out" right.
- Header is sticky at all sizes.

### Touch Targets (Tablet)
- Flag, edit, and delete icon buttons: visual icon is 18px, but tap target must be 44×44px. Add padding or use `min-width: 44px; min-height: 44px` on the button element.
- Row height on tablet: increase from 48px to 52px to give more comfortable vertical tap surface.
- Inline edit Save/Cancel: Save button minimum height 40px; Cancel tap target minimum 44px height.

### Typography (changes across breakpoints)
| Element | Mobile/Tablet | Desktop |
|---------|--------------|---------|
| Table row text | Inter 400, 14px | Inter 400, 14px |
| Table headers | Inter 500, 11px | Inter 500, 12px |
| Pagination | Inter 400, 13px | Inter 400, 13px |
| Page heading | Oswald 700, 18px | Oswald 700, 20px |
| Summary stats | Inter 400, 13px | Inter 400, 14px |

### Horizontal Scroll on Mobile
- The submissions table container is `overflow-x: auto` on all sizes.
- On desktop and tablet (with reduced columns), the table content fits within the viewport and no scroll is needed.
- On mobile, the table is the same full column set, and horizontal scrolling allows access to all data. This is acceptable — mobile is not the designed context.
- The filter bar, pagination row, and page heading do NOT scroll horizontally — only the table itself.

---

## Shared Across All Screens

### Header Consistency
All four screens share a common header shell:
- bg: #0a0a0a
- Border-bottom: 1px solid #1f1f1f
- Wordmark: "TRACE TREKKERS" in Oswald 700, left-aligned
- Height: 48px (mobile) / 52–56px (desktop)
- Sticky positioning: `position: sticky; top: 0; z-index: 100`

The admin screens add " — ADMIN" to the wordmark. The admin header also differs in its right-side actions.

### Color and Typography System
The same color tokens and font choices apply to all screens. See individual wireframe files for per-element specs. Core tokens:
- Background: #0a0a0a
- Primary accent: #f97316 (orange)
- Text primary: #ffffff
- Text secondary: #9ca3af
- Border: #1f1f1f / #2a2a2a
- Error: #ef4444

### Font Loading Strategy
- **Oswald** (700, 500) and **Inter** (400, 500, 600) loaded from Google Fonts.
- Use `display=swap` in the font link to prevent invisible text during font load.
- Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com` in the document `<head>`.
- Fallback stack: `Oswald, 'Impact', sans-serif` for display; `Inter, system-ui, -apple-system, sans-serif` for body.

### Safe Area (iOS)
- Fixed bottom elements (mobile Log CTA on leaderboard) must respect the iOS home bar using `padding-bottom: env(safe-area-inset-bottom)`.
- All other screens: standard 20px bottom padding is sufficient.

### Focus States (Keyboard/Accessibility)
- All interactive elements must have a visible `:focus-visible` state.
- Focus ring: 2px solid #f97316, 2px offset. Applied to all buttons, links, and inputs.
- Do not suppress the focus ring with `outline: none` without providing an alternative.
- Form inputs: on focus, border-color shifts to #f97316. This doubles as the focus indicator.

---

## What Does Not Change

These elements behave identically across all breakpoints and screens:
- Color palette (no light mode — dark only)
- Font families (Oswald + Inter)
- Orange as the exclusive accent color
- Error color (#ef4444)
- Transition timing for hover/active states: 100ms ease for color, 150ms ease for opacity
- Minimum tap target size: 44×44px
- Input font size: 16px minimum (prevents iOS zoom)
