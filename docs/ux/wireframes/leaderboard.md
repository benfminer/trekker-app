# Wireframe: Public Leaderboard (/)
> Artifact type: Wireframe + Interaction Spec
> Last updated: 2026-03-19

---

## Screen: Public Leaderboard
**Purpose:** Show the TRACE community where they are in their global circumnavigation — total miles, progress toward the 20,286-mile goal, reached milestones, and recent contributions. Make the collective effort feel real and worth returning to.
**Entry from:** Direct URL, shared link, or redirect from log entry success state ("See where we are")

This screen is the emotional centerpiece of the app. Design mode: bold, alive, expedition-like. The map is the hero. The numbers are secondary context. Everything supports the felt sense of forward motion.

---

## Layout — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TRACE TREKKERS                                          [LOG ACTIVITY →]    │
│  ────────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │                                                                          ││
│  │                         [ MAPBOX MAP ]                                   ││
│  │                                                                          ││
│  │   ●══════════════════════════◉                                           ││
│  │   San Diego         current pos ↑                                        ││
│  │   (origin)        pulsing orange ring                                    ││
│  │                                                                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│  Map height: 65vh min. Full-width. bg: #0a0a0a while tiles load.            │
│                                                                              │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│  │  14,203              │ │  70%                 │ │  Athens              │ │
│  │  miles logged        │ │  of the goal         │ │  412 miles away      │ │
│  │                      │ │  ████████████░░░░░░  │ │                      │ │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ │
│  Stats row: 3 equal columns, 16px gap. No cards — fields sit on page bg.    │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  MILESTONES                                                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  ✓  Pacific Ocean        Jan 12      2,312 mi from start                 ││
│  │  ✓  Tokyo, Japan         Feb 03      3,847 mi from start                 ││
│  │  ✓  India (Mumbai)       Mar 01      5,921 mi from start                 ││
│  │  ◎  Athens, Greece       —           14,615 mi from start  · 412 mi away ││
│  │  ○  Rome, Italy          —           15,204 mi from start  · 1,001 mi... ││
│  │  ○  Paris, France        —           15,890 mi from start  · 1,687 mi... ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│  Milestone list. Scrollable. Reached: checkmark + date. Next: ◎ highlight.  │
│  Future: gray circle.                                                        │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  RECENT ACTIVITY                                                             │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Ms. Rivera's Class     Mar 18    +4.2 miles                             ││
│  │  David M.               Mar 18    +1.8 miles                             ││
│  │  PE Period 3            Mar 17    +12.0 miles                            ││
│  │  Coach Andrews          Mar 17    +3.0 miles                             ││
│  │  TRACE Staff            Mar 16    +6.5 miles                             ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│  Last 5 submissions. Miles figure in orange.                                 │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                          LOG YOUR ACTIVITY                               ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│  Bottom CTA. Full-width. bg: #f97316. height: 60px. Oswald 700, 18px.        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Mobile

```
┌────────────────────────────┐
│  TRACE TREKKERS      [Log] │  ← Header. Height: 48px. bg: #0a0a0a.
│  ──────────────────────    │     [Log] = text link or icon. Routes to /log.
│                            │
│  ┌────────────────────────┐│
│  │                        ││
│  │       [ MAP ]          ││  ← Map. Full-width. Height: 55vw min, 300px min.
│  │                        ││     Dark tiles. Orange traveled route.
│  │                        ││     Pulsing current position marker.
│  └────────────────────────┘│
│                            │
│  14,203 miles              │  ← Oswald 700, 36px, white. Primary stat.
│  70% of the goal           │  ← Inter 400, 14px, #9ca3af
│  ████████████░░░░          │  ← Progress bar. Full-width. 6px height.
│                            │
│  Next: Athens              │  ← Oswald 700, 16px, white
│  412 miles away            │  ← Inter 400, 13px, #f97316
│                            │
│  ──────────────────────    │
│                            │
│  MILESTONES                │  ← Section label. Oswald 700, 12px, #6b7280. Uppercase.
│  ✓ Pacific Ocean  Jan 12   │  ← Reached. Icon: checkmark circle, #4ade80.
│  ✓ Tokyo          Feb 03   │     Date right-aligned.
│  ✓ Mumbai         Mar 01   │
│  ◎ Athens    412 mi away   │  ← Next milestone. Orange ring icon. Distance right-aligned.
│  ○ Rome     1,001 mi away  │  ← Future. Gray circle. Muted text.
│                            │
│  ──────────────────────    │
│                            │
│  RECENT ACTIVITY           │  ← Section label.
│  Ms. Rivera's   +4.2 mi    │  ← 3 rows max on mobile.
│  David M.       +1.8 mi    │     Name truncated at 18 chars.
│  PE Period 3    +12 mi     │     Miles in orange.
│                            │
│  ┌────────────────────────┐│
│  │     LOG ACTIVITY       ││  ← Fixed bottom button. Full-width. Height: 52px.
│  └────────────────────────┘│     bg: #f97316. Clears above content when scrolled to bottom.
└────────────────────────────┘
```

