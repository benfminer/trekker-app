# UX Spec: Map Page (/ — Home)
> Artifact type: User Flow + Wireframe + Interaction Spec
> Last updated: 2026-03-19

---

## Overview

The map page is the emotional heart of the app. It is the screen people return to check on the group's progress, share with others, and feel the collective momentum. The map is not a utility widget — it is the primary content. Everything else is supporting context for it.

Design mode: bold, alive, expedition-like. This screen should feel like something worth showing someone.

---

## User Flow

**User:** Any community member — student, teacher, staff, parent, visitor
**Goal:** See where the TRACE Suns are on their journey around the world; feel the scale and momentum of the collective effort
**Entry point:** Direct link, app home URL, or redirect from the log entry success state

### Steps

1. **Page loads**
   - Happy path: Map renders with the full route polyline and current position marker. Stats panel shows total miles and progress. Page title and progress are immediately readable.
   - Edge case: Map tiles slow to load — show a dark placeholder background with the stats panel visible; map appears as tiles load without blocking the UI
   - Edge case: API stats fail to load — show "--" in the stats panel with a subtle retry icon; map still renders with whatever last known position is available (or at San Diego if truly no data)

2. **User reads progress context**
   - They see: total miles logged, percentage of goal, miles to next milestone, next milestone name
   - No action required — this is ambient, not interactive

