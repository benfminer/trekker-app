# Component Spec: Admin Filter Bar, Sort Headers, and Pagination Polish
> Last updated: 2026-03-26

Targeted redesign spec for the three clunky elements added to `AdminPage.tsx`. This document describes exactly how each area should look and behave. Everything is implementable directly from this spec — no design tools required.

---

## Problem Summary

The recently added controls (date/miles filter row, sort indicators, enhanced pagination) are technically functional but visually discordant. The root causes are:

1. **The filter bar grew vertically** — a second row of inputs stacked below the first creates cognitive weight that doesn't match the density and restraint of the rest of the UI.
2. **The sort indicators use text characters** — `↕ ↑ ↓` Unicode arrows at 12px are too small to read with intent. They look like decoration, not controls.
3. **The pagination bar has too many distinct elements in one row** — "← First", "← Prev", page jump, "Next →", "Last →", and a per-page selector all at the same visual weight creates scanning noise.

The fixes below compress, clarify, and unify these controls without removing functionality.

---

## 1. Filter Bar

### Current behavior
Two rows:
- Row 1: Search input, All/Live/Imported toggle, Flagged only checkbox
- Row 2: Date from/to inputs with "Date:" label, miles min/max inputs with "Miles:" label, Apply button, conditional "Clear date/miles" button
- Conditional "Clear filters" button floated right below row 2

### Problem
The second row is visually heavy. Plain text labels ("Date:", "Miles:") plus input-dash-input patterns with separate Apply and Clear buttons produce 10+ interactive elements across two rows. The Apply button creates a two-step commit pattern that is inconsistent with the rest of the filters, which all apply immediately.

### Recommended design

**Collapse to a single filter strip.** All filter controls should live in one horizontal strip that wraps gracefully if needed.

**Layout (left to right):**
```
[Search input — flex-grow] [All/Live/Imported toggle] [Flagged checkbox] [Date: input → input] [Miles: input – input] [Clear all ×]
```

**Key changes:**

**1a. Remove the Apply button. Apply on blur or Enter.**
Date and miles inputs currently use a pending/applied state pattern that requires a deliberate Apply press. This is the right architecture, but the Apply button itself shouldn't be visible as a separate button. Instead:
- Apply the filter `onBlur` of any date or miles input, and on `Enter` key
- This mirrors how most admin filter UIs behave and removes one button from the UI entirely
- Keep the pending/applied state in code — just trigger the commit automatically

**1b. Remove the separate "Clear date/miles" button.**
The "Clear filters" button already clears everything. The secondary "Clear date/miles" button is redundant UI. Remove it. If the user wants to clear only date/miles, they can clear the individual inputs. The global "Clear filters" handles the rest.

**1c. Move "Clear filters" inline, not below.**
Currently it renders as a separate row below the second filter row. Instead, render it as an `×` button (icon only, no label) at the right end of the filter strip. Only show it when `hasActiveFilters` is true.

Exact styling:
```
button: h-8 w-8, flex items-center justify-center, rounded
icon: × at 16px, color #6b7280
hover: color #e5e7eb
tooltip: aria-label="Clear all filters"
```

**1d. Compact the date and miles inputs.**
Current date inputs have no label prefix styled into the input — the label is a separate `<span>`. This produces inconsistent visual sizing because the `<span>` breaks the row alignment.

Use `placeholder` instead of external labels:
- Date from: `placeholder="From"`, date to: `placeholder="To"`
- Miles min: `placeholder="min mi"`, miles max: `placeholder="max mi"`

Drop the dash separator between date inputs. Juxtaposition is sufficient. The `→` arrow is visually lighter than `–` if a separator is truly needed.

**1e. Consistent input height across the entire strip.**
All inputs and the toggle should be `h-8` (32px). The current search input uses `py-2` which makes it taller than the rest. Normalize everything to `h-8 px-3 text-[13px]`.

**1f. Date inputs: constrain width.**
Date inputs currently expand to fill available space unpredictably across browsers. Set explicit widths:
- Date from/to: `w-[130px]` each (enough for `MM/DD/YYYY` with some padding)
- Miles min/max: `w-[72px]` each (current `w-20` is fine, keep it)