---

## Components

### Page Header
- **Left:** "TRACE TREKKERS" wordmark. Oswald 700, 20px (desktop) / 18px (mobile), white.
- **Right desktop:** "LOG ACTIVITY →" button. bg #f97316, Oswald 700, 14px uppercase, height 36px, border-radius 4px, horizontal padding 16px.
- **Right mobile:** "Log" text link, Inter 400, 14px, #f97316. Routes to /log.
- **Behavior:** Sticky on scroll. bg #0a0a0a with no blur or glassmorphism. 1px solid #1f1f1f border-bottom.
- **Height:** 56px desktop / 48px mobile.

### Mapbox Map
- Full-width, no horizontal margin.
- **Height:** 65vh on desktop (min 500px), 55vw on mobile (min 300px, max 380px).
- **Style:** `mapbox://styles/mapbox/dark-v11`. Custom adjustments: reduce label density, darken land color to keep the orange route visually dominant.
- **Initial camera:** Center on current position coordinates. Zoom: 4 (regional). Bearing: 0. Pitch: 0 (flat, no 3D).
- **Camera animation on load:** `map.flyTo()` — duration 1200ms, easing ease-in-out. Fires once on mount.

### Route Polylines
Two GeoJSON line layers drawn on the map:

**Traveled segment (San Diego → current position):**
- Color: #f97316 (orange)
- Stroke width: 3px
- Line cap: round
- Z-order: above the remaining route layer

**Remaining segment (current position → San Diego end):**
- Color: #374151 (muted dark gray)
- Stroke width: 2px
- Opacity: 0.6
- Line dash: [4, 3] (optional — adds a subtle dotted quality to the unfinished route)

### Current Position Marker
A custom HTML marker placed at the current position coordinates.

**Visual:**
- Inner dot: 12px × 12px, bg #f97316, border 2px solid #ffffff, border-radius 50%
- Outer pulse ring: 24px × 24px, border 2px solid #f97316, border-radius 50%, centered on the inner dot
- Pulse animation: `@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }` — duration 2000ms, infinite, ease-out

**On click/tap:**
- Mapbox popup appears above the marker
- Content: "[Location name] · [X,XXX] miles into the journey"
- Popup style: bg #111111, border 1px solid #2a2a2a, border-radius 6px, Inter 400, 13px, white text. No Mapbox default arrow (hide with CSS or use offset positioning).

### Milestone Markers (reached milestones only)
- Rendered on the map at the coordinates of each triggered milestone.
- Visual: white circle, 8px diameter, 1.5px white border on dark bg
- On hover/tap: scale to 12px + show Mapbox popup with milestone name and mile marker
- Only reached milestones are shown on the map — no future milestone markers

### Stats Row

**Three blocks — equal width columns (desktop), stacked (mobile):**

**Block 1 — Miles Logged**
- Number: Oswald 700, 40px (desktop) / 36px (mobile), white
- Label: Inter 400, 13px (desktop) / 12px (mobile), #9ca3af, "miles logged"
- Number format: thousands separator — "14,203"

