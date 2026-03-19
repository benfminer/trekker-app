# UX Spec: Admin Dashboard (/admin)
> Artifact type: User Flow + Wireframe + Interaction Spec
> Last updated: 2026-03-19

---

## Overview

The admin dashboard is a functional tool used by 2 admins. Its job is to let them review submissions quickly, catch bad data, and maintain the integrity of the mileage total. The design principle is: fast, scannable, no friction. Admins are power users. They know what they're doing. Get out of their way.

There are two sub-screens: the login screen and the submissions management view.

---

## User Flow — Login

**User:** One of 2 TRACE admins
**Goal:** Access the submission management dashboard
**Entry point:** Direct navigation to /admin — not publicly linked

### Steps

1. **Admin navigates to /admin**
   - Happy path: Login form appears immediately
   - Edge case: Already logged in (valid session token in localStorage/cookie) — redirect to /admin/dashboard, skip login

2. **Admin enters username and password**
   - Happy path: Correct credentials → POST to auth endpoint → token stored → redirect to /admin/dashboard
   - Edge case: Wrong credentials → inline error: "Username or password is incorrect"
   - Edge case: Both fields empty → inline error: "Enter your username and password"
   - Edge case: One field empty → highlight empty field with error border, message: "This field is required"

3. **Admin is authenticated**
   - Session token stored (httpOnly cookie preferred; if not available, localStorage with short expiry)
   - Redirected to /admin/dashboard

**Exit point:** Admin is logged in and on the dashboard.

---

## User Flow — Submissions Management

**User:** Authenticated admin
**Goal:** Review pending submissions; edit, delete, or flag bad entries; confirm the mileage total is clean
**Entry point:** /admin/dashboard after login

### Steps

1. **Dashboard loads**
   - Happy path: Table populates with all submissions (most recent first), default filter shows all
   - Loading state: Skeleton rows while data fetches
   - Edge case: No submissions — empty state message

2. **Admin scans the submissions table**
   - Sees: name, date, input type (Mi/Stps), raw input value, converted miles, flagged status, source (web or import)
   - Scans for anomalies: very high numbers, duplicate names on same date, suspicious entries

3. **Admin filters submissions**
   - By name (text search — filters in real time as typed)
   - Flagged only (toggle: show only flagged submissions)
   - Imported only (toggle: show only CSV-imported records)
   - Filters stack — admin can search by name AND show only flagged
   - Clearing filters: "Clear filters" text link appears when any filter is active

4. **Admin edits a submission**
   - Taps the Edit icon on a row
   - An inline edit row expands (or a modal opens — see decision below) with editable fields: name, date, input type, value
   - Admin makes changes and taps "Save" — PATCH request fires, row updates in place
   - Admin taps "Cancel" — changes discarded, row returns to normal

5. **Admin deletes a submission**
   - Taps the Delete icon on a row
   - Confirmation appears inline or as a small popover: "Delete this submission? This removes [X] miles from the total." with "Delete" and "Cancel" buttons
   - On confirm: DELETE request fires, row is removed from the table with a brief fade-out animation

6. **Admin flags a submission**
   - Taps the Flag icon — marks submission as suspicious without deleting it
   - Row gains a visual indicator (flag icon turns orange)
   - Flagged submissions are excluded from the mileage total (API behavior — confirm with api-builder)
   - Admin can un-flag by tapping again

7. **Admin logs out**
   - Logout button in header — clears session, redirects to /admin login screen

**Exit point:** Admin has reviewed and cleaned the submission data. The mileage total on the map now reflects accurate data.
**Emotional arc:** Efficient and trustworthy. No surprises. The admin should feel in control at all times.

---

## Wireframe — Login Screen (/admin)

