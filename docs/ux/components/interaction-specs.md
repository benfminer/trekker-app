# Component Interaction Specs
> Artifact type: Component Interaction Specs
> Last updated: 2026-03-19

Covers all non-trivial interactive components across the four screens: Log Entry, Leaderboard, Admin Login, and Hike Log List.

---

## Component: Log Entry Form

**Purpose:** Collect name, date, and activity amount (miles or steps) and submit them to the mileage total.
**Used on:** /log

### States

| State | Description | Visual cue |
|-------|-------------|------------|
| Default | Form visible, ready for input. Date pre-filled to today. Miles/Steps toggle set to Miles. | All fields empty except date. Submit button active. |
| Filled (partial) | User has entered some fields but not all. | Filled fields show user input in white. Empty required fields look the same until submit is attempted. |
| Filled (complete) | All required fields filled. | No visual change to indicate readiness — don't add a green checkmark or similar. Just let the user submit. |
| Submitting | POST request is in flight. | Submit button: text changes to `···` (three dots), opacity 70%, pointer-events: none. Button width stays constant (use `min-width` to prevent layout shift as text changes). |
| Error (validation) | One or more fields failed validation on submit attempt. | Invalid fields: border-color #ef4444. Error message below the field in Inter 400, 13px, #ef4444. Error messages fade in (opacity 0 → 1, 150ms). Submit button returns to active. |
| Error (API failure) | POST failed — network error or server 500. | Error banner appears above submit button: text "Something went wrong. Try again." bg: #1a0a0a, border-left 3px solid #ef4444, Inter 400, 14px. Form stays filled. Button active. Banner dismissible (× icon) or auto-clears on next submit attempt. |
| Success | POST succeeded. | Form replaced by success state (see Success component spec below). Transition: form fades to opacity 0 over 150ms, success content fades in over 200ms. |

### Transitions
- Default → Submitting: button text change only. 0ms — instant snap. No animation for the text swap itself; the spinner/dots convey state.
- Submitting → Error: button restores instantly. Error messages fade in (150ms ease).
- Submitting → Success: form fades out (150ms), success fades in (200ms).
- Submitting → API Error: button restores instantly. Error banner slides down from above (translateY -8px → 0, opacity 0 → 1, 200ms ease-out).

### Miles/Steps Toggle

| State | Description | Visual cue |
|-------|-------------|------------|
| Miles active (default) | Miles tab is selected. | Active tab: bg #f97316, text #ffffff. Inactive tab: bg transparent, border 1px solid #2a2a2a, text #6b7280. |
| Steps active | Steps tab is selected. | Same inversion. |
| Transition | Switching between tabs. | Active tab background: color transition 100ms ease. Steps hint text: opacity 0 → 1 over 150ms ease. |

- The value input's label updates immediately when the toggle changes: "Miles" ↔ "Steps". No animation — snap.
- The value field is NOT cleared on toggle — the user may have typed before switching.
- Steps hint text ("2,500 steps ≈ 1 mile"): `transition: opacity 150ms ease`. Hidden (opacity 0, height 0, overflow hidden) in Miles mode; visible in Steps mode.

### Field Validation Rules

| Field | Rule | Error message |
|-------|------|---------------|
| Name | Required. Non-empty string after trim. | "Please enter a name or class name." |
| Date | Required. Must not be in the future. Must be a valid date. | "Date can't be in the future." / "Please enter a valid date." |
| Value | Required. Must be a number > 0. | "Enter a number greater than 0." |

- Validate only on submit attempt, not on blur or change.
- Once an error is showing, re-validate on change (live correction feedback).
- Field error clears when the field value passes validation.

### Edge Cases
- Name field: `maxlength="100"`. No visible character counter.
- Value field: `min="0.01"`, `step="any"`. Max is not enforced client-side (admin handles outliers).
- Date field: `max` attribute set to today's ISO date string on component mount. Updated on mount only — no real-time refresh needed (this is a form, not a live display).