**Block 2 — Progress Toward Goal**
- Number: Oswald 700, 40px / 36px, white
- Label: Inter 400, 13px / 12px, #9ca3af, "of our goal"
- Format: integer percentage — "70%" (round down, never show 100% until actually complete)
- Progress bar: directly below the label. Full width of the block. Height 4px (desktop) / 6px (mobile). Track: #1f1f1f. Fill: #f97316. No animation — static snapshot.

**Block 3 — Next Milestone**
- Milestone name: Oswald 700, 22px / 18px, white
- Distance: Inter 400, 14px / 13px, #f97316, "[X] miles away"
- If goal is complete: replace with "We made it!" in Oswald 700, #f97316 — trigger a confetti moment (see below)

**Layout:**
- Desktop: three equal-width columns, 16px gap, no card borders — fields sit directly on page bg. 32px vertical padding.
- Mobile: stacked, 24px gap between blocks. Full-width. 24px vertical padding.

### Progress Bar (standalone — mobile)
On mobile, a full-width progress bar appears directly below the main miles/percentage display, spanning the full content width (not just one column). Height: 6px. Track: #1f1f1f. Fill: #f97316.

### Milestones List

**Desktop:** Full-width section below the stats row. Max 20 visible before a "Show all" option is needed (post-v1).
**Mobile:** Same section, scrollable.

**Section heading:** "MILESTONES" — Oswald 700, 12px, uppercase, letter-spacing 0.08em, #6b7280.

**Per row:**

```
[icon]  [Name]                  [Date or distance]     [miles from start]
```

- Row height: 44px (desktop) / 40px (mobile)
- Row divider: 1px solid #1a1a1a
- No row background (transparent — sits on page bg)

**Reached milestone:**
- Icon: filled checkmark circle, 16px, #4ade80 (green — confirms completion without orange competition)
- Name: Inter 500, 14px, #e5e7eb
- Date: Inter 400, 13px, #6b7280, right-aligned
- Miles from start: Inter 400, 12px, #4b5563, right-aligned in a secondary column

**Next milestone (the current target):**
- Icon: outlined circle with orange ring, 16px, #f97316
- Row has a subtle left border accent: 3px solid #f97316, left side
- Name: Inter 600, 14px, white
- Distance remaining: Inter 500, 13px, #f97316, right-aligned
- Miles from start: Inter 400, 12px, #6b7280, right-aligned

**Future milestone:**
- Icon: outlined circle, 16px, #374151 (muted gray)
- Name: Inter 400, 14px, #6b7280
- Distance remaining: Inter 400, 13px, #4b5563, right-aligned
- Miles from start: Inter 400, 12px, #374151, right-aligned

### Recent Activity Feed
**Section heading:** "RECENT ACTIVITY" — Oswald 700, 12px, uppercase, letter-spacing 0.08em, #6b7280.

**Per row:**
- Name/class: Inter 400, 14px (desktop) / 13px (mobile), #d1d5db. Truncate at 24 chars (desktop) / 18 chars (mobile) with ellipsis.
- Date: Inter 400, 13px, #6b7280. Short format: "Mar 18".
- Miles: Inter 500, 14px (desktop) / 13px (mobile), #f97316. Prefixed "+": "+4.2 miles" (desktop), "+4.2 mi" (mobile).
- Row height: 40px (desktop) / 36px (mobile)
- Dividers: 1px #1a1a1a between rows
- Show 5 rows on desktop, 3 rows on mobile

**Empty state:** "No activity yet. Be the first to log miles." — Inter 400, 14px, #6b7280. Centered.

**Loading state:** Skeleton rows. bg #1a1a1a. Animated shimmer: background-position sweep, 1.5s linear infinite. Width: name skeleton 55%, date skeleton 15%, miles skeleton 15%.