**Summary of row 2 to eliminate:** the entire second `<div className="mt-3 flex flex-wrap items-end gap-3">` block gets dissolved. Its contents migrate into the first row.

---

## 2. Sort Header Indicators

### Current behavior
Active sort column header text turns from `#6b7280` to `#e5e7eb`. A Unicode character appended inline: `↕` when not sorted, `↓` when desc, `↑` when asc.

### Problem
Unicode arrows at 12px in a monospace-adjacent font are indistinct. `↕` specifically reads as "both" which is technically correct but visually ambiguous — does it mean sortable? Currently sorted in both directions? Not sorted? Users will not parse this correctly.

The hover state is also absent — there is no visual cue that the header is interactive until you've already clicked it.

### Recommended design

**2a. Replace Unicode arrows with a small SVG chevron icon.**

Use a 10×10 (or `w-2.5 h-2.5`) SVG indicator, not Unicode. The icon should be:
- When column is not the active sort: two stacked thin chevrons (up and down), `color: #3f3f3f` (very muted, nearly invisible — present but subordinate)
- When column is active sort, ascending: single chevron up, `color: #f97316`
- When column is active sort, descending: single chevron down, `color: #f97316`

Alternatively, if SVG icons are not worth adding for this scope: use a single `↑` for asc and `↓` for desc. For the inactive/unsorted state use nothing — no indicator. The cursor change and hover state alone convey interactivity.

**2b. Add a hover background on sortable headers.**
Currently there is no hover state at all. Add:
```
cursor-pointer select-none
hover: background #141414 (barely visible lift)
transition-colors duration-100
```
The background should cover the full `<th>` cell, not just the text. This makes the entire header feel like a button.

**2c. Visually distinguish the active sort column header.**
Current change is text color `#6b7280` → `#e5e7eb`. That's fine but subtle. Add one more signal:
- Active sort column header text: `color: #e5e7eb, font-weight: 600`
- Inactive sortable header: `color: #6b7280, font-weight: 500`

No background change needed for active — the chevron color change + text weight is sufficient.

**2d. Tooltip on hover.**
Add `title` attributes so hovering the Date header shows "Sort by date" and Miles shows "Sort by miles". This costs nothing and removes all ambiguity.

---

## 3. Pagination Bar

### Current behavior
One row with: "Showing X–Y of Z" (left), then "← First / ← Prev / Page [input] of N / Next → / Last →" (center), then "Per page: [select]" (right).

### Problem
**Too many navigation controls at equal visual weight.** "First" and "Last" are rarely used. Having them at the same weight as "Prev" and "Next" creates a five-button row of indistinguishable targets. The text labels "← First" and "← Prev" are redundant — the arrow already implies direction.

**The per-page selector is orphaned** on the right when pagination shows. It has no visual relationship to the other controls and breaks the layout on narrow viewports.

**"← First" duplicates the arrow direction as "← Prev".** Two left-pointing arrows next to each other creates visual noise — the user has to read the labels to differentiate them.

### Recommended design

**3a. Restructure into two zones: left (count + per-page), right (navigation).**

Left side:
```
"1–50 of 2,847"  |  Per page: [select]
```
Both the count label and per-page selector belong together — they both describe what's visible. Grouping them removes the orphaned feel.

Right side:
```
[First]  [‹ Prev]  Page [input] of N  [Next ›]  [Last]
```