### Responsive Behavior
- Mobile (< 640px): Full-bleed form, 20px horizontal padding. All as designed above.
- Tablet/Desktop (> 640px): 480px max-width, auto-centered. Identical interaction behavior.

---

## Component: Log Entry Success State

**Purpose:** Confirm the submission was received and give the user a sense of contribution.
**Used on:** /log (replaces the form after successful submit)

### States

| State | Description | Visual cue |
|-------|-------------|------------|
| Default | Confirmation showing credited miles. | Checkmark icon, miles figure, secondary CTA, "Log more" link. |
| Transitioning to form | User taps "Log more activity." | Success state fades out (150ms), form fades in (200ms) with all fields reset. |

### Content Variants
- Miles submission: "You just added **3.2 miles** to the journey."
- Steps submission: "You just added **2.4 miles** (6,000 steps) to the journey."
- The bold number is the converted miles value returned by the API.

### Checkmark Icon
- `<svg>` or Unicode check circle: ✓ surrounded by an orange circle.
- Size: 48px
- Color: #f97316
- Entrance: icon scales from 0.6 → 1.0 with ease-out spring, duration 280ms, delay 150ms after the form fades out. Feels like a pop, not a float.

### "Log more activity" behavior
- Text link, #f97316, Inter 400, 14px.
- On tap: clears name field, clears value field. Resets date to today. Resets toggle to Miles. Replaces success state with form (fade transition).
- Does NOT do a page reload.

---

## Component: Admin Login Form

**Purpose:** Authenticate the admin and establish a session.
**Used on:** /admin

### States

| State | Description | Visual cue |
|-------|-------------|------------|
| Default | Form empty, ready for input. | Username and password fields empty. Log In button active. |
| Filled | Credentials entered. | Field text visible. |
| Submitting | POST to auth endpoint in flight. | Log In button: text "···", opacity 70%, pointer-events: none. |
| Error | Credentials wrong, or fields empty. | Error message below the button: "Username or password is incorrect." OR field-level: empty field gets border-color #ef4444 + message "This field is required." Inter 400, 14px, #ef4444. |
| Authenticated | Credentials correct. | No visible state change — redirect fires immediately to /admin/submissions. |

### Transitions
- Default → Submitting: button text change, instant.
- Submitting → Error: button restores instantly. Error message fades in (150ms ease).
- Submitting → Authenticated: immediate redirect. No transition needed.

### Edge Cases
- Password field: `type="password"`, no show/hide toggle in v1. Browser default masking.
- Username field: `autocomplete="username"`. Password field: `autocomplete="current-password"`. Allows browser password managers.
- On Enter key in either field: submit the form. Standard HTML form behavior.

---

## Component: Submissions Table Row Actions

**Purpose:** Let admins flag, edit, and delete individual submissions in place.
**Used on:** /admin/submissions

### Flag Toggle