### Log Activity CTA (bottom)
- **Desktop:** Full-width button below the recent activity feed. bg #f97316. Height: 60px. Oswald 700, 18px uppercase, white. Routes to /log.
- **Mobile:** Fixed to the bottom of the viewport. Full-width. Height: 52px. Same styles. Has safe area padding for iOS home bar: `padding-bottom: env(safe-area-inset-bottom)`. Does not overlap the milestone list — the page content has 52px + 16px bottom padding to compensate.

### Milestone Celebration Overlay
Triggered when the stats API returns a newly triggered milestone.

```
┌────────────────────────────────────────────────┐
│                                                │
│  MILESTONE                                     │  ← Oswald 700, 12px, #f97316, uppercase.
│                                                │     Letter-spacing: 0.1em.
│  The Suns just entered                         │  ← Oswald 700, 32px (desktop) / 28px (mobile), white.
│  Greece!                                       │
│                                                │
│  Athens is 412 miles ahead.                    │  ← Inter 400, 16px, #9ca3af.
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │              KEEP TREKKING               │  │  ← Dismiss button. Full-width. bg #f97316.
│  └──────────────────────────────────────────┘  │     Oswald 700, 16px uppercase, white. Height: 48px.
│                                                │
└────────────────────────────────────────────────┘
```

- **Backdrop:** Fixed, full-screen. bg rgba(0,0,0,0.85). z-index above map and all content.
- **Card:** Centered horizontally and vertically. max-width 400px. Width: 90vw on mobile. bg #111111. border 1px solid #2a2a2a. border-radius 8px. padding: 32px.
- **Entrance animation:** Card starts at `transform: scale(0.92)` and `opacity: 0`, transitions to `scale(1.0)` and `opacity: 1`. Duration: 280ms. Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — a slight overshoot spring feel.
- **Auto-dismiss:** After 8 seconds if user does not tap the button.
- **Dismiss animation:** Backdrop fades to opacity 0 over 200ms. Card fades simultaneously.
- **Session deduplication:** Each milestone ID is tracked in sessionStorage as `seen_milestone_[id]`. Do not show the same milestone twice in one session.
- **Multiple milestones:** Queue them. Show one, wait for dismiss (or auto-dismiss), then show the next.

---

## Actions

- **Primary:** "LOG ACTIVITY" — fixed bottom mobile, header on desktop. Routes to /log.
- **Map interaction:** Pan, zoom, tap markers for tooltips. Default Mapbox controls on desktop. Hidden zoom controls on mobile (pinch-to-zoom only).
- **Milestone celebration:** Dismiss button.
- **Stats retry:** Text link visible on error state.

---

## States

### Loading — Initial page load

**Stats panel:**
- Show skeleton blocks in each of the three stat columns. Rounded rectangles, bg #1a1a1a, shimmer animation.
- Number skeleton: 120px × 36px. Label skeleton: 80px × 14px. Both in their respective column positions.

**Map:**
- Container is visible immediately at its full height. bg #0a0a0a (matches page). Tiles stream in as Mapbox loads — no spinner overlay on the map.

**Milestone list:**
- Show 4 skeleton rows while the API loads. Same shimmer style.

**Recent activity:**
- Show 5 (desktop) / 3 (mobile) skeleton rows.

### Error — Stats API failure
- Stats blocks show "--" in place of numbers. Labels remain.
- Below the stats row: Inter 400, 13px, #6b7280 — "Could not load progress · [Retry]". "Retry" is #f97316.
- Map still renders. Without coordinates from the API, center the map on San Diego (33.4734, -117.1546) at zoom 3.

### Goal Complete
Replace the "Next Milestone" stat block with:
- "We made it!" — Oswald 700, 24px, #f97316
- "20,286 miles together." — Inter 400, 14px, #9ca3af
- Trigger a one-time confetti animation on the screen (CSS confetti burst, 3–5 second duration, then stops). Only fires once per session.

---

## Auto-Refresh

Stats and recent activity poll every 60 seconds via `setInterval`. The map does not re-render on each poll — only the stats panel and recent activity list update. If new miles pushed the group past a milestone since the last poll, the celebration overlay fires.