**3b. Demote First and Last.**
"First" and "Last" are utility controls, not primary navigation. Make them smaller and muted:
- First / Last: `text-[12px] color: #4b5563` (muted), no arrow prefix — just the word
- Prev / Next: `text-[13px] color: #e5e7eb` when enabled, with `‹` and `›` instead of `←` and `→`
- Disabled state for all: `color: #2a2a2a, cursor-not-allowed` (same as current)
- Hover on enabled Prev/Next: `color: #f97316` (same as current — keep this, it's good)
- Hover on enabled First/Last: `color: #9ca3af` (lighter, not orange — these are secondary controls)

This creates a two-tier navigation hierarchy: First/Last recede, Prev/Next are primary.

**3c. Tighten the page jump input.**
Current: `w-10` centered input showing current page, editable. This is slightly ambiguous — the input looks like a display, not an editable field, especially when it shows the current page number.

Improvements:
- Give it a `ring-1 ring-[#2a2a2a]` outline so it reads as an input, not static text
- On focus: `ring-[#f97316]` — matches the search input focus behavior
- Keep `w-10` width (40px) — this is correct for 1–4 digit numbers
- Use `placeholder` as the page number when the user is mid-edit, not `value={pageJump || String(page)}` — this pattern is already in the code and is correct, but the visual feedback is the gap

**3d. Reduce vertical padding.**
Current pagination wrapper: `py-4`. This creates unnecessary vertical height for a utility bar. Use `py-3`.

**3e. Per-page selector: remove the label, use a small chevron icon or just the number.**
"Per page:" as a text label takes 60px for a label nobody reads after the first time. Options:
- Remove the label entirely — the select value of "10 / 25 / 50 / 100" is self-evident in context
- Or shorten the label to just "Show:" at `text-[12px] color: #6b7280`

Recommended: keep a short label but de-emphasize it: `text-[12px] color: #4b5563` (one step more muted than secondary).

---

## 4. Global Cohesion Notes

These are small fixes that apply across the page, not just the three problem areas.

**4a. Input focus state: apply consistently to all inputs on the page.**
Currently only the search input has an orange focus border (`onFocus` → `borderColor: #f97316`). The filter date/miles inputs use `outline-none` with no focus state at all. Add the same `onFocus/onBlur` orange border pattern to every input on the page. This is a 4-line addition per input and is currently absent from:
- Date from/to inputs
- Miles min/max inputs
- Page jump input (partially handled — add orange ring on focus)

**4b. The "Clear date/miles" button uses `uppercase tracking-wide` at 12px.**
This is a different visual style than the "Clear filters" button, which uses sentence case at 13px. Standardize: all clear/cancel text actions should be `text-[13px] color: #6b7280`, sentence case, no uppercase tracking. Uppercase tracking on very small utility text degrades readability at this size.

**4c. The Apply button's visual style is inconsistent with other primary actions.**
`background: #1f1f1f, color: #f97316, border: #2a2a2a` — this is a ghost/outline variant that doesn't exist anywhere else in the design. The save button uses solid orange. The segment control uses a slightly-lifted background. Apply looks like neither. If Apply is kept (it shouldn't be, per recommendation 1a above), it should match the save button style: solid `#f97316` background, white text.

**4d. The `hasActiveFilters` Clear button alignment.**
Currently `justify-end` in its own row. This creates a "floating" button that appears in an unexpected position below the filter rows. Moving it inline (per recommendation 1c) eliminates this awkwardness entirely.

---

## Implementation Priority

| Priority | Change | Effort |
|----------|--------|--------|
| 1 | Collapse filter bar to one row, move Clear inline as × button | Medium — requires JSX restructure |
| 2 | Remove Apply button, apply date/miles filter onBlur/Enter | Small — remove button, add onBlur/onKeyDown handlers |
| 3 | Remove "Clear date/miles" button (redundant) | Trivial — delete |
| 4 | Add hover background on sortable table headers | Trivial — add className |
| 5 | Replace sort arrows: remove ↕, use ↑/↓ only on active col | Trivial — one ternary change |
| 6 | Demote First/Last pagination buttons visually | Small — color + size class changes |
| 7 | Regroup per-page selector with count label (left side) | Small — JSX move |
| 8 | Add orange focus ring to all inputs | Small — 4 lines per input |
| 9 | Normalize input height to h-8 across filter bar | Trivial — remove py-2 from search input |
| 10 | Standardize clear/cancel text style across page | Trivial — remove uppercase tracking |

---

## What Not to Change

- The row hover state (`#171717` background) — good, keep it
- The edit row pattern (dimmed original row + full-width edit panel below) — well designed, no changes
- The SourceBadge and FlagIcon components — correct weight and color
- The skeleton shimmer — correct
- The delete confirmation inline in the actions cell — correct pattern
- The sticky table header — keep `sticky top-[52px]`
- The orange flash after save (`rgba(249,115,22,0.10)`) — keep, it's a good save confirmation