| State | Description | Visual cue |
|-------|-------------|------------|
| Unflagged | Submission is counted in the total. | Flag icon: outlined, #4b5563. Row: standard alternating background. |
| Flagging (in-flight) | PATCH request fired. | Optimistic update: icon immediately turns orange (#f97316). If request fails: icon reverts to gray. No spinner — optimistic is the right call for a binary toggle. |
| Flagged | Submission is excluded from total. | Flag icon: filled, #f97316. Row background: rgba(251,191,36,0.04). |
| Unflagging (in-flight) | PATCH to remove flag. | Optimistic update: icon reverts to gray immediately. Row background fades back to default. |

Transition: color change on icon, 100ms ease. Row background tint: transition 200ms ease.

### Edit Row

| State | Description | Visual cue |
|-------|-------------|------------|
| Closed | Standard table row. | Row shows read-only data. Edit icon visible in actions column. |
| Opening | Edit icon tapped. | Inline edit panel inserts below the row. Expand animation: height from 0 to full over 200ms, ease-out. Opacity 0 → 1 over 150ms simultaneously. |
| Editing | Admin is modifying fields. | Edit row visible with prefilled field values. Save and Cancel controls visible. |
| Saving | PATCH request in flight. | Save button: spinner, opacity 70%, disabled. Fields remain editable (do not lock them — user might need to correct while in flight; API will respond). |
| Save error | PATCH failed. | Error message inside edit row: "Could not save. Check your values." Inter 400, 13px, #ef4444. Save button restores. |
| Save success | PATCH succeeded. | Edit row collapses (reverse of open animation, 150ms). Parent row updates to show new values. Row background flashes to rgba(249,115,22,0.10) and fades back to transparent over 600ms ease-out. |
| Cancel | Admin taps Cancel. | Edit row collapses without saving. Parent row unchanged. No animation needed for cancel — just snap close. |

Rule: Only one row in edit mode at a time. Opening a second row collapses any currently open edit row without saving.

### Delete Confirmation

| State | Description | Visual cue |
|-------|-------------|------------|
| Default | No confirmation showing. | Trash icon in actions column. |
| Confirming | Trash icon tapped. | Action icons in that row are replaced by inline confirmation text: "Remove [X] miles? [Delete] [Cancel]". No animation needed — instant replacement. |
| Deleting | Admin taps Delete. | DELETE request fires. Confirmation text stays visible. After 100ms, row begins fade-out (opacity 1→0, 200ms). |
| Delete success | Request succeeded. | Row height collapses to 0 over 150ms after fade completes. Row removed from DOM. No toast needed. |
| Delete failure | Request failed. | Confirmation text replaced by error: "Could not delete." with a Retry link. Row stays visible. |
| Canceled | Admin taps Cancel. | Confirmation replaced by normal action icons. Instant snap, no animation. |

### Skeleton Loading (initial table load)

| State | Description | Visual cue |
|-------|-------------|------------|
| Loading | Table data not yet returned. | 10 rows of skeleton content. Each row matches the same height (48px) and column structure as real rows. Skeleton cells are rounded rectangles, bg #1a1a1a. |
| Skeleton animation | Conveying data is on its way. | `background: linear-gradient(90deg, #1a1a1a 25%, #262626 50%, #1a1a1a 75%)`. `background-size: 200% 100%`. `animation: shimmer 1.5s linear infinite`. Each row has a staggered `animation-delay` of 0, 0.1s, 0.2s ... (up to 10 rows). Stagger is subtle — 0.1s between rows is enough to feel alive without being distracting. |
| Transition to loaded | Data arrives. | All skeleton rows replaced simultaneously. No stagger on entry. Loaded rows fade in together (opacity 0 → 1, 200ms). |

---

## Component: Milestone Celebration Overlay

**Purpose:** Mark a moment when the collective mileage crosses a milestone — a new country, city, ocean, or continent. Make it feel earned.
**Used on:** / (leaderboard/map page)

### States

| State | Description | Visual cue |
|-------|-------------|------------|
| Hidden | No new milestone pending. | Nothing visible. |
| Entering | Overlay triggered by new milestone in API response. | Backdrop fades in (opacity 0 → 0.85, 200ms). Card animates in (scale 0.92 → 1.0, opacity 0 → 1, 280ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` — slight overshoot). |
| Active | Overlay showing. | Full-screen backdrop + centered card. "KEEP TREKKING" button visible. Auto-dismiss timer running (8 seconds). |
| Auto-dismissing | 8 seconds elapsed with no user action. | Same dismiss animation as manual. |
| Dismissing (manual) | User taps "KEEP TREKKING". | Backdrop fades to opacity 0 (200ms). Card fades simultaneously. After animation, DOM node hidden (not removed — may be needed for queued milestones). |
| Dismissed | Overlay gone. Next milestone in queue shows, if any. | Nothing. Or next overlay enters if queued. |

### Transition timing summary
- Backdrop enter: 200ms ease-in
- Card enter: 280ms `cubic-bezier(0.34, 1.56, 0.64, 1)` — the overshoot spring gives it energy without being cartoonish
- Exit: 200ms ease-out (both backdrop and card together)

### Queue behavior
- If 2 or more milestones were crossed since last poll (unlikely but possible with large submissions), show them sequentially: first in, first out.
- Wait for full dismiss animation to complete before showing the next.
- If the user is not on the page when milestones are crossed (they load the page later), show all pending milestones in sequence on page load. Do not suppress them — they deserve the moment.

### Edge Cases
- Page loads with 0 new milestones: nothing shows. This is the common case.
- Milestone has already been seen this session (ID in sessionStorage): skip it entirely — do not show, do not queue.
- Network error on poll: do not show a celebration overlay. A milestone you're not sure about is not worth the noise.

---

## Component: Current Position Marker (Map)

**Purpose:** Show where the TRACE Suns are right now on their global route.
**Used on:** / (leaderboard/map page)

### States

| State | Description | Visual cue |
|-------|-------------|------------|
| Default / pulsing | Normal display on the map. | Inner dot: 12px circle, #f97316, 2px white border. Outer ring: same size initially, animates outward. |
| Pulse animation | Continuous. Indicates live status. | `@keyframes pulse`: outer ring scales from 1.0x to 2.2x, opacity from 0.6 to 0, over 2000ms, infinite, ease-out. The inner dot does not move. |
| Popup open | User taps/clicks the marker. | Mapbox popup appears above the marker: "[Location], [Country] · [X,XXX] miles into the journey." bg #111111, border 1px solid #2a2a2a, Inter 400, 13px. Popup closes on clicking/tapping elsewhere on the map. |
| Popup closed | User dismisses or clicks away. | Popup hidden. Marker continues pulsing. |

### Edge Cases
- Location name not available (API does not return one): show "— · [X,XXX] miles into the journey"
- Marker off-screen (user has panned away): marker is invisible but present in the DOM. Panning back reveals it.

---

## Component: Stats Skeleton Loader

**Purpose:** Fill the stats panel while the API call resolves on initial page load.
**Used on:** / (leaderboard)

### States

| State | Visual |
|-------|--------|
| Loading | Three skeleton blocks. Each has a "number" placeholder (120px × 36px) and a "label" placeholder (80px × 14px). bg #1a1a1a. Shimmer animation (see Skeleton Loading spec above). |
| Loaded | Real data replaces skeletons. Cross-fade: opacity 0 → 1 over 200ms. |
| Error | "--" in place of numbers. Labels remain. Retry link below. |

---

## Shared Interaction Standards

These apply to all interactive elements across all screens.

### Hover states
- Transition: `color 100ms ease` for text/icon color changes
- Transition: `background-color 100ms ease` for background changes
- Transition: `border-color 100ms ease` for border changes
- Never use `transition: all` — it causes expensive repaints on properties that don't need to transition

### Focus states (keyboard navigation)
- All buttons, links, and inputs: `outline: 2px solid #f97316; outline-offset: 2px` on `:focus-visible`
- Never `outline: none` without providing an equivalent visible alternative
- Inputs already shift border-color to #f97316 on focus — this also serves as the focus indicator

### Disabled states
- Opacity: 70% (`opacity: 0.7`)
- `cursor: not-allowed`
- `pointer-events: none`
- No color change beyond the opacity reduction

### Loading state (buttons)
- Button text replaced with `···` (three dots) — not a spinning SVG icon for simplicity in v1
- Button width must not change when text changes — use `min-width` set to the button's natural width, or a fixed width
- `pointer-events: none` during loading

### Error states (general)
- Error text: Inter 400, 13px (form fields) / 14px (banners), #ef4444
- Transition: opacity 0 → 1, 150ms ease-in
- Positioning: immediately below the relevant field, or above the submit button for page-level errors
- Language: friendly and direct — "Something went wrong. Try again." not "Error 500: Internal Server Error"
- Never red backgrounds for errors — use the border and text color only (the red bg pattern is harsh and feels alarmist for a school app)