```
┌────────────────────────────────────┐
│           TRACE TREKKERS           │  ← Wordmark. Oswald 700, 24px, centered.
│           Admin Access             │  ← Subhead. Inter 400, 14px, #9ca3af, centered.
│                                    │
│  ┌────────────────────────────┐   │
│  │ Username                   │   │  ← Text input. Label above. Full width.
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ Password                   │   │  ← Password input. Label above.
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │           LOG IN           │   │  ← Primary button. #f97316 bg. Full width.
│  └────────────────────────────┘   │     Oswald 700, uppercase.
│                                    │
│  [Error message if login fails]    │  ← Inter 400, 14px, #ef4444. Centered.
│                                    │
└────────────────────────────────────┘

PAGE: centered vertically and horizontally. Max-width: 400px.
BACKGROUND: #0a0a0a. No card/box — fields sit on the page directly.
```

---

## Wireframe — Admin Dashboard (/admin/dashboard)

```
┌──────────────────────────────────────────────────────────────────┐
│  TRACE TREKKERS — ADMIN              [← Map]      [Log Out]      │  ← Header. bg: #0a0a0a. Sticky.
│  ────────────────────────────────────────────────────────────    │     Height: 52px.
│                                                                  │
│  Submissions          14,203 total miles  ·  487 submissions    │  ← Page heading. Oswald 700, 20px.
│                                                                  │     Stats inline, Inter 400, 14px, #9ca3af.
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Search by name...      ]  [Flagged only ☐]  [Imported ☐] │ │  ← Filter bar.
│  └────────────────────────────────────────────────────────────┘ │     Text input left. Toggles right.
│                                    [Clear filters] ←            │     "Clear filters" link: visible only when active.
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ NAME           DATE      TYPE  INPUT   MILES   FLAG  ACTIONS │ │  ← Table header. Inter 500, 12px, #6b7280. Uppercase.
│  ├──────────────────────────────────────────────────────────────┤ │     Sticky header on scroll within table.
│  │ Ms. Rivera's   Mar 18    Mi    4.2     4.2     ·     ✎ 🗑   │ │  ← Row. Inter 400, 14px.
│  │ David M.       Mar 18    Stps  12,000  4.8     ·     ✎ 🗑   │ │     FLAG col: ⚑ icon. Orange = flagged.
│  │ PE Period 3    Mar 17    Mi    12.0    12.0    ⚑     ✎ 🗑   │ │     Gray = unflagged (tappable).
│  │ [edit row expanded — see below]                              │ │     ACTIONS: edit pencil + trash icon.
│  │ Coach Andrews  Mar 17    Mi    3.0     3.0     ·     ✎ 🗑   │ │
│  │ TRACE Staff    Mar 16    Mi    6.5     6.5     ·     ✎ 🗑   │ │
│  │ ...                                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Showing 1–50 of 487  [< Prev]  [Next >]                         │  ← Pagination. 50 rows per page.
└──────────────────────────────────────────────────────────────────┘
```

### Edit Row (inline expansion)

When admin taps the edit icon, the row expands below the selected row:

```
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ ▼ EDITING: Ms. Rivera's Class — Mar 18                      │ │  ← Edit mode header bar. bg: #1a1a1a.
│  │   ┌──────────────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐ │ │     Oswald 500, 13px, orange.
│  │   │ Ms. Rivera's Cl. │ │Mar 18│ │ Mi  ▼   │ │  4.2     │ │ │
│  │   └──────────────────┘ └──────┘ └──────────┘ └──────────┘ │ │  ← Inline editable fields.
│  │                                    [SAVE]  [Cancel]         │ │     Full-width of row.
│  └──────────────────────────────────────────────────────────────┘ │
```

---

## Component Inventory