3. **User sees the animated polyline**
   - The route from San Diego is drawn on the map. The traveled portion (up to current position) is highlighted in orange (#f97316). The remaining route is shown in a subdued color (#333333 or white at 20% opacity).
   - An animated "pulse" or "ping" effect on the current position marker conveys live status
   - The map auto-centers on the current position on load with a zoom level that shows meaningful geographic context (~regional level, not country-level)

4. **User may interact with the map**
   - Pan and zoom are enabled — default Mapbox controls
   - Tapping/clicking the current position marker shows a small tooltip: "[City / Region], [Country] — [total miles] miles logged"
   - Tapping a milestone marker (if visible in current viewport) shows its name and distance from start
   - No other required map interactions

5. **User reads recent activity feed**
   - Below (or beside) the map: a short list of the most recent approved submissions
   - Shows: name/class, date, miles added
   - Does not require action. Confirms the community is active.

6. **User taps "Log Activity"**
   - CTA is persistently visible (fixed button or prominent section)
   - Routes to /log

**Exit point:** User has seen current progress and community activity. They may tap through to log their own miles, or simply close the page.
**Emotional arc:** Arrives curious, leaves with a felt sense of collective momentum and scale. The map should make the journey feel real — not abstract numbers on a dashboard.

---

## Wireframe — Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  TRACE TREKKERS                              [LOG ACTIVITY →]    │  ← Header. bg: #0a0a0a.
│  ────────────────────────────────────────────────────────────    │     Sticky. Height: 56px.
│                                                                  │     CTA button: #f97316, Oswald 700.
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                                                            │ │
│  │              [ MAPBOX MAP — FULL WIDTH ]                   │ │  ← Map region: full-width, 60vh min height.
│  │                                                            │ │     Dark Mapbox style (custom or "mapbox-dark").
│  │           ●══════════════════════════════◉                 │ │     ● = San Diego origin
│  │                        [current pos marker]                │ │     ◉ = current position, pulsing orange ring
│  │                                                            │ │     ══ = traveled route, #f97316 stroke 3px
│  │                                                            │ │     ── = remaining route, #333 stroke 2px
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────┐ │
│  │  14,203           │ │  70%              │ │  Next: Athens   │ │  ← Stats row: three panels.
│  │  miles logged     │ │  of the goal      │ │  412 miles away │ │     Oswald 700 for the number.
│  └──────────────────┘ └──────────────────┘ └─────────────────┘ │     Inter 400 for the label.
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  RECENT ACTIVITY                                                 │  ← Section heading. Oswald 700, 14px,
│                                                                  │     letter-spacing: 0.08em. uppercase.
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Ms. Rivera's Class    ·  Mar 18  ·  +4.2 miles            │ │  ← Activity row. Inter 400, 14px.
│  │  David M.              ·  Mar 18  ·  +1.8 miles            │ │     Show last 5 approved submissions.
│  │  PE Period 3           ·  Mar 17  ·  +12.0 miles           │ │     Miles in orange (#f97316).
│  │  Coach Andrews         ·  Mar 17  ·  +3.0 miles            │ │
│  │  TRACE Staff           ·  Mar 16  ·  +6.5 miles            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   LOG YOUR ACTIVITY                        │ │  ← Bottom CTA. Full width. #f97316 bg.
│  └────────────────────────────────────────────────────────────┘ │     Oswald 700, uppercase, 18px. height: 60px.
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Wireframe — Mobile Layout

On mobile, the layout stacks vertically. The map takes the most screen real estate.

```
┌────────────────────────┐
│ TRACE TREKKERS    [✎]  │  ← Header. Compact. [✎] = log icon or "Log" text link.
│ ───────────────────    │     Height: 48px.
│                        │
│ ┌──────────────────┐   │
│ │                  │   │
│ │   [ MAP ]        │   │  ← Map: 55vw height minimum. Full width.
│ │                  │   │     Current position pulsing marker visible.
│ └──────────────────┘   │
│                        │
│ 14,203 miles           │  ← Stat: large Oswald 700, 32px, white.
│ 70% of the goal        │     Subtext: Inter 400, 14px, #9ca3af.
│                        │
│ Next milestone:        │  ← Milestone callout. Oswald 700, 14px, orange.
│ Athens — 412 mi away   │     Compact single line.
│                        │
│ ─────────────────────  │
│                        │
│ RECENT ACTIVITY        │  ← Section label. Uppercase, 12px, gray.
│ Ms. Rivera's · +4.2mi  │     Compact rows. Name truncated at ~20 chars.
│ David M.     · +1.8mi  │     Show last 3 on mobile (not 5).
│ PE Period 3  · +12mi   │
│                        │
│ ┌──────────────────┐   │
│ │  LOG ACTIVITY    │   │  ← Sticky bottom CTA. Fixed to bottom of viewport.
│ └──────────────────┘   │     Height: 52px. Full width. #f97316.
└────────────────────────┘
```

---

## Component Inventory

| Component | Type | Notes |
|-----------|------|-------|
| Page header | Layout | Wordmark left, "Log Activity" button right. Sticky. bg: #0a0a0a. |
| Mapbox map | Core | Full-width, dark style. Animated polyline route. Pulsing current position marker. Pan/zoom enabled. |
| Route polyline — traveled | Map layer | Color: #f97316. Stroke width: 3px. From San Diego to current position. |
| Route polyline — remaining | Map layer | Color: #374151 (muted dark gray). Stroke width: 2px. From current position to end. |
| Current position marker | Map marker | Orange filled circle, white border. Animated outer ring (CSS keyframe or Mapbox custom layer): pulse every 2s. |
| Milestone markers | Map markers | Small circle markers at each reached milestone. On hover/tap: tooltip with milestone name and mile marker. |
| Stats panel | Data display | Three stat blocks: miles logged, % complete, next milestone. Oswald for numbers, Inter for labels. |
| Progress bar | Visual | Optional horizontal bar below the stats showing % complete. Height: 4px. #f97316 fill on #1a1a1a track. |
| Recent activity feed | List | Last 5 (desktop) or 3 (mobile) approved submissions. Name, date, miles delta. |
| Log Activity CTA | Button | Primary button, #f97316. Full-width on mobile (fixed bottom). Header button on desktop. |
| Milestone celebration overlay | Modal/overlay | Triggered when a new milestone is crossed. See Milestone Celebration spec below. |

---

## Map Interaction Specs

### Map Style
- Use Mapbox dark style: `mapbox://styles/mapbox/dark-v11` as the base, or a custom style if one is created
- The dark base maximizes the visual contrast of the orange route
- Disable labels or reduce label density to keep the map clean — the route, not geography names, is the focus

### Initial View on Load
- **Center:** Current position coordinates (fetched from stats API)
- **Zoom level:** 4 (shows regional context — enough to see where in the world they are)
- **Bearing:** 0 (north up)
- **Pitch:** 0 (2D flat — per project decision, no 3D globe at launch)
- Animate camera to center on load using `map.flyTo()` with duration 1200ms, easing: `ease-in-out`

### Route Rendering
- Full route from San Diego to San Diego (great circle path, stored as GeoJSON LineString in the API)
- Split into two segments at current position:
  - Traveled: styled as orange (#f97316), 3px stroke, rendered above the remaining segment
  - Remaining: styled as dark gray (#374151), 2px stroke, dashed optional
- Use `map.addLayer` with GeoJSON source; update `traveled_miles` from stats endpoint on load

### Current Position Marker
- Custom HTML marker or Mapbox symbol layer
- Outer ring: animated pulse using CSS `@keyframes`. Scale from 1x to 1.8x, opacity 1 to 0, repeat every 2000ms.
- Inner dot: 12px diameter, #f97316 fill, 2px white border
- On click/tap: popup with text — "[Location name] · [X,XXX] miles into the journey"

### Milestone Markers
- Rendered as small circle markers at coordinates of each triggered milestone
- Color: white, 8px diameter. On hover: scale to 12px, show label.
- Only render triggered milestones — no future milestone markers (don't show where they're going, only where they've been)

### Zoom Controls
- Default Mapbox zoom controls (+ / -), positioned bottom-right on desktop
- On mobile: disable visible zoom controls (pinch-to-zoom still works)

---

## Milestone Celebration Overlay

Triggered when the stats API returns a newly triggered milestone (flag in API response).

```
┌──────────────────────────────────────┐
│                                      │
│           ⊙  MILESTONE               │  ← "MILESTONE" label. Oswald 700, 12px, #f97316. Uppercase.
│                                      │
│     The Suns just entered            │  ← Oswald 700, 32px, white.
│     Greece!                          │
│                                      │
│     Athens is 412 miles ahead.       │  ← Inter 400, 16px, #9ca3af.
│                                      │
│  ┌──────────────────────────────┐   │
│  │         KEEP TREKKING        │   │  ← Dismiss button. #f97316. Oswald 700.
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

- Full-screen overlay with dark semi-transparent backdrop: rgba(0,0,0,0.85)
- Content card centered, max-width 400px, bg: #111111, border: 1px solid #2a2a2a, border-radius: 8px
- Entrance animation: card scales from 0.9 to 1.0 and fades in, duration 300ms, easing: ease-out
- Auto-dismiss after 8 seconds if user does not interact, OR dismiss on button tap
- On dismiss: fade out, duration 200ms
- Only show once per milestone per browser session (track triggered milestone IDs in sessionStorage)
- If multiple milestones crossed at once, show them sequentially — one at a time, not stacked

---

## Stats Panel Specs

### Three-block layout
- On desktop: horizontal row of three equal-width panels, 16px gap
- On mobile: stacked vertically, or two-up top row + one full-width below

### Miles Logged
- Number: Oswald 700, 36px (desktop) / 32px (mobile), white
- Label: Inter 400, 13px, #9ca3af, "miles logged"
- Display with thousands separator: "14,203"

### Percent of Goal
- Number: Oswald 700, 36px / 32px, white
- Label: Inter 400, 13px, #9ca3af, "of our goal"
- Display as integer: "70%" (round down)
- Include a 4px-tall progress bar directly below this block, full-width of the block
  - Track: #1f1f1f. Fill: #f97316. No animation needed — this is a snapshot not a live counter.

### Next Milestone
- Milestone name: Oswald 700, 20px / 18px, white
- Distance: Inter 400, 14px, #f97316, "[X] miles away"
- If no upcoming milestone (goal complete): show "Goal reached!" with confetti moment

---

## Recent Activity Feed Specs

- **Desktop:** Show last 5 approved submissions
- **Mobile:** Show last 3
- **Per row:** Name/class name (truncated at 24 chars with ellipsis), date (short format: "Mar 18"), miles added (prefixed "+", colored #f97316)
- **Row height:** 40px (desktop) / 36px (mobile)
- **Dividers:** 1px #1f1f1f between rows. No outer border on the list.
- **Empty state:** "No activity yet. Be the first to log miles." — Inter 400, 14px, #6b7280. Centered.
- **Loading state:** Three placeholder rows with pulse skeleton animation (bg: #1f1f1f, animating to #2a2a2a and back, 1.5s loop)

---

## Loading States

### Map Loading
- Show the stats panel and header immediately — they load from a fast JSON API call
- Map container: solid #0a0a0a background while Mapbox tiles load
- Do not show a spinner over the map — the map appears as tiles arrive, which is the expected Mapbox behavior

### Stats Loading
- On initial load, show skeleton loaders in the stats blocks: rounded rectangles in #1f1f1f
- Skeleton dimensions match the expected number/label layout
- Replace with real data when the API response resolves

### Error State (stats API failure)
- Show "--" in all stat fields
- Small inline text below: "Could not load progress · Retry" where "Retry" is a tappable text link that re-fetches
- Map still renders with San Diego as starting point

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile < 640px | Single column. Map full-width, 55vh. Stats stacked. Activity feed: 3 items. Log CTA fixed to bottom. |
| Tablet 640–1024px | Single column. Map full-width, 60vh. Stats row: 3 across. Activity feed: 5 items. Log CTA in header. |
| Desktop > 1024px | Map full-width, 65vh minimum. Stats row below map, 3 equal columns. Activity feed full row. Log CTA in header. |

---

## Typography

| Element | Font | Weight | Size (desktop) | Size (mobile) | Color |
|---------|------|--------|----------------|---------------|-------|
| Wordmark | Oswald | 700 | 20px | 18px | #ffffff |
| Stats number | Oswald | 700 | 36px | 32px | #ffffff |
| Stats label | Inter | 400 | 13px | 12px | #9ca3af |
| Next milestone name | Oswald | 700 | 20px | 18px | #ffffff |
| Next milestone distance | Inter | 400 | 14px | 13px | #f97316 |
| Section heading (Recent Activity) | Oswald | 700 | 13px | 12px | #6b7280 |
| Activity row — name | Inter | 400 | 14px | 13px | #d1d5db |
| Activity row — miles | Inter | 500 | 14px | 13px | #f97316 |
| Milestone celebration heading | Oswald | 700 | 32px | 28px | #ffffff |
| CTA button | Oswald | 700 | 18px | 16px | #ffffff |

---

## Open Questions / Decisions for Frontend

1. Does the stats API return a `newly_triggered_milestone` object, or does the frontend compare against a last-seen state to determine if a celebration should fire? Recommend: API includes a `newly_triggered` boolean on milestone records — confirm with api-builder.
2. How frequently should the stats panel auto-refresh? Recommend: every 60 seconds via polling (no websocket needed for v1).
3. Should the recent activity feed refresh on the same interval as stats? Recommend: yes, same 60s interval.
4. What Mapbox style should be used — `mapbox-dark` out of the box or a custom style for brand alignment? Recommend: start with `dark-v11`, create a custom style only if the out-of-box look is insufficient.
5. Route GeoJSON format: confirm with api-builder whether the full route is returned as a single GeoJSON feature or split into traveled/remaining segments. Frontend spec assumes the API returns total miles and the frontend constructs the split from the full route GeoJSON.
