# User Flows: TRACE Trekkers
> Artifact type: User Flows
> Last updated: 2026-03-19

---

## Overview

Four distinct user flows cover the full TRACE Trekkers experience. Two are public-facing (log entry, leaderboard); two are admin-only (login, hike log management). All flows share the same visual system — dark surfaces, orange (#f97316) as the primary action color, Oswald for display type, Inter for body.

---

## Flow 1: Log Entry (Public)

**User:** Any student, teacher, or staff member at TRACE
**Goal:** Submit miles or steps toward the school's collective mileage total
**Entry point:** A shared link in a class channel, email, or internal announcement — or the "Log Activity" CTA on the leaderboard/map page

### Steps

1. **Page loads at /log**
   - Happy path: Form renders immediately. No login, no loading state. Name field is focused on desktop.
   - Edge case: Slow connection — form is static HTML with no async dependencies. It renders without waiting for anything.

2. **User enters their name or class name**
   - Happy path: Types freely. Any string accepted. No format enforced.
   - Edge case: Submits with blank name — inline error below field: "Please enter a name or class name."

3. **User confirms or changes the date**
   - Happy path: Date defaults to today. User sees it, accepts it, moves on.
   - Edge case: Submitting for a prior day — user taps the date field and changes it using the native date picker.
   - Edge case: Future date entered — blocked server-side; inline error on submit: "Date can't be in the future."

4. **User selects Miles or Steps**
   - Happy path: Defaults to Miles. User taps Steps if needed.
   - No edge case. Toggle is binary — one option is always active.

5. **User enters their value**
   - Happy path: Numeric input. User types a number and moves on.
   - Edge case: Zero or negative — inline error: "Enter a number greater than 0."
   - Edge case: Steps selected — passive hint appears: "2,500 steps ≈ 1 mile." No blocking.
   - Edge case: Absurdly large value — form accepts it; admin can delete from the hike log.

6. **User submits**
   - Happy path: Submit button shows loading state. POST fires. Success state renders.
   - Edge case: Network failure or server error — form stays filled. Error banner: "Something went wrong. Try again."
   - Edge case: API validation failure — field-level error appears next to the offending input.

7. **Success state renders**
   - Form is replaced by a confirmation. Shows credited miles (and step count if steps were entered).
   - Secondary CTA: "See where we are" → routes to / (map/leaderboard)
   - Text link: "Log more activity" — resets the form in place without page reload.

**Exit point:** User has submitted their activity. The collective total is updated. They may navigate to the map, or close the page.
**Emotional arc:** Calm and frictionless on entry. Genuinely satisfying at the end — feels like a real contribution, not form-filling.

---

## Flow 2: Public Leaderboard / Progress View (Public)

**User:** Any community member — student, teacher, staff, or visitor with the link
**Goal:** See where the TRACE Suns are in their circumnavigation; feel the scale of the collective effort
**Entry point:** App home (/) — direct link, shared URL, or redirect from the log entry success state

### Steps

1. **Page loads**
   - Happy path: Stats render from a fast API call. Map tiles load in the background. Progress toward goal is immediately visible.
   - Edge case: Slow connection — stats panel is visible and readable immediately. Map loads progressively as tiles arrive. No blocking spinner over the whole page.
   - Edge case: API failure — stats show "--" with a retry link. Map renders at San Diego starting point.

2. **User reads the total progress**
   - Sees: total miles logged, percentage of the 20,286-mile goal, a progress bar.
   - No interaction required. This is ambient information.

3. **User sees the next milestone**
   - A callout names the next milestone destination and distance remaining to it.
   - Reached milestones are shown in a scrollable list below the main stats.

4. **User sees the map**
   - The route from San Diego is drawn on the map. The traveled portion is orange. The remaining route is muted.
   - The current position marker pulses to convey live status.
   - The map auto-centers on the current position at a regional zoom level.

5. **User scans the milestone list**
   - A list of all milestones — reached and upcoming — is displayed below the map.
   - Reached milestones show the date they were crossed. Upcoming milestones show distance remaining.
   - No interaction required. Scrollable on mobile.

6. **User scans recent activity**
   - A feed of recent approved submissions shows who contributed and how much.
   - Desktop: last 5 entries. Mobile: last 3.

7. **User taps "Log Activity"**
   - Persistent CTA — fixed to bottom on mobile, in the header on desktop.
   - Routes to /log.

**Exit point:** User has a felt sense of the journey's progress. They may log their own miles, share the URL, or return later to check again.
**Emotional arc:** Arrives curious. Leaves with a real sense of collective momentum. The map and milestone list should make the distance feel earned, not abstract.

---

## Flow 3: Admin Login (Admin)

**User:** One of 2 TRACE admins
**Goal:** Access the submission management dashboard
**Entry point:** Direct navigation to /admin — URL is not publicly linked

### Steps

1. **Admin navigates to /admin**
   - Happy path: Login form renders immediately.
   - Edge case: Admin already has a valid session — redirect to /admin/submissions, skip login.

2. **Admin enters username and password**
   - Happy path: Correct credentials → POST to auth endpoint → session token stored → redirect to /admin/submissions.
   - Edge case: Wrong credentials → inline error: "Username or password is incorrect."
   - Edge case: Empty fields → field-level errors: "This field is required." (highlighted borders on empty fields)
   - Edge case: One field blank → only the blank field is flagged.

3. **Authentication succeeds**
   - Session token stored (httpOnly cookie preferred).
   - Admin is redirected to /admin/submissions.

**Exit point:** Admin is logged in and viewing the submissions dashboard.
**Emotional arc:** Efficient. No friction. Admins know the URL. Just get them in.

---

## Flow 4: Hike Log Management (Admin)

**User:** Authenticated admin
**Goal:** Review submissions, catch bad data, edit or delete problem entries, keep the mileage total accurate
**Entry point:** /admin/submissions — reached after login, or by navigating directly (session must be valid)

### Steps

1. **Dashboard loads**
   - Happy path: Submissions table populates with all entries, most recent first. Page heading shows total miles and total submission count.
   - Loading state: Skeleton rows in the table while data fetches. Filter bar renders immediately.
   - Edge case: Fetch fails — error banner above table: "Could not load submissions. [Retry]"
   - Edge case: Zero submissions — empty state in the table body.

2. **Admin scans the table**
   - Sees per row: name, date, input type (Mi/Stps), raw input value, converted miles, source (Web/Import), flag status, and actions (edit, delete).
   - Default sort: date descending (most recent first).
   - Scans for outliers: very high values, duplicate name+date combinations, suspicious entries.

3. **Admin filters submissions (optional)**
   - Text search by name — debounced 200ms, case-insensitive substring match.
   - Toggle: "Flagged only" — shows only flagged rows.
   - Toggle: "Imported only" — shows only CSV-imported records.
   - Filters stack. "Clear filters" link appears whenever any filter is active.

4. **Admin edits a submission**
   - Taps the edit icon on a row.
   - An inline edit panel expands below the row. Editable fields: name, date, input type, value.
   - Admin saves → PATCH request fires → row updates in place with a brief orange highlight flash.
   - Admin cancels → edit panel collapses, no changes saved.
   - Rule: Only one row can be in edit mode at a time.

5. **Admin flags a submission**
   - Taps the flag icon on a row → optimistic update (icon turns orange immediately).
   - PATCH request fires in background. Reverts if request fails.
   - Flagged submissions are excluded from the mileage total (API behavior).
   - Tapping again un-flags.

6. **Admin deletes a submission**
   - Taps the trash icon on a row.
   - Inline confirmation replaces the action icons: "Remove [X] miles? [Delete] [Cancel]"
   - On confirm: DELETE request fires, row fades out (200ms), height collapses (150ms), removed from DOM.
   - On cancel: confirmation collapses, icons return.
   - If request fails: error toast appears, row stays.

7. **Admin paginates**
   - 50 rows per page. Prev/Next controls below the table.
   - On page change: scroll to top of table.
   - Pagination controls hidden when only one page.

8. **Admin logs out**
   - Taps "Log Out" in the header.
   - Session token cleared. Redirected to /admin.
   - No confirmation dialog.

**Exit point:** Admin has reviewed and corrected submissions. The mileage total now reflects clean data.
**Emotional arc:** Efficient and trustworthy. The admin is in control. Nothing surprising, nothing slow, nothing that requires thought beyond the actual data.

---

## Cross-Flow Notes

### Navigation between flows

| From | To | How |
|------|-----|-----|
| Log entry success state | Leaderboard | "See where we are" CTA |
| Leaderboard | Log entry | "Log Activity" button (header or fixed bottom) |
| /admin | /admin/submissions | Auto-redirect after login |
| /admin/submissions | / (map) | "← Map" link in admin header |

### Auth boundary

The /admin and /admin/submissions routes are protected. Any request to a protected route without a valid session redirects to /admin (login). All other routes (/, /log) are fully public — no auth check, no redirect.

### URL structure

| Route | Screen | Access |
|-------|--------|--------|
| / | Map + leaderboard | Public |
| /log | Log entry form | Public |
| /admin | Admin login | Public (URL obscured, not linked) |
| /admin/submissions | Hike log management | Protected |