| Component | Type | Notes |
|-----------|------|-------|
| Page header | Layout | Wordmark, "← Map" link, "Log Out" button. Sticky. bg: #0a0a0a. |
| Page heading + stats | Typography | "Submissions" heading. Total miles and submission count inline. |
| Search input | Filter control | Real-time text filter on name field. Debounce 200ms. |
| Flagged filter toggle | Checkbox toggle | Filters table to flagged submissions only. |
| Imported filter toggle | Checkbox toggle | Filters table to CSV-imported records only. |
| Clear filters link | Text link | Appears when any filter is active. Resets all filters. |
| Submissions table | Data table | Columns: Name, Date, Type, Input, Miles, Flag, Actions. Sortable by Date (default desc). |
| Table sticky header | Layout | Column headers stay visible when scrolling the table. |
| Flag icon | Action icon | Per-row. Orange = flagged. Gray = unflagged. Tap to toggle. |
| Edit icon | Action icon | Per-row. Opens inline edit row. |
| Delete icon | Action icon | Per-row. Triggers inline confirmation. |
| Inline edit row | Expanded row | Opens below the target row. Editable: name, date, type, value. Save/Cancel. |
| Delete confirmation | Inline popover | Small confirmation attached to the row. Not a full modal. |
| Pagination | Navigation | 50 rows per page. Prev/Next. Current page indicator. |
| Loading skeleton | State | 10 skeleton rows while data loads. |
| Empty state | State | When no results match filters, or no submissions at all. |
| Error state | State | If the data fetch fails. Retry option. |

---

## Decision: Inline Edit vs. Modal

**Decision: Inline edit row.**

Rationale:
- Admins are scanning a table. Opening a modal breaks their context entirely.
- Inline edit keeps the surrounding rows visible for reference — useful when correcting a duplicate.
- The fields being edited (name, date, type, value) are simple — no complex pickers or multi-step logic.
- Modals are appropriate when the edit form is complex or requires multi-step confirmation. This is neither.

Implementation note: Only one row can be in edit mode at a time. If admin taps Edit on a second row while one is already open, the first collapses (discarding unsaved changes) and the second opens. Do not auto-save — always require explicit Save tap.

---

## Interaction Specs

### Search Filter
- Input type: text. Placeholder: "Search by name..."
- Debounce: 200ms after last keystroke before filtering
- Filters the table client-side if all submissions are loaded (< 500 rows); server-side query if paginating
- Case-insensitive, partial match (searches substring)
- While searching, the row count in the page heading updates: "Showing 3 of 487 submissions"

### Flag Toggle
- Tap flag icon → PATCH request to mark submission as flagged/unflagged
- Optimistic update: icon changes color immediately, reverts if request fails
- Flagged submissions: row background changes to rgba(251, 191, 36, 0.05) — very subtle yellow tint. Not distracting.
- Flag icon: ⚑ or equivalent SVG. Filled orange when flagged, outlined gray when not.

### Delete Confirmation
- Tap trash icon → inline confirmation replaces the action icons in that row:
  ```
  Remove [X] miles? [Delete] [Cancel]
  ```
- "Delete" button: Inter 500, 13px, #ef4444 text, no background
- "Cancel" link: Inter 400, 13px, #6b7280
- On confirm: DELETE request fires, row fades out (opacity 1→0, 200ms), row height collapses (height→0, 150ms after fade), removed from DOM
- On cancel: confirmation collapses, action icons return
- If DELETE request fails: row stays, error toast appears: "Could not delete. Try again."

### Inline Edit Save
- On Save: PATCH request fires, button shows loading state
- Success: edit row collapses, updated values appear in the main row, brief highlight flash (row bg transitions to rgba(249, 115, 22, 0.1) and fades back to transparent over 600ms)
- Failure: error message appears inside the edit row: "Could not save. Check your values and try again."

### Pagination
- 50 rows per page (default — hardcoded, not user-adjustable in v1)
- Prev/Next buttons. Current page number shown. Total page count shown.
- On page change: scroll to top of table automatically
- If only 1 page: hide pagination controls entirely

### Log Out
- Tap Log Out → clear session token, redirect to /admin
- No confirmation dialog needed — admin can just log back in

---

## Table Column Specs

| Column | Width | Content | Notes |
|--------|-------|---------|-------|
| Name | 22% | Submission name/class name | Truncate at 28 chars with ellipsis. Full text on hover via title attribute. |
| Date | 10% | Formatted date | Display as "Mar 18" (short). Full date in title attribute. |
| Type | 8% | "Mi" or "Stps" | Abbreviated. |
| Input | 10% | Raw input value | Display with comma separator for steps (e.g., "12,000"). |
| Miles | 10% | Converted miles | Always 1 decimal place: "4.2". |
| Source | 8% | "Web" or "Import" | Small badge. Inter 400, 11px. |
| Flag | 8% | Flag icon | Toggle. |
| Actions | 14% | Edit + Delete icons | 24×24px icon buttons. 12px gap between. |

