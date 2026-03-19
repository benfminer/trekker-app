# Wireframe: Hike Log List (/admin/submissions)
> Artifact type: Wireframe + Interaction Spec
> Last updated: 2026-03-19

---

## Screen: Hike Log List
**Purpose:** Allow admins to review all submissions in one place, filter and search them, and edit or delete bad entries to maintain mileage accuracy.
**Entry from:** /admin login (redirect after successful auth), or direct navigation with an active session

---

## Layout

This is a desktop-primary screen. The layout is a full-width admin shell: sticky header across the top, a filter bar below it, a dense data table filling the remaining height, and a pagination row at the bottom.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TRACE TREKKERS — ADMIN                        [← Map]        [Log Out]      │
│  ────────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  Submissions                    14,203 total miles  ·  487 submissions       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  [Search by name...               ]   [Flagged only ☐]  [Imported ☐]  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                       [Clear filters]        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  NAME              DATE      TYPE   INPUT    MILES   SOURCE  FLAG  ACTS  ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │  Ms. Rivera's Cl.  Mar 18    Mi     4.2      4.2     Web     ·     ✎ 🗑  ││
│  │  David M.          Mar 18    Stps   12,000   4.8     Web     ·     ✎ 🗑  ││
│  │  PE Period 3       Mar 17    Mi     12.0     12.0    Web     ⚑     ✎ 🗑  ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │  ▼ EDITING: Ms. Rivera's Class — Mar 18                                  ││
│  │    [Ms. Rivera's Class      ] [Mar 18] [Mi  ▼] [4.2    ]  [SAVE][Cancel] ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │  Coach Andrews     Mar 17    Mi     3.0      3.0     Web     ·     ✎ 🗑  ││
│  │  TRACE Staff       Mar 16    Mi     6.5      6.5     Import  ·     ✎ 🗑  ││
│  │  ...                                                                      ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Showing 1–50 of 487           [< Prev]   Page 1 of 10   [Next >]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Page background:** #0a0a0a
**Header:** sticky, height 52px, bg #0a0a0a, 1px bottom border #1f1f1f
**Table area:** scrollable independently. Table header sticky within the scroll container.
**Max content width:** 1200px centered with horizontal padding 24px.

---

## Components

### Page Header
- **Location:** Fixed top of page, full-width
- **Left:** "TRACE TREKKERS — ADMIN" wordmark. Oswald 700, 18px, white.
- **Right:** Two items — "← Map" text link (routes to /), then "Log Out" text button (clears session, routes to /admin)
- **Height:** 52px
- **Border-bottom:** 1px solid #1f1f1f

### Page Heading + Summary Stats
- **Heading:** "Submissions" — Oswald 700, 20px, white
- **Inline stats:** "14,203 total miles · 487 submissions" — Inter 400, 14px, #9ca3af
- **Layout:** Heading and stats on same line, stats right-aligned or after an em-dash separator
- **Updates:** Stats line reflects currently filtered count when filters are active: "Showing 3 of 487 submissions"

### Filter Bar
- **Search input:** `input[type="text"]`, placeholder "Search by name...", full-width left portion of the bar. Debounce 200ms.
- **Flagged only toggle:** Checkbox with label. Checked state filters to flagged rows only.
- **Imported only toggle:** Checkbox with label. Checked state filters to imported rows only.
- **Clear filters link:** Inter 400, 13px, #f97316. Appears right-aligned below the filter row whenever any filter is active. Tap resets all filter state.
- **Layout:** Filter bar is a single row. Search input is ~60% width. Toggles sit right-aligned.

### Submissions Table

**Column specifications:**

| Column | Width | Content | Format |
|--------|-------|---------|--------|
| Name | 22% | Submission name or class name | Truncate at 28 chars. Full text in `title` attribute for hover. |
| Date | 10% | Submission date | Short format: "Mar 18". Full ISO date in `title` attribute. |
| Type | 8% | Input type | "Mi" or "Stps". Abbreviated. |
| Input | 10% | Raw input value | Comma separator for large numbers: "12,000". Miles shown as "4.2". |
| Miles | 10% | Converted miles | Always 1 decimal place: "4.2". White text (#ffffff), Inter 500. |
| Source | 8% | Origin of record | Small badge: "Web" or "Import". Inter 400, 11px, rounded pill. Web = #1f2937 bg, #9ca3af text. Import = #1a2e1a bg, #4ade80 text. |
| Flag | 8% | Flag toggle | Icon button. See Flag Toggle spec. |
| Actions | 14% | Edit + Delete | Two icon buttons, 24×24px tap targets, 12px gap. |

**Table header row:**
- Inter 500, 12px, uppercase, #6b7280, letter-spacing 0.05em
- Sticky within the table scroll container (position: sticky, top: 0)
- Background: #0a0a0a (matches page)
- Bottom border: 1px solid #2a2a2a

**Table body rows:**
- Height: 48px (desktop). Content vertically centered.
- Row background: #111111 (base)
- Alternating rows: #0f0f0f
- Row dividers: 1px solid #1f1f1f between rows (no outer table border)
- Hover state: row background shifts to #171717

**Flagged row:**
- Background: rgba(251,191,36,0.04) — very faint yellow wash. Does not alternate.
- Flag icon: filled orange (#f97316)

### Inline Edit Row

Opens below the targeted row when the edit icon is tapped. Only one edit row can be open at a time.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ▼ EDITING: [Name] — [Date]                                                  │
│    [Name input          ] [Date input] [Type ▼] [Value input]  [SAVE][Cancel]│
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Header bar:** bg #1a1a1a, border-top 2px solid #f97316, padding 10px 16px
- **Label:** "▼ EDITING: [original name] — [original date]" — Oswald 500, 13px, #f97316
- **Fields:** Compact versions of the same form fields as the log entry form. Input bg: #111111, border: 1px solid #2a2a2a.
  - Name: `input[type="text"]`, 35% width
  - Date: `input[type="date"]`, 15% width
  - Type: `select` dropdown ("Miles" / "Steps"), 15% width
  - Value: `input[type="number"]`, 15% width
- **Save button:** bg #f97316, text white, Oswald 700, 13px uppercase, height 34px, border-radius 4px
- **Cancel:** text link, Inter 400, 13px, #6b7280
- **Loading state (Save):** button shows spinner, disabled, opacity 70%
- **Error state:** error message inside the edit row, below fields: "Could not save. Check your values." Inter 400, 13px, #ef4444

### Delete Confirmation (inline)

Replaces the Actions cell in the targeted row when the delete icon is tapped.

```
Remove 4.2 miles?  [Delete]  [Cancel]
```

- **Text:** "Remove [X] miles?" — Inter 400, 14px, #e5e7eb. X = converted miles from that row.
- **Delete:** text-only button, Inter 500, 13px, #ef4444. No background.
- **Cancel:** text link, Inter 400, 13px, #6b7280
- **Spacing:** 8px between text and Delete, 12px between Delete and Cancel

### Flag Toggle Icon
- **Unflagged state:** Outlined flag SVG, 18×18px, color #4b5563 (gray)
- **Flagged state:** Filled flag SVG, 18×18px, color #f97316 (orange)
- **Hover:** Unflagged → #9ca3af; Flagged → #ea6c0a (slightly darker orange)
- **Transition:** color 100ms ease — instant enough to feel responsive
- **Tap target:** 36×36px (larger than the icon itself)

### Edit Icon
- Pencil SVG, 18×18px, color #4b5563
- Hover: #9ca3af
- Tap target: 36×36px

### Trash / Delete Icon
- Trash SVG, 18×18px, color #4b5563
- Hover: #ef4444
- Tap target: 36×36px
- Transition: color 100ms ease

### Pagination
- **Location:** Full-width row below the table, 16px vertical padding
- **Content:** "Showing [start]–[end] of [total]" — Inter 400, 13px, #9ca3af
- **Prev button:** Text "← Prev". Disabled (color #2a2a2a, cursor-not-allowed) on page 1.
- **Next button:** Text "Next →". Disabled on last page.
- **Active buttons:** Inter 400, 13px, #e5e7eb. Hover: #f97316.
- **Page indicator:** "Page X of Y" — centered. Inter 400, 13px, #6b7280.
- **Visibility:** Hide entire row when total is 50 or fewer (fits on one page).

---

## Content

- **Page heading:** "Submissions"
- **Summary stats:** "[X] total miles · [Y] submissions" — updated when filters are active: "Showing [Z] of [Y] submissions"
- **Search placeholder:** "Search by name..."
- **Filter labels:** "Flagged only" / "Imported only"
- **Table headers:** NAME / DATE / TYPE / INPUT / MILES / SOURCE / FLAG / (icon column, no label)
- **Edit row label prefix:** "EDITING:"
- **Delete confirm text:** "Remove [X] miles?" — never "are you sure" — be direct
- **Source badge:** "Web" or "Import" — no other values

---

## Actions

**Primary:** No single dominant action — this is a management screen. The most frequent action is scanning and reading.
**Row-level actions (in order of frequency):**
1. Flag / unflag a submission (fast, single tap)
2. Delete a submission (two-tap — icon then confirm)
3. Edit a submission (two-step — icon then save)

**Page-level actions:**
- Filter by name (search input)
- Toggle flagged/imported views
- Paginate
- Log out

---

## States

### Loading
- Header and filter bar render immediately. No skeleton there.
- Table body: 10 skeleton rows. Each row has the same column structure as real rows, but all cells are rounded rectangles filled with #1a1a1a.
- Skeleton shimmer: background-position animation cycling from #1a1a1a to #262626 and back, 1.5s linear infinite.

### Empty — No submissions
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   No submissions yet.                                                        │
│   Once the community starts logging miles, they'll appear here.              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Inter 400, 14px, #6b7280. Centered horizontally in the table body area. 60px vertical padding.

### Empty — No results match filters
```
No submissions match your filters.
[Clear filters]
```
- Same styling. "Clear filters" is an orange (#f97316) text link directly below.

### Error — Data fetch failed
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Could not load submissions.  [Retry]                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Banner sits between the filter bar and the table. bg: #1a0a0a, border-left 3px solid #ef4444.
- Inter 400, 14px, #e5e7eb. "Retry" is a text link: #f97316.

### Post-delete animation
- Row: opacity transitions 1→0 over 200ms, then height transitions to 0 over 150ms, then removed from DOM.
- Table below the deleted row reflows naturally.

### Post-save flash
- Updated row: background briefly transitions to rgba(249,115,22,0.10), then fades back to transparent over 600ms.
- Easing: ease-out.

---

## Responsive Behavior

### Desktop (> 1024px)
All columns visible. Full table at natural content width up to 1200px max. This is the primary use context.

### Tablet (640–1024px)
- Table remains. Reduce to 5 visible columns: Name, Date, Miles, Flag, Actions.
- Type, Input, and Source columns are hidden from view but still present in the inline edit row.
- Filter bar: search input full-width, toggles on the row below.
- Horizontal scroll available on the table if content overflows.
- Page max-width: 100%. Horizontal padding: 16px.

### Mobile (< 640px)
- Admin dashboard is not designed for phone use. This is explicitly a tablet/desktop tool.
- Show a soft notice at the top: "For the best experience, open this page on a tablet or larger screen."
- Do not block access. The table with horizontal scrolling remains available.
- Notice: Inter 400, 13px, #9ca3af. bg: #111111, border: 1px solid #2a2a2a, border-radius: 6px, padding: 12px 16px, margin-bottom: 16px.

---

## Typography

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Page heading | Oswald | 700 | 20px | #ffffff |
| Summary stats | Inter | 400 | 14px | #9ca3af |
| Table column headers | Inter | 500 | 12px (uppercase) | #6b7280 |
| Row — name | Inter | 400 | 14px | #e5e7eb |
| Row — date, type, input | Inter | 400 | 14px | #9ca3af |
| Row — miles | Inter | 500 | 14px | #ffffff |
| Source badge | Inter | 400 | 11px | varies (see badge spec) |
| Edit row label | Oswald | 500 | 13px | #f97316 |
| Edit fields | Inter | 400 | 14px | #e5e7eb |
| Save button | Oswald | 700 | 13px (uppercase) | #ffffff |
| Delete confirm | Inter | 500 | 13px | #ef4444 |
| Cancel / Clear filters | Inter | 400 | 13px | #6b7280 |
| Pagination | Inter | 400 | 13px | #9ca3af |
| Search input | Inter | 400 | 14px | #e5e7eb |
| Filter labels | Inter | 400 | 14px | #d1d5db |
| Error banner | Inter | 400 | 14px | #e5e7eb |
| Empty state | Inter | 400 | 14px | #6b7280 |

---

## Color Reference

| Token | Value | Use |
|-------|-------|-----|
| Background | #0a0a0a | Page background |
| Surface | #111111 | Table row (base) |
| Surface alt | #0f0f0f | Alternating rows |
| Surface hover | #171717 | Row hover |
| Surface edit | #1a1a1a | Inline edit row bg |
| Border | #1f1f1f | Row dividers |
| Border strong | #2a2a2a | Table header bottom border, input borders |
| Edit accent border | #f97316 | Top border on edit row header |
| Primary | #f97316 | Save button, links, flag icon (flagged), clear filters |
| Text primary | #ffffff | Miles column, row name |
| Text secondary | #e5e7eb | Row data, input values |
| Text muted | #9ca3af | Summary stats, pagination |
| Text disabled | #4b5563 | Icon default state |
| Flag tint | rgba(251,191,36,0.04) | Flagged row background |
| Save flash | rgba(249,115,22,0.10) | Post-save row highlight |
| Error | #ef4444 | Delete confirm text, error banner accent |
| Error tint | #1a0a0a | Error banner background |
| Import badge bg | #1a2e1a | Import source badge |
| Import badge text | #4ade80 | Import source badge text |
| Web badge bg | #1f2937 | Web source badge |
| Web badge text | #9ca3af | Web source badge text |

---

## Open Questions

1. Are flagged submissions excluded from the total miles calculation shown in the page heading, or just from the map total? Recommend: both — the summary stats should match the map. Confirm with api-builder.
2. Should the admin be able to sort the table by columns other than date? Spec calls for date-descending default. Name and miles sorting would be useful but are not required for v1.
3. Is bulk delete or bulk flag in scope? Per PROJECT_PLAN.md, no — leave out of v1.
4. When the admin uses the search filter with pagination active, does it search the current page only or all pages? Recommend: all pages (server-side search). Confirm with api-builder.