Implementation note: store the last-seen list of triggered milestone IDs in component state. On each poll, compare the returned triggered milestones against the stored list — if a new ID appears, queue the celebration overlay.

---

## Responsive Behavior Summary

| Breakpoint | Map height | Stats layout | Milestones | Activity rows | Log CTA |
|------------|-----------|--------------|------------|---------------|---------|
| Mobile < 640px | 55vw (min 300px) | Stacked, full-width | Same, compact text | 3 | Fixed bottom |
| Tablet 640–1024px | 60vh | 3-column row | Same | 5 | Header button |
| Desktop > 1024px | 65vh (min 500px) | 3-column row | Same | 5 | Header button + bottom CTA |

---

## Typography

| Element | Font | Weight | Size (desktop) | Size (mobile) | Color |
|---------|------|--------|----------------|---------------|-------|
| Wordmark | Oswald | 700 | 20px | 18px | #ffffff |
| Stats number | Oswald | 700 | 40px | 36px | #ffffff |
| Stats label | Inter | 400 | 13px | 12px | #9ca3af |
| Next milestone name | Oswald | 700 | 22px | 18px | #ffffff |
| Next milestone distance | Inter | 400 | 14px | 13px | #f97316 |
| Section headings | Oswald | 700 | 12px (uppercase) | 12px (uppercase) | #6b7280 |
| Milestone — reached name | Inter | 500 | 14px | 14px | #e5e7eb |
| Milestone — next name | Inter | 600 | 14px | 14px | #ffffff |
| Milestone — future name | Inter | 400 | 14px | 14px | #6b7280 |
| Activity row — name | Inter | 400 | 14px | 13px | #d1d5db |
| Activity row — miles | Inter | 500 | 14px | 13px | #f97316 |
| Milestone celebration heading | Oswald | 700 | 32px | 28px | #ffffff |
| Celebration subtext | Inter | 400 | 16px | 15px | #9ca3af |
| Log Activity CTA | Oswald | 700 | 18px (uppercase) | 16px (uppercase) | #ffffff |

---

## Color Reference

| Token | Value | Use |
|-------|-------|-----|
| Background | #0a0a0a | Page background, map loading bg |
| Surface | #111111 | Celebration card bg |
| Border | #1f1f1f | Row dividers |
| Border subtle | #1a1a1a | Milestone rows |
| Border card | #2a2a2a | Celebration card border |
| Primary | #f97316 | CTA, traveled route, milestone icons, activity miles |
| Progress track | #1f1f1f | Progress bar background |
| Text primary | #ffffff | Stats numbers, milestone next name |
| Text secondary | #e5e7eb | Milestone reached name |
| Text muted | #9ca3af | Stats labels, subtext |
| Text disabled | #6b7280 | Future milestones, section headings |
| Text inactive | #4b5563 | Milestone future icon, miles-from-start |
| Route remaining | #374151 | Remaining route polyline |
| Milestone reached icon | #4ade80 | Checkmark circle on reached milestones |
| Milestone next border | #f97316 | Left accent border on next milestone row |

---

## Open Questions

1. What is the exact API response shape for milestones? Does the stats endpoint return `triggered_milestones[]` and `upcoming_milestones[]` as separate arrays, or a single `milestones[]` array with a `triggered` boolean? The leaderboard list assumes a single array with a `triggered` flag and an `is_next` flag for the current target. Confirm with api-builder.
2. Does the stats API return `recently_triggered_milestone` (most recently crossed) for the celebration overlay, or does the frontend determine this by comparing against last-seen state? Recommend: API returns a `newly_triggered` boolean per milestone, and the frontend compares against sessionStorage to decide whether to show the overlay.
3. How many milestones are in the full dataset? If there are 50+, the milestone list needs a "Show all" / pagination affordance. Confirm count with db-architect.
4. Should the full milestone list be visible (all future milestones), or only reached + next? Current spec shows all. Consider: showing future milestones creates an anticipatory pull — good for engagement. Leaning toward showing all.