Total: ~90% — leave 10% for row padding.

---

## Mobile Behavior

The admin dashboard is used on desktop or laptop — not optimized for phone use. However, it should not break on tablet.

**Tablet (640–1024px):**
- Table remains visible with horizontal scroll if needed
- Reduce visible columns to: Name, Date, Miles, Flag, Actions
- Type and Input columns collapse (visible in expanded edit row)
- Search bar full-width above table
- Filter toggles move below search bar

**Mobile (< 640px):**
- Display a message: "The admin dashboard works best on a larger screen. Open it on a tablet or computer for the best experience."
- Still allow access — don't hard block. Show the table with horizontal scrolling.
- This is not a target context. No further mobile optimization needed for v1.

---

## Empty and Loading States

### Loading
- Show 10 skeleton rows: alternating bg #111 and #0f0f0f, with animated shimmer (background-position animation, 1.5s linear infinite)
- Skeleton columns match real column widths
- Header and filter bar render immediately (no loading state for those)

### Empty — No submissions
- Center of table area: Inter 400, 14px, #6b7280
- Text: "No submissions yet. Once the community starts logging miles, they'll appear here."

### Empty — No results for filter
- "No submissions match your filters."
- Below: "Clear filters" text link

### Error — Data fetch failed
- Banner at top of table: "Could not load submissions. [Retry]"
- Inter 400, 14px. Retry is a text link that re-fires the fetch.

---

## Typography

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Page heading | Oswald | 700 | 20px | #ffffff |
| Inline stats (header row) | Inter | 400 | 14px | #9ca3af |
| Table header labels | Inter | 500 | 12px uppercase | #6b7280 |
| Table row — name | Inter | 400 | 14px | #e5e7eb |
| Table row — data | Inter | 400 | 14px | #9ca3af |
| Table row — miles | Inter | 500 | 14px | #ffffff |
| Edit row label | Oswald | 500 | 13px | #f97316 |
| Delete confirm text | Inter | 500 | 13px | #ef4444 |
| Filter input | Inter | 400 | 14px | #e5e7eb |
| Pagination | Inter | 400 | 13px | #9ca3af |
| Login heading | Oswald | 700 | 24px | #ffffff |
| Login subhead | Inter | 400 | 14px | #9ca3af |
| Login CTA | Oswald | 700 | 16px uppercase | #ffffff |

---

## Color Reference

| Token | Value | Use |
|-------|-------|-----|
| Background | #0a0a0a | Page background |
| Surface | #111111 | Table row backgrounds |
| Surface alt | #0f0f0f | Alternating rows |
| Border | #1f1f1f | Row dividers, table borders |
| Edit row bg | #1a1a1a | Background of expanded edit row |
| Flag orange | #f97316 | Flagged icon color |
| Flag tint | rgba(251,191,36,0.05) | Flagged row background |
| Save highlight | rgba(249,115,22,0.1) | Post-save flash on updated row |
| Error | #ef4444 | Delete confirm, validation errors |
| Primary | #f97316 | CTA button, links |

---

## Open Questions / Decisions for Frontend

1. Are flagged submissions excluded from the total miles calculation, or just visually marked? The spec assumes excluded. Confirm with api-builder — this affects whether the flag action triggers a total recalculation.
2. Session persistence: Should the admin session survive page refresh? Recommend: yes, with a token stored in localStorage and a short expiry (24 hours). Confirm auth mechanism with auth-agent (already implemented as `has_secure_password` + session tokens).
3. Pagination vs. infinite scroll: Spec calls for pagination (50 rows). Simpler to implement, easier to reason about for an admin. Confirm this is acceptable.
4. Is there a "bulk delete" or "bulk flag" requirement? Not in scope per PROJECT_PLAN.md — leaving out of v1.
5. Sort behavior: Should columns be sortable by clicking headers? Spec defaults to date descending. Other sort options (by name, by miles) would be useful but are not required for v1. Recommend: date sort only for launch.
